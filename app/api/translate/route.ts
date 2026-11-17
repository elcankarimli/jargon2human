import { isTranslation, MAX_TEXT_LENGTH, MIN_TEXT_LENGTH, SYSTEM_PROMPT } from "../../../lib/translation.ts";

export const runtime = "nodejs";
export const maxDuration = 45;

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MAX_BODY_BYTES = 40000;

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

class BodyTooLarge extends Error {}

async function readBody(request: Request): Promise<unknown> {
  if (!request.body) throw new SyntaxError("Empty body");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new BodyTooLarge();
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return JSON.parse(body);
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ error: "Sorğu JSON formatında göndərilməlidir." }, 415);
  }

  let body: unknown;
  try {
    body = await readBody(request);
  } catch (error) {
    return error instanceof BodyTooLarge
      ? json({ error: "Göndərilən mətn çox böyükdür." }, 413)
      : json({ error: "Sorğunun formatı yanlışdır. Yenidən cəhd edin." }, 400);
  }

  if (!body || typeof body !== "object" || !("text" in body) || typeof body.text !== "string") {
    return json({ error: "Təhlil üçün hüquqi mətn daxil edin." }, 400);
  }
  const text = body.text.trim();
  if (text.length < MIN_TEXT_LENGTH || text.length > MAX_TEXT_LENGTH) {
    return json({ error: `Mətn ${MIN_TEXT_LENGTH}–${MAX_TEXT_LENGTH} simvol aralığında olmalıdır.` }, 400);
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return json({ error: "Canlı təhlil hələ aktiv deyil. Hələlik hazır demo nümunəsinə baxa bilərsiniz." }, 503);
  }

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_completion_tokens: 2048,
        stream: false,
      }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(30000)]),
      cache: "no-store",
    });

    if (!response.ok) {
      // Provider cavabını və API açarını istifadəçiyə və loglara ötürməyin.
      console.warn(`Groq translate provider status: ${response.status}`);
      if (response.status === 429) {
        return json({ error: "Hazırda sorğu limiti dolub. Bir qədər sonra yenidən cəhd edin." }, 429);
      }
      if ([400, 401, 403, 404].includes(response.status)) {
        return json({ error: "Təhlil xidməti hazırda əlçatan deyil. API açarı və modelin əlçatanlığı serverdə yoxlanmalıdır." }, 503);
      }
      return json({ error: "Təhlil xidməti cavab vermədi. Bir qədər sonra yenidən cəhd edin." }, 502);
    }

    const payload = await response.json();
    const choice = payload?.choices?.[0];
    if (choice?.finish_reason !== "stop" || typeof choice?.message?.content !== "string") {
      return json({ error: "Təhlil tamamlanmadı. Mətni qısaldaraq yenidən cəhd edin." }, 502);
    }
    const result: unknown = JSON.parse(choice.message.content);
    if (!isTranslation(result)) {
      return json({ error: "Təhlilin formatı düzgün deyil. Yenidən cəhd edin." }, 502);
    }

    return json({
      simple: result.simple.trim(),
      risks: result.risks.trim(),
      alternative: result.alternative.trim(),
    });
  } catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) {
      return json({ error: "Gözləmə müddəti bitdi. Yenidən cəhd edin." }, 504);
    }
    return json({ error: "Təhlil zamanı bağlantı və ya cavab xətası yarandı. Yenidən cəhd edin." }, 502);
  }
}
