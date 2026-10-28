import React, { createContext, useContext } from "react";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";

import de from "@/locales/de.json";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";
import id from "@/locales/id.json";
import ja from "@/locales/ja.json";
import ko from "@/locales/ko.json";
import pt from "@/locales/pt.json";
import vi from "@/locales/vi.json";
import zh from "@/locales/zh.json";

/** Ngôn ngữ hỗ trợ, tên hiển thị bằng chính ngôn ngữ đó (cho ô chọn ngôn ngữ). */
export const SUPPORTED_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "zh", label: "中文（简体）" },
  { value: "id", label: "Bahasa Indonesia" },
] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number]["value"];

/** Mã ngôn ngữ của máy (VD "pt-BR", "zh-Hans") → ngôn ngữ app hỗ trợ, mặc định "en". */
export const toSupportedLanguage = (code?: string | null): Language => {
  const base = code?.toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.find((lang) => lang.value === base)?.value ?? "en";
};

const TRANSLATIONS = { en, vi, es, pt, fr, de, ja, ko, zh, id };

// Init i18next (only once)
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    compatibilityJSON: "v4", // React Native compatibility
    lng: "en", // default
    fallbackLng: "en",
    resources: Object.fromEntries(
      Object.entries(TRANSLATIONS).map(([lang, translation]) => [
        lang,
        { translation },
      ]),
    ),
    interpolation: {
      escapeValue: false,
    },
  });
} else {
  // Fast Refresh nạp lại file này khi locales đổi: cập nhật bản dịch
  // để khoá mới hiện ngay, không cần reload app
  for (const [lang, translation] of Object.entries(TRANSLATIONS)) {
    i18n.addResourceBundle(lang, "translation", translation, true, true);
  }
}

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
  };

  const contextValue: LanguageContextType = {
    language: i18n.language as Language,
    setLanguage,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

export const useT = () => useTranslation().t;
