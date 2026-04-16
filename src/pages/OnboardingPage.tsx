import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeOnboarding } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import AuthLangSwitcher from '../components/AuthLangSwitcher';
import './AuthPage.css';
import mascotImg from '../assets/ChatGPT Image 6 мар. 2026 г., 23_45_55.png';
import violinImg from '../assets/deco-violin.png';
import bookImg from '../assets/deco-book.png';
import yurtImg from '../assets/deco-yurt.png';
import dombraImg from '../assets/deco-dombra.png';

const WEEKLY_OPTIONS = [5, 10, 15, 20] as const;

export default function OnboardingPage() {
  const { t, setLangChoice } = useLang();
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [weeklyStudyMinutes, setWeeklyStudyMinutes] = useState<number>(10);
  const [languagePair, setLanguagePair] = useState<'ru-kz' | 'en-kz'>('ru-kz');
  const [learningGoal, setLearningGoal] = useState<'general' | 'travel' | 'study' | 'work'>('general');
  const [proficiencyLevel, setProficiencyLevel] = useState<'beginner' | 'elementary' | 'intermediate'>('beginner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const stepSubtitle = useMemo(() => {
    const keys = ['onb.step1sub', 'onb.step2sub', 'onb.step3sub', 'onb.step4sub'] as const;
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
      const ageNum = parseInt(age, 10);
      if (!Number.isFinite(ageNum) || ageNum < 7 || ageNum > 100) {
        setError(t('reg.errAge'));
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!WEEKLY_OPTIONS.includes(weeklyStudyMinutes as (typeof WEEKLY_OPTIONS)[number])) {
        setError(t('reg.errWeekly'));
        return;
      }
      setStep(4);
      return;
    }

    const ageNum = parseInt(age, 10);
    setLoading(true);
    try {
      await completeOnboarding({
        age: ageNum,
        weekly_study_minutes: weeklyStudyMinutes,
        language_pair: languagePair,
        learning_goal: learningGoal,
        proficiency_level: proficiencyLevel,
      });
      await refreshUser();
      setLangChoice(languagePair === 'en-kz' ? 'en' : 'ru');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || t('onb.errSave'));
    } finally {
      setLoading(false);
    }
  };

  const stepTitle =
    step === 1 ? t('onb.title1')
    : step === 2 ? t('onb.title2')
    : step === 3 ? t('onb.title3')
    : t('onb.title4');

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

          {step === 2 && (
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

          {step === 3 && (
            <div className="auth-form-group">
              <div className="auth-segmented-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }} role="group" aria-label={t('onb.title3')}>
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

          {step === 4 && (
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
              {loading ? t('onb.saving') : step === 4 ? t('onb.continue') : t('reg.next')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
