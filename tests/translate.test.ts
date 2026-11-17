import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/translate/route.ts";
import { isTranslation, MAX_TEXT_LENGTH } from "../lib/translation.ts";

const originalFetch = globalThis.fetch;
const originalKey = process.env.GROQ_API_KEY;
const originalModel = process.env.GROQ_MODEL;
const validText = "Bank müqavilə şərtlərini əvvəlcədən xəbərdarlıq etmədən dəyişdirə bilər.";
const result = { simple: "Sadə izah.", risks: "Mümkün risk.", alternative: "Alternativ bənd." };

beforeEach(() => {
  process.env.GROQ_API_KEY = "test-only-not-a-real-api-key";
  delete process.env.GROQ_MODEL;
  globalThis.fetch = async () => { throw new Error("Unexpected network request in test"); };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.GROQ_MODEL;
  else process.env.GROQ_MODEL = originalModel;
});

function request(body: unknown, contentType = "application/json") {
  return new Request("http://localhost:3000/api/translate", {
    method: "POST", headers: { "Content-Type": contentType }, body: JSON.stringify(body),
  });
}

function mockCompletion(content: unknown, finishReason = "stop") {
  globalThis.fetch = async () => Response.json({ choices: [{ finish_reason: finishReason, message: { content: JSON.stringify(content) } }] });
}

test("valid request uses requested Groq model, JSON mode, and a server-only key", async () => {
  globalThis.fetch = async (input, init) => {
    assert.equal(input, "https://api.groq.com/openai/v1/chat/completions");
    assert.equal(init?.method, "POST");
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer test-only-not-a-real-api-key");
    const body = JSON.parse(init?.body as string);
    assert.equal(body.model, "llama-3.3-70b-versatile");
    assert.deepEqual(body.response_format, { type: "json_object" });
    assert.equal(body.messages[0].role, "system");
    assert.equal(body.messages[1].content, validText);
    return Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ ...result, extra: "not returned" }) } }] });
  };
  const response = await POST(request({ text: validText }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), result);
});

test("server model override is supported", async () => {
  process.env.GROQ_MODEL = "openai/gpt-oss-120b";
  globalThis.fetch = async (_, init) => {
    assert.equal(JSON.parse(init?.body as string).model, "openai/gpt-oss-120b");
    return Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(result) } }] });
  };
  assert.equal((await POST(request({ text: validText }))).status, 200);
});

test("invalid, blank, short and overlong input never reach the provider", async () => {
  for (const body of [null, [], {}, { text: 42 }, { text: " " }, { text: "qısa" }, { text: "a".repeat(MAX_TEXT_LENGTH + 1) }]) {
    assert.equal((await POST(request(body))).status, 400);
  }
});

test("non-JSON requests are rejected", async () => {
  assert.equal((await POST(request({ text: validText }, "text/plain"))).status, 415);
});

test("malformed JSON is rejected", async () => {
  const response = await POST(new Request("http://localhost/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{broken" }));
  assert.equal(response.status, 400);
});

test("oversized bodies are rejected independently of the content-length header", async () => {
  assert.equal((await POST(request({ text: "x".repeat(41000) }))).status, 413);
});

test("missing key returns an honest unavailable error instead of a fake result", async () => {
  delete process.env.GROQ_API_KEY;
  const response = await POST(request({ text: validText }));
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.ok(body.error.includes("Canlı təhlil"));
  assert.equal(body.simple, undefined);
});

test("provider rate limit returns a localized 429 error", async () => {
  globalThis.fetch = async () => Response.json({ error: "private provider details" }, { status: 429 });
  const response = await POST(request({ text: validText }));
  assert.equal(response.status, 429);
  assert.ok((await response.json()).error.includes("limit"));
});

test("invalid credentials and unavailable models do not expose provider details", async () => {
  for (const status of [400, 401, 403, 404]) {
    globalThis.fetch = async () => Response.json({ error: "SECRET PROVIDER RESPONSE" }, { status });
    const response = await POST(request({ text: validText }));
    assert.equal(response.status, 503);
    assert.ok(!(await response.text()).includes("SECRET"));
  }
});

test("provider server errors return 502", async () => {
  globalThis.fetch = async () => new Response("unavailable", { status: 500 });
  assert.equal((await POST(request({ text: validText }))).status, 502);
});

test("missing fields, incorrect field types and empty strings are rejected", async () => {
  for (const content of [{ simple: "x" }, { ...result, risks: [] }, { ...result, alternative: " " }, null, "text"]) {
    mockCompletion(content);
    assert.equal((await POST(request({ text: validText }))).status, 502);
  }
});

test("malformed provider JSON is rejected", async () => {
  globalThis.fetch = async () => Response.json({ choices: [{ finish_reason: "stop", message: { content: "{broken" } }] });
  assert.equal((await POST(request({ text: validText }))).status, 502);
});

test("truncated provider output is rejected even when its JSON is valid", async () => {
  mockCompletion(result, "length");
  assert.equal((await POST(request({ text: validText }))).status, 502);
});

test("timeouts produce a localized 504 error", async () => {
  globalThis.fetch = async () => { throw new DOMException("Timeout", "TimeoutError"); };
  const response = await POST(request({ text: validText }));
  assert.equal(response.status, 504);
  assert.ok((await response.json()).error.includes("Gözləmə"));
});

test("network failures produce a localized error", async () => {
  globalThis.fetch = async () => { throw new TypeError("network unreachable"); };
  assert.equal((await POST(request({ text: validText }))).status, 502);
});

test("translation schema rejects non-objects and accepts the three string fields", () => {
  assert.equal(isTranslation(result), true);
  for (const value of [null, [], "text", {}, { ...result, risks: false }, { ...result, risks: "x".repeat(12001) }]) assert.equal(isTranslation(value), false);
});
