import { useLang } from '../context/LanguageContext';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  /** If set, overrides messageKey and message */
  message?: string;
  /** i18n key from strings.ts */
  messageKey?: string;
  light?: boolean;
}

export default function LoadingSpinner({ message, messageKey, light = false }: LoadingSpinnerProps) {
  const { t } = useLang();
  const text = message ?? (messageKey ? t(messageKey) : t('spinner.default'));
  return (
    <div className={`loading-container ${light ? 'light' : ''}`}>
      <div className="loading-dots">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
      <span className="loading-msg">{text}</span>
    </div>
  );
}
