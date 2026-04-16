import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMe } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

export default function GoogleAuthSuccess() {
  const { t } = useLang();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      navigate('/login?error=google_failed');
      return;
    }

    localStorage.setItem('token', token);
    getMe()
      .then(res => {
        setAuth(token, res.data);
        if (res.data.onboarding_completed === false) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login?error=google_failed');
      });
  }, [searchParams, navigate, setAuth]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '4px solid #22c55e', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{t('google.signingIn')}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
