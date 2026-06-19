import { useTrainerStore } from "@/lib/trainer/store";
import { translate, type Locale, type StringKey } from "./strings";

const BCP47: Record<Locale, string> = {
  en: "en-US",
  pl: "pl-PL",
  de: "de-DE",
};

export function localeToBCP47(locale: Locale): string {
  return BCP47[locale] ?? "en-US";
}

export function useLocale(): Locale {
  return useTrainerStore((s) => s.settings.appLanguage);
}

export function useT() {
  const locale = useLocale();
  return {
    locale,
    t: (key: StringKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    /** Format a Date or YYYY-MM-DD with the user's locale. */
    formatDate: (d: Date | string, opts?: Intl.DateTimeFormatOptions) => {
      const date = typeof d === "string" ? new Date(d) : d;
      return date.toLocaleDateString(localeToBCP47(locale), opts);
    },
  };
}

