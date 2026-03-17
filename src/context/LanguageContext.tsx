import { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'ru' | 'en';

interface LanguageContextType {
  lang: Lang;
  toggle: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Lang, string>> = {
  'nav.home':        { ru: 'Главная', en: 'Home' },
  'nav.ai':          { ru: 'AI помощь', en: 'AI help' },
  'nav.rating':      { ru: 'Рейтинг', en: 'Rating' },
  'sidebar.skills':  { ru: 'Навыки', en: 'Skill Mastery' },
  'sidebar.quests':  { ru: 'Задания', en: 'Daily Quests' },
  'sidebar.level':   { ru: 'Уровень CEFR', en: 'CEFR Level' },
  'sidebar.beginner':{ ru: 'Начинающий', en: 'Beginner' },
  'lesson.check':    { ru: 'Проверить', en: 'Check' },
  'lesson.next':     { ru: 'Дальше', en: 'Continue' },
  'lesson.correct':  { ru: 'Правильно!', en: 'Correct!' },
  'lesson.wrong':    { ru: 'Неверно', en: 'Wrong' },
  'speech.say':      { ru: 'Произнесите:', en: 'Say this word:' },
  'speech.tap':      { ru: 'Нажмите и говорите', en: 'Tap and speak' },
  'speech.listening':{ ru: 'Слушаю...', en: 'Listening...' },
  'speech.retry':    { ru: 'Попробовать снова', en: 'Try again' },
  'speech.great':    { ru: 'Отлично! Вы сказали:', en: 'Great! You said:' },
  'speech.said':     { ru: 'Вы сказали:', en: 'You said:' },
  'speech.unsupported': { ru: 'Браузер не поддерживает распознавание речи', en: 'Browser does not support speech recognition' },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ru',
  toggle: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'ru';
  });

  const toggle = () => {
    const next: Lang = lang === 'ru' ? 'en' : 'ru';
    setLang(next);
    localStorage.setItem('lang', next);
  };

  const t = (key: string): string => {
    return translations[key]?.[lang] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
