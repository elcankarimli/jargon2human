import type { Translation } from "./translation";

export type Example = {
  id: string;
  label: string;
  category: string;
  text: string;
  preview: Translation;
};

// Bunlar nümayiş üçün əvvəlcədən yazılmış nümunələrdir, canlı AI cavabları deyil.
export const EXAMPLES: Example[] = [
  {
    id: "bank",
    label: "Bank şərtləri",
    category: "Bank xidmətləri müqaviləsi",
    text: "Bank, müştərini əvvəlcədən xəbərdar etmədən, göstərilən xidmətlər üzrə komissiya haqlarını və tarifləri birtərəfli qaydada dəyişdirmək hüququnu özündə saxlayır. Müştərinin xidmətlərdən istifadəyə davam etməsi yeni şərtlərin qeyd-şərtsiz qəbulu hesab olunur.",
    preview: {
      simple: "Bank xidmət haqqını sizə əvvəlcədən xəbər vermədən dəyişə bilər. Xidmətdən istifadə etməyə davam etsəniz, yeni qiymətə razı olduğunuz qəbul edilir.",
      risks: "Xidmət haqqı arta bilər və dəyişiklikdən xəbərsiz istifadə etdikdə əlavə xərc yarana bilər. Bənddə artım həddi, xəbərdarlıq müddəti və ayrıca cərimə məbləği göstərilmir.",
      alternative: "Tarif dəyişiklikləri müştəriyə ən azı 30 gün əvvəl yazılı bildirilməli, müştəriyə dəyişiklik qüvvəyə minənədək əlavə haqq ödəmədən müqaviləyə xitam vermək imkanı yaradılmalıdır.",
    },
  },
  {
    id: "rent",
    label: "İcarə müqaviləsi",
    category: "Yaşayış sahəsinin icarəsi",
    text: "İcarəçi müqaviləyə vaxtından əvvəl xitam verdikdə, səbəbindən asılı olmayaraq, ödədiyi təminat depoziti geri qaytarılmır. İcarəyə verən depozitdən əlavə olaraq qalan icarə müddəti üçün ödənişlərin tam həcmdə ödənilməsini tələb edə bilər.",
    preview: {
      simple: "Evdən razılaşdırılan vaxtdan əvvəl çıxsanız, depozitinizi itirə bilərsiniz. Ev sahibi qalan ayların kirayəsini də sizdən tələb edə bilər.",
      risks: "Həm depoziti itirmək, həm də artıq yaşamadığınız ev üçün qalan müddətin kirayə haqqını ödəmək tələbi ilə üzləşə bilərsiniz. Bənddə üzrlü səbəblər və ödənişin yuxarı həddi nəzərə alınmayıb.",
      alternative: "İcarəçi 30 gün əvvəl yazılı bildiriş verməklə müqaviləyə xitam verə bilər; depozitdən yalnız sənədlə təsdiqlənən borc və zərər çıxılır, xitamdan sonrakı dövr üçün icarə haqqı tələb edilmir.",
    },
  },
  {
    id: "service",
    label: "Xidmət müqaviləsi",
    category: "Rəqəmsal xidmət abunəliyi",
    text: "Abunəlik müddətin bitməsinə ən azı 30 gün qalmış yazılı qaydada ləğv edilmədikdə, avtomatik olaraq növbəti 12 ay müddətinə uzadılır. Yenilənmə tarixində illik xidmət haqqı tam tutulur və istifadə edilməyən müddət üçün ödəniş geri qaytarılmır.",
    preview: {
      simple: "Abunəliyin bitməsinə ən azı 30 gün qalmış yazılı ləğv etməsəniz, daha bir il üçün yenilənir. İllik ödəniş birdəfəlik tutulur və istifadə etmədiyiniz ayların pulu qaytarılmır.",
      risks: "Ləğv tarixini ötürsəniz, istifadə etmək istəmədiyiniz xidmət üçün daha bir ilin xərcini ödəyə bilərsiniz. Bənddə yenilənmədən əvvəl xatırlatma öhdəliyi göstərilmir.",
      alternative: "Yenilənmədən ən azı 45 gün əvvəl müştəriyə bildiriş göndərilməli və illik abunəlik yalnız onun ayrıca, açıq razılığı ilə uzadılmalıdır.",
    },
  },
];
