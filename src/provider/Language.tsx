// src/providers/LanguageProvider.tsx
import React, { createContext, useContext } from "react";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";

// Import JSON
import en from "@/locales/en.json";
import vi from "@/locales/vi.json";
// import jp from "@/locales/jp.json";

// Init i18next (only once)
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    compatibilityJSON: "v4", // React Native compatibility
    lng: "en", // default
    fallbackLng: "en",
    resources: {
      en: { translation: en },
      vi: { translation: vi },
      //   jp: { translation: jp },
    },
    interpolation: {
      escapeValue: false,
    },
  });
}

type Language = "en" | "vi";

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
