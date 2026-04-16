import { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStats, updateProfile, uploadAvatar } from '../api';
import { useLang } from '../context/LanguageContext';
import { resolveMediaUrl, AVATAR_IMG_REFERRER_POLICY } from '../config/apiBase';
import './ProfilePage.css';

interface Stats {
  total_lessons: number;
  total_xp: number;
  avg_score: number;
  completed_units: number;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { t, lang, setLangChoice } = useLang();
  const [stats, setStats] = useState<Stats | null>(null);
  const [name, setName] = useState('');
  const [languagePair, setLanguagePair] = useState<'ru-kz' | 'en-kz'>('ru-kz');
  const [learningGoal, setLearningGoal] = useState<'general' | 'travel' | 'study' | 'work'>('general');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getStats()
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setLanguagePair(user.language_pair || 'ru-kz');
    setLearningGoal(user.learning_goal || 'general');
  }, [user]);

  const profileInitial = useMemo(() => ({
    name: user?.name || '',
    language_pair: user?.language_pair || 'ru-kz',
    learning_goal: user?.learning_goal || 'general',
  }), [user]);

  const hasChanges = name !== profileInitial.name
    || languagePair !== profileInitial.language_pair
    || learningGoal !== profileInitial.learning_goal;

  const avatarSrc = resolveMediaUrl(user?.avatar_url || null);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarMsg('');
    setError('');
    setAvatarBusy(true);
    try {
      await uploadAvatar(file);
      await refreshUser();
      setAvatarMsg(t('profile.avatarDone'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || t('profile.avatarErr'));
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaveMessage('');
    setSaving(true);

    try {
      await updateProfile({
        name,
        language_pair: languagePair,
        learning_goal: learningGoal,
      });
      await refreshUser();
      setLangChoice(languagePair === 'en-kz' ? 'en' : 'ru');
      setSaveMessage(t('profile.saved'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || t('profile.saveErr'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-avatar">
            {avatarSrc ? (
              <img className="profile-avatar-image" src={avatarSrc} alt={user?.name || 'Avatar'} referrerPolicy={AVATAR_IMG_REFERRER_POLICY} />
            ) : (
              <div className="profile-avatar-inner">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <h1 className="profile-name">{user?.name}</h1>
          <p className="profile-email">{user?.email}</p>
          <p className="profile-meta">{t('profile.pair')}: {user?.language_pair === 'en-kz' ? t('reg.pair.en') : t('reg.pair.ru')}</p>
          <p className="profile-meta">{t('profile.registered')}: {user?.created_at ? new Date(user.created_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB') : t('profile.dateDash')}</p>

          <div className="profile-badges">
            <div className="profile-badge xp">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#F59E0B">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <div>
                <span className="badge-num">{user?.xp || 0}</span>
                <span className="badge-text">XP</span>
              </div>
            </div>
            <div className="profile-badge streak">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#F97316">
                <path d="M11.71 3.03C11.36 2.5 10.5 2.65 10.37 3.27c-.4 1.96-1.57 3.65-3.23 4.8C5.24 9.4 4 11.66 4 14.15 4 18.48 7.58 22 12 22c4.42 0 8-3.52 8-7.85 0-2.42-1.18-4.66-3.04-6.02-1.55-1.13-2.67-2.73-3.13-4.57-.14-.59-.97-.68-1.28-.15l-1.09 1.63z" />
              </svg>
              <div>
                <span className="badge-num">{user?.streak || 0}</span>
                <span className="badge-text">{t('profile.streak')}</span>
              </div>
            </div>
          </div>
        </div>

        <form className="profile-form-card" onSubmit={handleSave}>
          <div className="profile-form-header">
            <div>
              <h2>{t('profile.editTitle')}</h2>
              <p>{t('profile.editSub')}</p>
            </div>
          </div>

          {error && <div className="profile-alert error">{error}</div>}
          {saveMessage && <div className="profile-alert success">{saveMessage}</div>}
          {avatarMsg && <div className="profile-alert success">{avatarMsg}</div>}

          <div className="profile-form-grid">
            <label className="profile-field">
              <span>{t('profile.name')}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('profile.namePh')} />
            </label>

            <label className="profile-field profile-field-full profile-field-avatar">
              <span>{t('profile.avatarUpload')}</span>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="profile-file-input" onChange={handleAvatarFile} disabled={avatarBusy} />
              <div className="profile-avatar-actions">
                <button type="button" className="profile-save-btn profile-avatar-btn" disabled={avatarBusy} onClick={() => fileInputRef.current?.click()}>
                  {avatarBusy ? t('profile.avatarUploading') : t('profile.avatarPick')}
                </button>
              </div>
            </label>

            <label className="profile-field">
              <span>{t('profile.pair')}</span>
              <select value={languagePair} onChange={(e) => setLanguagePair(e.target.value as 'ru-kz' | 'en-kz')}>
                <option value="ru-kz">{t('reg.pair.ru')}</option>
                <option value="en-kz">{t('reg.pair.en')}</option>
              </select>
            </label>

            <label className="profile-field">
              <span>{t('reg.goal')}</span>
              <select value={learningGoal} onChange={(e) => setLearningGoal(e.target.value as 'general' | 'travel' | 'study' | 'work')}>
                <option value="general">{t('reg.goal.general')}</option>
                <option value="travel">{t('reg.goal.travel')}</option>
                <option value="study">{t('reg.goal.study')}</option>
                <option value="work">{t('reg.goal.work')}</option>
              </select>
            </label>
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="profile-save-btn" disabled={saving || !hasChanges}>
              {saving ? t('profile.saving') : t('profile.save')}
            </button>
          </div>
        </form>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-value">{stats.total_lessons}</div>
              <div className="stat-card-label">{t('profile.stat.lessons')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.total_xp}</div>
              <div className="stat-card-label">{t('profile.stat.xp')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.avg_score}%</div>
              <div className="stat-card-label">{t('profile.stat.score')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.completed_units}</div>
              <div className="stat-card-label">{t('profile.stat.units')}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
