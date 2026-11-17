# Jargon2Human

Mürəkkəb hüquqi mətnləri sadə Azərbaycan dilinə çevirən Next.js App Router, TypeScript və Tailwind CSS tətbiqi.

## İşə salmaq

Node.js 22.18+ və npm istifadə edin (bu layihənin asılılıqsız TypeScript testləri üçün).

Windows mühitində sabit işləməsi üçün development və build skriptləri Next.js-in dəstəklədiyi Webpack rejimindən istifadə edir.

Əsas asılılıqlar yoxlanılan versiyalara sabitlənib. `npm install` istifadə etdiyiniz platformaya uyğun lock faylını yaradır.

```powershell
npm install
Copy-Item .env.example .env.local
```

`.env.local` faylında `GROQ_API_KEY` dəyərini [Groq Console](https://console.groq.com/keys) açarınızla doldurun. Açarı brauzer koduna, `NEXT_PUBLIC_*` dəyişəninə və ya Git-ə əlavə etməyin.

```powershell
npm run dev
```

Brauzerdə http://localhost:3000 ünvanını açın.

## Model seçimi

Tələbə uyğun standart model `llama-3.3-70b-versatile` saxlanılıb. Groq-un 17 noyabr 2026 tarixində yoxlanılan sənədlərinə əsasən, bu model 16 avqust 2026 tarixindən pulsuz və developer hesablarında dayandırılıb; uyğun enterprise müqavilələri istisnadır. Adi hesab üçün `.env.local` daxilində əlçatan model seçin:

```dotenv
GROQ_MODEL=openai/gpt-oss-120b
```

Mənbələr: [Groq model dəyişiklikləri](https://console.groq.com/docs/deprecations), [JSON çıxışı](https://console.groq.com/docs/structured-outputs).

Model özbaşına dəyişdirilmir; seçilən model əlçatan deyilsə aydın xəta qaytarılır. API açarı olmadığı halda canlı təhlil 503 qaytarır. “Hazır demo nəticəsinə bax” ayrıca, əvvəlcədən yazılmış nümunələri göstərir və bunları AI cavabı kimi təqdim etmir.

## Funksiyalar

- Mobil və masaüstü üçün tünd interfeys; emerald, rose və amber nəticə kartları.
- Bank, icarə və xidmət müqaviləsi nümunələri.
- Hər nəticəni ayrıca köçürmək, mətni təmizləmək, sorğunu dayandırmaq.
- Yüklənmə animasiyası, lokal xəta mesajları və əlçatan klaviatura idarəetməsi.
- `POST /api/translate`: `{ "text": "..." }` qəbul edir; `{ "simple": "...", "risks": "...", "alternative": "..." }` qaytarır.
- Serverdə giriş uzunluğu (20–8000 simvol), sorğu həcmi (40 KB), JSON sahələri, yarımçıq cavablar və 30 saniyəlik provider timeout yoxlanılır.
- `response_format: { type: "json_object" }`; cavab sahələri əlavə olaraq serverdə doğrulanır.
- Sənəd paketi üçün işlək e-poçt keçidi; ünvan `CONTACT_EMAIL` ilə dəyişdirilir.

## Yoxlama və istehsal build-i

```powershell
npm test
npm run typecheck
npm run build
npm start
```

Testlər həqiqi Groq sorğusu göndərmir və açar tələb etmir. Sorğu formatı, standart və alternativ model, giriş limitləri, etibarsız JSON, cavab strukturu, kəsilmiş cavab, 429, timeout və digər provider xətaları yoxlanılır.

17 noyabr 2026 yoxlaması: 16/16 test, TypeScript yoxlaması və Webpack istehsal build-i uğurludur. Server başlasa da, icra mühitinin localhost bağlantı məhdudiyyəti səbəbindən brauzer yoxlaması tamamlanmayıb. Canlı sorğu cəhdində Groq bağlantısı alınmayıb; real model cavabı təsdiqlənməyib.

## Fayl quruluşu

```text
app/
  api/translate/route.ts  — Groq server inteqrasiyası
  globals.css            — Tailwind və interfeys üslubları
  layout.tsx             — Azərbaycan dili və metadata
  page.tsx               — əsas səhifə
components/
  translator.tsx         — redaktor, nəticələr və interaksiyalar
lib/
  examples.ts            — müqavilə və demo nümunələri
  translation.ts         — tip, validasiya, sistem promptu
tests/
  translate.test.ts      — API davranış testləri
```

## Məlumatların işlənməsi və yerləşdirmə

Tətbiq hüquqi mətnləri bazada, localStorage-da və ya tətbiq loglarında saxlamır. Canlı təhlil zamanı mətn Groq-a göndərilir; provayderin məlumat siyasəti ayrıca tətbiq olunur. İstifadəçi şəxsi və məxfi məlumatları əvvəlcədən silməlidir. AI nəticələri fərdi hüquqi məsləhəti əvəz etmir. “3 saniyə” interfeys mətnidir; faktiki müddət şəbəkə, model və mətnin həcmindən asılıdır və nəticə tamamlandıqda ölçülür.

Next.js Node serverini dəstəkləyən hostinqdə `GROQ_API_KEY`, lazım gəlsə `GROQ_MODEL` və `CONTACT_EMAIL` təyin edin. API marşrutu server tələb etdiyi üçün statik ixrac kifayət etmir. Açıq internetə yerləşdirərkən istifadəçi/IP üzrə sorğu limitini hostinq və ya gateway səviyyəsində qurun; tətbiq hazırda provayderin 429 cavabını idarə edir, ayrıca paylanmış limit sistemi ehtiva etmir.
