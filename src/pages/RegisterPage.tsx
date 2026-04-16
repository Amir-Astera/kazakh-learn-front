import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import AuthLangSwitcher from '../components/AuthLangSwitcher';
import { API_ORIGIN } from '../config/apiBase';
import './AuthPage.css';

import mascotImg from '../assets/ChatGPT Image 6 мар. 2026 г., 23_45_55.png';
import violinImg from '../assets/deco-violin.png';
import bookImg from '../assets/deco-book.png';
import yurtImg from '../assets/deco-yurt.png';
import dombraImg from '../assets/deco-dombra.png';

const WEEKLY_OPTIONS = [5, 10, 15, 20] as const;

export default function RegisterPage() {
  const { t, setLangChoice } = useLang();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [weeklyStudyMinutes, setWeeklyStudyMinutes] = useState<number>(10);
  const [languagePair, setLanguagePair] = useState<'ru-kz' | 'en-kz'>('ru-kz');
  const [learningGoal, setLearningGoal] = useState<'general' | 'travel' | 'study' | 'work'>('general');
  const [proficiencyLevel, setProficiencyLevel] = useState<'beginner' | 'elementary' | 'intermediate'>('beginner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const stepSubtitle = useMemo(() => {
    const keys = ['reg.step1sub', 'reg.step2sub', 'reg.step3sub', 'reg.step4sub', 'reg.step5sub'] as const;
    return t(keys[step - 1] || keys[0]);
  }, [step, t]);

  const goBack = () => {
    setError('');
    setStep(s => Math.max(1, s - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!name.trim() || !email.trim() || !password || password.length < 6) {
        setError(t('reg.errStep1'));
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const ageNum = parseInt(age, 10);
      if (!Number.isFinite(ageNum) || ageNum < 7 || ageNum > 100) {
        setError(t('reg.errAge'));
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      setStep(4);
      return;
    }

    if (step === 4) {
      if (!WEEKLY_OPTIONS.includes(weeklyStudyMinutes as (typeof WEEKLY_OPTIONS)[number])) {
        setError(t('reg.errWeekly'));
        return;
      }
      setStep(5);
      return;
    }

    const ageNum = parseInt(age, 10);
    setLoading(true);
    try {
      const res = await register({
        email,
        password,
        name,
        language_pair: languagePair,
        learning_goal: learningGoal,
        proficiency_level: proficiencyLevel,
        age: ageNum,
        weekly_study_minutes: weeklyStudyMinutes,
      });
      setAuth(res.data.token, res.data.user);
      setLangChoice(languagePair === 'en-kz' ? 'en' : 'ru');
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || t('reg.errGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const stepTitle =
    step === 1 ? t('reg.title1')
    : step === 2 ? t('reg.title2')
    : step === 3 ? t('reg.title3')
    : step === 4 ? t('reg.title4')
    : t('reg.title5');

  return (
    <div className="auth-page">
      <svg className="auth-bg-wave" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 100 0 L 42 0 C 16 5 76 35 50 100 L 100 100 Z" fill="#22c55e" />
      </svg>

      <div className="auth-mascot-wrapper">
        <div className="auth-mascot-area">
          <div className="auth-mascot-circle">
            <img className="auth-mascot-img" src={mascotImg} alt="Mascot" />
          </div>
          <div className="deco-item deco-violin"><img src={violinImg} alt="" /></div>
          <div className="deco-item deco-book"><img src={bookImg} alt="" /></div>
          <div className="deco-item deco-yurt"><img src={yurtImg} alt="" /></div>
          <div className="deco-item deco-dombra"><img src={dombraImg} alt="" /></div>
        </div>
      </div>

      <div className="auth-form-wrapper">
        <div className="auth-form-toolbar">
          <AuthLangSwitcher />
        </div>
        <h1 className="auth-form-title">{stepTitle}</h1>
        <p className="auth-form-subtitle">{stepSubtitle}</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div className="auth-form-group">
                <label className="auth-form-label">{t('reg.name')}</label>
                <input className="auth-form-input" type="text" value={name}
                  onChange={e => setName(e.target.value)} placeholder={t('reg.namePh')}
                  required autoComplete="name" />
              </div>
              <div className="auth-form-group">
                <label className="auth-form-label">{t('auth.email')}</label>
                <input className="auth-form-input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder={t('auth.emailPh')}
                  required autoComplete="email" />
              </div>
              <div className="auth-form-group">
                <label className="auth-form-label">{t('auth.password')}</label>
                <input className="auth-form-input" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder={t('auth.passwordPh')}
                  required minLength={6} autoComplete="new-password" />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="auth-form-group">
              <label className="auth-form-label">{t('reg.ageQ')}</label>
              <input
                className="auth-form-input"
                type="number"
                min={7}
                max={100}
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder={t('reg.agePh')}
                required
                autoFocus
              />
            </div>
          )}

          {step === 3 && (
            <div className="auth-form-group">
              <select
                className="auth-form-input auth-form-select"
                value={proficiencyLevel}
                onChange={e => setProficiencyLevel(e.target.value as typeof proficiencyLevel)}
                autoFocus
                aria-label={t('reg.profAria')}
              >
                <option value="beginner">{t('reg.prof.beginner')}</option>
                <option value="elementary">{t('reg.prof.elementary')}</option>
                <option value="intermediate">{t('reg.prof.intermediate')}</option>
              </select>
            </div>
          )}

          {step === 4 && (
            <div className="auth-form-group">
              <div className="auth-segmented-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }} role="group" aria-label={t('reg.title4')}>
                {WEEKLY_OPTIONS.map(m => (
                  <button
                    key={m}
                    type="button"
                    className={`auth-segmented-btn ${weeklyStudyMinutes === m ? 'active' : ''}`}
                    onClick={() => setWeeklyStudyMinutes(m)}
                  >
                    {m} {t('reg.min')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <>
              <div className="auth-form-group">
                <label className="auth-form-label">{t('reg.langPair')}</label>
                <div className="auth-segmented-grid">
                  <button type="button" className={`auth-segmented-btn ${languagePair === 'ru-kz' ? 'active' : ''}`} onClick={() => setLanguagePair('ru-kz')}>
                    {t('reg.pair.ru')}
                  </button>
                  <button type="button" className={`auth-segmented-btn ${languagePair === 'en-kz' ? 'active' : ''}`} onClick={() => setLanguagePair('en-kz')}>
                    {t('reg.pair.en')}
                  </button>
                </div>
              </div>
              <div className="auth-form-group">
                <label className="auth-form-label">{t('reg.goal')}</label>
                <select
                  className="auth-form-input auth-form-select"
                  value={learningGoal}
                  onChange={e => setLearningGoal(e.target.value as typeof learningGoal)}
                >
                  <option value="general">{t('reg.goal.general')}</option>
                  <option value="travel">{t('reg.goal.travel')}</option>
                  <option value="study">{t('reg.goal.study')}</option>
                  <option value="work">{t('reg.goal.work')}</option>
                </select>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {step > 1 && (
              <button type="button" className="auth-btn-submit" style={{ flex: 1, background: '#64748b' }} onClick={goBack}>
                {t('reg.back')}
              </button>
            )}
            <button type="submit" className="auth-btn-submit" style={{ flex: 2 }} disabled={loading}>
              {loading ? t('reg.creating') : step === 5 ? t('reg.start') : t('reg.next')}
            </button>
          </div>
        </form>

        {step === 1 && (
          <button className="auth-btn-google" type="button" onClick={() => { window.location.href = `${API_ORIGIN}/api/auth/google`; }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {t('reg.google')}
          </button>
        )}

        <p className="auth-switch-link">
          {t('reg.hasAccount')} <Link to="/login">{t('reg.signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
