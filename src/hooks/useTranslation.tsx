import { createContext, useContext, useState, ReactNode } from "react";

type Language = "sv" | "en";

interface Translations {
  [key: string]: {
    sv: string;
    en: string;
  };
}

const translations: Translations = {
  shop: { sv: "Butik", en: "Shop" },
  cart: { sv: "Varukorg", en: "Cart" },
  admin: { sv: "Admin", en: "Admin" },
  home: { sv: "Hem", en: "Home" },
  search: { sv: "Sök...", en: "Search..." },
  addToCart: { sv: "Lägg i varukorg", en: "Add to cart" },
  total: { sv: "Totalt", en: "Total" },
  vatIncluded: { sv: "Inkl. moms", en: "VAT included" },
  freeShipping: { sv: "Fri frakt", en: "Free shipping" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("sv");

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used within LanguageProvider");
  return context;
}
