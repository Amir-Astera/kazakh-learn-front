import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api';
import { useLang } from '../context/LanguageContext';
import AuthLangSwitcher from '../components/AuthLangSwitcher';
import './AuthPage.css';

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDevResetUrl('');
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.data?.message || '');
      setDevResetUrl(typeof res.data?.reset_url === 'string' ? res.data.reset_url : '');
    } catch (err: any) {
      setError(err.response?.data?.error || t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <svg className="auth-bg-wave" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 0 0 L 58 0 C 84 5 24 35 50 100 L 0 100 Z" fill="#22c55e" />
      </svg>
      <div className="auth-form-wrapper">
        <div className="auth-form-toolbar">
          <AuthLangSwitcher />
        </div>
        <h1 className="auth-form-title">{t('auth.forgotTitle')}</h1>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 16 }}>{t('auth.forgotHint')}</p>
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-error" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>{message}</div>}
        {devResetUrl && (
          <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 8 }}>{t('auth.devResetLabel')}</div>
            <input readOnly className="auth-form-input" value={devResetUrl} onFocus={(e) => e.target.select()} style={{ fontSize: '0.8rem', marginBottom: 8 }} />
            <a className="auth-btn-submit" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', padding: '10px 16px' }} href={devResetUrl}>{t('auth.devResetOpen')}</a>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-form-label">{t('auth.email')}</label>
            <input
              className="auth-form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPh')}
              required
              autoComplete="email"
            />
          </div>
          <button type="submit" className="auth-btn-submit" disabled={loading}>
            {loading ? t('auth.sending') : t('auth.sendLink')}
          </button>
        </form>
        <p className="auth-switch-link">
          <Link to="/login">{t('auth.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
