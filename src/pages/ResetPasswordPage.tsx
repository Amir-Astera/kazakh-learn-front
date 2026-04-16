import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api';
import { useLang } from '../context/LanguageContext';
import AuthLangSwitcher from '../components/AuthLangSwitcher';
import './AuthPage.css';

export default function ResetPasswordPage() {
  const { t } = useLang();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 6) {
      setError(t('auth.resetHint'));
      return;
    }
    if (password !== password2) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    if (!tokenFromUrl) {
      setError(t('auth.missingToken'));
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(tokenFromUrl, password);
      setMessage(res.data?.message || '');
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
        <h1 className="auth-form-title">{t('auth.resetTitle')}</h1>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 16 }}>{t('auth.resetHint')}</p>
        {error && <div className="auth-error">{error}</div>}
        {message && (
          <div className="auth-error" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-form-label">{t('auth.newPassword')}</label>
            <input
              className="auth-form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPh')}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="auth-form-group">
            <label className="auth-form-label">{t('auth.confirmPassword')}</label>
            <input
              className="auth-form-input"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder={t('auth.passwordPh')}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="auth-btn-submit" disabled={loading}>
            {loading ? t('auth.saving') : t('auth.savePassword')}
          </button>
        </form>
        <p className="auth-switch-link">
          <Link to="/login">{t('auth.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
