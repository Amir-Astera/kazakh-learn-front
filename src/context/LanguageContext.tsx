import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { TRANSLATIONS, type UILang } from '../i18n/strings';

export type Lang = UILang;

interface LanguageContextType {
  lang: Lang;
  toggle: () => void;
  setLangChoice: (next: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ru',
  toggle: () => {},
  setLangChoice: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'ru';
  });

  const setLangChoice = (next: Lang) => {
    setLang(next);
    localStorage.setItem('lang', next);
  };

  const toggle = () => {
    const next: Lang = lang === 'ru' ? 'en' : 'ru';
    setLangChoice(next);
  };

  const t = useCallback(
    (key: string): string => {
      return TRANSLATIONS[key]?.[lang] ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, toggle, setLangChoice, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
