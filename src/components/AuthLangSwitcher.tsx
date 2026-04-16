import { useLang } from '../context/LanguageContext';
import './AuthLangSwitcher.css';

export default function AuthLangSwitcher() {
  const { lang, setLangChoice, t } = useLang();

  return (
    <div className="auth-lang-switcher" role="group" aria-label={t('auth.langLabel')}>
      <button
        type="button"
        className={`auth-lang-btn ${lang === 'ru' ? 'active' : ''}`}
        onClick={() => setLangChoice('ru')}
      >
        RU
      </button>
      <button
        type="button"
        className={`auth-lang-btn ${lang === 'en' ? 'active' : ''}`}
        onClick={() => setLangChoice('en')}
      >
        EN
      </button>
    </div>
  );
}
