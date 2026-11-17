"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, Copy,
  FileText, Lightbulb, LoaderCircle, MessageSquareText, RotateCcw,
  ShieldCheck, Sparkles, TriangleAlert, X, Zap, type LucideIcon,
} from "lucide-react";
import { EXAMPLES, type Example } from "../lib/examples";
import { isTranslation, MAX_TEXT_LENGTH, MIN_TEXT_LENGTH, type Translation } from "../lib/translation";

type Status = "idle" | "loading" | "success" | "demo";
type Card = { key: keyof Translation; title: string; label: string; placeholder: string; icon: LucideIcon; color: string };

const CARDS: Card[] = [
  { key: "simple", title: "Sadə İzah", label: "ƏSLİNDƏ NƏ DEYİLİR?", placeholder: "Mürəkkəb cümlələrin arxasındakı sadə məna — aydın və gündəlik dildə.", icon: Lightbulb, color: "emerald" },
  { key: "risks", title: "Gizli Tələlər və Risklər", label: "NƏYƏ DİQQƏT ETMƏLİ?", placeholder: "Nəzərdən qaça biləcək öhdəliklər, mümkün cərimələr və ən pis ssenari.", icon: ShieldCheck, color: "rose" },
  { key: "alternative", title: "Qarşı Tərəfə Nə Deməli?", label: "SÖZ SİZDƏDİR", placeholder: "Maraqlarınızı qorumaq üçün qarşı tərəfə təklif edə biləcəyiniz alternativ bənd.", icon: MessageSquareText, color: "amber" },
];

function ResultCard({ card, index, content, loading }: { card: Card; index: number; content?: string; loading: boolean }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = card.icon;

  useEffect(() => {
    setCopyState("idle");
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [content]);

  async function copy() {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopyState("idle"), 2500);
  }

  return (
    <article className={`result-card result-${card.color} ${content ? "has-result" : ""}`} aria-labelledby={`title-${card.key}`}>
      <div className="result-icon"><Icon size={18} strokeWidth={1.7} /></div>
      <div className="result-body">
        <div className="result-topline">
          <span className="eyebrow result-label">{card.label}</span>
          <button type="button" className="copy-button" onClick={copy} disabled={!content || loading} aria-label={`${card.title}: ${copyState === "copied" ? "köçürüldü" : "köçür"}`}>
            {copyState === "copied" ? <Check size={13} /> : <Copy size={13} />}
            <span aria-live="polite">{copyState === "copied" ? "Köçürüldü" : copyState === "error" ? "Köçürülmədi" : "Köçür"}</span>
          </button>
        </div>
        <h3 id={`title-${card.key}`}>{card.title}</h3>
        {loading ? <div className="skeleton-lines" aria-hidden="true"><span /><span /><span /></div> :
          <p className={content ? "result-content" : "result-placeholder"}>{content || card.placeholder}</p>}
        {copyState === "error" && <p className="copy-error" role="status">Mətni seçərək əl ilə köçürə bilərsiniz.</p>}
      </div>
      {!content && !loading && <span className="card-number" aria-hidden="true">0{index + 1}</span>}
    </article>
  );
}

export default function Translator({ contactEmail }: { contactEmail: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Translation | null>(null);
  const [error, setError] = useState("");
  const [sampleIndex, setSampleIndex] = useState(0);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const controller = useRef<AbortController | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const results = useRef<HTMLElement>(null);
  const loading = status === "loading";
  const trimmedLength = text.trim().length;
  const selectedExample = EXAMPLES.find((example) => example.text === text.trim());

  useEffect(() => () => controller.current?.abort(), []);

  function updateText(value: string) {
    controller.current?.abort();
    controller.current = null;
    setText(value);
    setError("");
    setResult(null);
    setElapsed(null);
    setStatus("idle");
  }

  function loadExample(example: Example) {
    updateText(example.text);
    textarea.current?.focus();
  }

  function cycleExample() {
    loadExample(EXAMPLES[sampleIndex]);
    setSampleIndex((sampleIndex + 1) % EXAMPLES.length);
  }

  function showDemo() {
    const example = selectedExample || EXAMPLES[0];
    updateText(example.text);
    setResult(example.preview);
    setStatus("demo");
  }

  async function translate(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (trimmedLength < MIN_TEXT_LENGTH) {
      setError(`Təhlil üçün ən azı ${MIN_TEXT_LENGTH} simvol daxil edin.`);
      textarea.current?.focus();
      return;
    }

    const currentController = new AbortController();
    controller.current = currentController;
    setStatus("loading");
    setError("");
    setResult(null);
    setElapsed(null);
    const start = performance.now();

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
        signal: AbortSignal.any([currentController.signal, AbortSignal.timeout(35000)]),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = data && typeof data === "object" && "error" in data && typeof data.error === "string"
          ? data.error : "Sorğu tamamlanmadı. Yenidən cəhd edin.";
        throw new Error(message);
      }
      if (!isTranslation(data)) throw new Error("Cavabın formatı düzgün deyil. Yenidən cəhd edin.");
      if (controller.current !== currentController) return;
      setResult(data);
      setStatus("success");
      setElapsed((performance.now() - start) / 1000);
      if (window.matchMedia("(max-width: 900px)").matches) {
        results.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
      }
    } catch (caught) {
      if (controller.current !== currentController || currentController.signal.aborted) return;
      setStatus("idle");
      setError(caught instanceof Error && caught.name === "TimeoutError"
        ? "Gözləmə müddəti bitdi. Yenidən cəhd edin."
        : caught instanceof SyntaxError ? "Serverin cavabı düzgün formatda deyil. Yenidən cəhd edin."
        : caught instanceof TypeError ? "Bağlantını yoxlayıb yenidən cəhd edin."
        : caught instanceof Error ? caught.message : "Xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      if (controller.current === currentController) controller.current = null;
    }
  }

  function cancel() {
    controller.current?.abort();
    controller.current = null;
    setStatus("idle");
  }

  const contactHref = `mailto:${contactEmail}?subject=${encodeURIComponent("Startap üçün hüquqi sənədlər paketi")}`;

  return (
    <div className="site-shell">
      <a href="#translator" className="skip-link">Tərcümə alətinə keç</a>
      <header className="site-header">
        <a href="/" className="brand" aria-label="Jargon2Human — ana səhifə">
          <span className="brand-mark" aria-hidden="true">j<span>›</span></span>
          <span>Jargon<span className="brand-two">2</span>Human<span className="brand-dot">.</span></span>
        </a>
        <nav aria-label="Əsas naviqasiya" className="header-nav">
          <a href="#how-it-works" className="nav-how">Necə işləyir?</a>
          <a href="#document-package" className="nav-contact">Sənəd paketi <ArrowUpRight size={14} /></a>
        </nav>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-content">
            <div className="hero-badge"><span className="status-dot" /> BİR AZ DAHA AYDINLIQ</div>
            <h1 id="hero-title">Hüquq dili.<br className="mobile-break" /> <span>İnsan dilində.</span></h1>
            <p>Ağır hüquqi mətnləri 3 saniyəyə insan dilinə çevir.</p>
            <div className="hero-meta"><span><Check size={13} /> Sadə izah</span><span><Check size={13} /> Görünməyən risklər</span><span><Check size={13} /> Daha yaxşı şərtlər</span></div>
          </div>
          <div className="hero-note" aria-hidden="true"><span className="note-line" /><p>Kiçik şriftlər.<br />Böyük qərarlar.</p><ArrowDown size={19} strokeWidth={1.2} /></div>
        </section>

        <div className="workspace" id="translator">
          <section className="input-section" aria-labelledby="input-heading">
            <div className="section-heading"><div><span className="step-number">01</span><h2 id="input-heading">Hüquqi mətniniz</h2></div><span className="section-hint">Qarışıq olan hissə</span></div>
            <form onSubmit={translate}>
              <div className={`editor-card ${loading ? "editor-loading" : ""}`}>
                <div className="editor-toolbar"><span><FileText size={15} /> Müqavilə bəndi</span><span className="language-tag"><span /> Azərbaycan dili</span></div>
                <label htmlFor="legal-text" className="sr-only">Sadələşdirmək istədiyiniz hüquqi mətn</label>
                <textarea
                  ref={textarea} id="legal-text" value={text} disabled={loading}
                  onChange={(event) => updateText(event.target.value)} maxLength={MAX_TEXT_LENGTH}
                  placeholder={"Anlamaq istədiyiniz müqavilə bəndini bura yapışdırın…\n\nBank şərtləri, icarə müqaviləsi, xidmət razılaşması və ya sadəcə sizi düşündürən bir cümlə."}
                  aria-describedby={`input-help text-count${error ? " translation-error" : ""}`}
                  spellCheck={false}
                />
                <div className="editor-footer"><span id="input-help">Bir bəndlə başlamaq kifayətdir.</span><div><button type="button" title="Mətni təmizlə" aria-label="Mətni təmizlə" className="clear-button" onClick={() => { updateText(""); textarea.current?.focus(); }} disabled={!text || loading}><RotateCcw size={13} /></button><span id="text-count" className={text.length === MAX_TEXT_LENGTH ? "limit-reached" : ""}>{text.length.toLocaleString("en-US")} <span>/ 8,000</span></span></div></div>
                <div className="editor-actions">
                  <button type="submit" className="translate-button" disabled={loading || !trimmedLength}>
                    {loading ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={17} />}
                    <span>{loading ? "İnsan dilinə çevrilir…" : "İnsan dilinə çevir"}</span>
                    {!loading && <ArrowRight size={17} />}
                  </button>
                  {loading && <button type="button" className="cancel-button" onClick={cancel} aria-label="Təhlili dayandır"><X size={18} /></button>}
                </div>
              </div>

              {error && <div className="error-message" id="translation-error" role="alert"><TriangleAlert size={17} /><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Xəta bildirişini bağla"><X size={15} /></button></div>}

              <div className="examples-area">
                <div className="examples-heading"><span>Əlinizdə mətn yoxdur?</span><button type="button" onClick={cycleExample} disabled={loading}>Nümunə Müqavilə Bəndi Yüklə <ArrowUpRight size={12} /></button></div>
                <div className="sample-buttons">{EXAMPLES.map((example) => <button type="button" key={example.id} onClick={() => loadExample(example)} disabled={loading} aria-pressed={selectedExample?.id === example.id} className={selectedExample?.id === example.id ? "selected" : ""}><FileText size={12} />{example.label}</button>)}</div>
                <button type="button" className="demo-button" onClick={showDemo} disabled={loading}>Əvvəlcə hazır demo nəticəsinə bax <ArrowRight size={13} /></button>
              </div>
            </form>
            <p className="privacy-note"><ShieldCheck size={14} /><span>Təhlil üçün mətn Groq-a göndərilir. Şəxsi məlumatları əvvəlcədən silin.</span></p>
          </section>

          <section className="output-section" ref={results} aria-labelledby="output-heading" aria-busy={loading}>
            <div className="section-heading"><div><span className="step-number">02</span><h2 id="output-heading">Aydın olan hissə</h2></div><span className={`result-status ${status === "success" ? "complete" : ""}`} role="status">{loading ? "Təhlil edilir…" : status === "success" ? `${elapsed?.toFixed(1)} san. · Hazırdır` : status === "demo" ? "Demo nümunəsi" : "Sizin üçün sadələşir"}</span></div>
            {status === "demo" && <div className="demo-notice"><Sparkles size={13} /><span>Hazır nümunədir, canlı AI təhlili deyil.</span></div>}
            <div className="results-stack">{CARDS.map((card, index) => <ResultCard key={card.key} card={card} index={index} content={result?.[card.key]} loading={loading} />)}</div>
            <p className="result-footnote"><span className="footnote-dash" /> Daha aydın mətn. Daha məlumatlı qərar.</p>
          </section>
        </div>

        <section className="document-cta" id="document-package" aria-labelledby="cta-title">
          <div className="cta-art" aria-hidden="true"><div className="mini-document back" /><div className="mini-document front"><span /><span /><span /><ShieldCheck size={18} /></div></div>
          <div className="cta-copy"><div className="eyebrow">QURDUĞUNUZ İŞİ QORUYUN</div><h2 id="cta-title">Böyük ideyalar. Sağlam hüquqi təməl.</h2><p>Startapınız üçün hazır hüquqi sənədlər paketi lazımdır?</p><div className="document-types"><span>Təsisçilər razılaşması</span><span>NDA</span><span>Məxfilik siyasəti</span></div></div>
          <a href={contactHref} className="cta-button">Əlaqə saxlayın <ArrowUpRight size={16} /></a>
        </section>

        <section className="how-it-works" id="how-it-works" aria-labelledby="how-heading">
          <details><summary id="how-heading"><span>Bir mətndən aydın qərara — necə işləyir?</span><ChevronDown size={16} /></summary><div className="how-steps"><p><b>01 · Mətni əlavə edin</b>Müqavilə bəndini yapışdırın və ya nümunələrdən birini seçin.</p><p><b>02 · Təhlili başladın</b>“İnsan dilinə çevir” düyməsi ilə mətni təhlilə göndərin.</p><p><b>03 · Şərtləri anlayın</b>İzahı və riskləri oxuyun, alternativ bəndi köçürüb müzakirə edin.</p></div></details>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-left"><span className="footer-brand">Jargon2Human<span>.</span></span><p>Hüququ anlamaq hər kəsin haqqıdır.</p></div><p className="legal-note">AI yanılmış ola bilər. Nəticələr məlumat xarakterlidir<br className="desktop-break" /> və fərdi hüquqi məsləhəti əvəz etmir.</p><span className="powered-by"><Zap size={12} /> Groq ilə işləyir</span></footer>
    </div>
  );
}
