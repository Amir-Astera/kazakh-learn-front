import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStats, updateProfile } from '../api';
import { useLang } from '../context/LanguageContext';
import './ProfilePage.css';

interface Stats {
  total_lessons: number;
  total_xp: number;
  avg_score: number;
  completed_units: number;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { setLangChoice } = useLang();
  const [stats, setStats] = useState<Stats | null>(null);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [languagePair, setLanguagePair] = useState<'ru-kz' | 'en-kz'>('ru-kz');
  const [learningGoal, setLearningGoal] = useState<'general' | 'travel' | 'study' | 'work'>('general');
  const [proficiencyLevel, setProficiencyLevel] = useState<'beginner' | 'elementary' | 'intermediate'>('beginner');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getStats()
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setAvatarUrl(user.avatar_url || '');
    setLanguagePair(user.language_pair || 'ru-kz');
    setLearningGoal(user.learning_goal || 'general');
    setProficiencyLevel(user.proficiency_level || 'beginner');
  }, [user]);

  const profileInitial = useMemo(() => ({
    name: user?.name || '',
    avatar_url: user?.avatar_url || '',
    language_pair: user?.language_pair || 'ru-kz',
    learning_goal: user?.learning_goal || 'general',
    proficiency_level: user?.proficiency_level || 'beginner',
  }), [user]);

  const hasChanges = name !== profileInitial.name
    || avatarUrl !== profileInitial.avatar_url
    || languagePair !== profileInitial.language_pair
    || learningGoal !== profileInitial.learning_goal
    || proficiencyLevel !== profileInitial.proficiency_level;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaveMessage('');
    setSaving(true);

    try {
      await updateProfile({
        name,
        avatar_url: avatarUrl.trim() || null,
        language_pair: languagePair,
        learning_goal: learningGoal,
        proficiency_level: proficiencyLevel,
      });
      await refreshUser();
      setLangChoice(languagePair === 'en-kz' ? 'en' : 'ru');
      setSaveMessage('Профиль успешно обновлён');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось обновить профиль');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-avatar">
            {avatarUrl ? (
              <img className="profile-avatar-image" src={avatarUrl} alt={user?.name || 'Avatar'} />
            ) : (
              <div className="profile-avatar-inner">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <h1 className="profile-name">{user?.name}</h1>
          <p className="profile-email">{user?.email}</p>
          <p className="profile-meta">Языковая пара: {user?.language_pair === 'en-kz' ? 'English → Қазақша' : 'Русский → Қазақша'}</p>
          <p className="profile-meta">Дата регистрации: {user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '—'}</p>

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
                <span className="badge-text">Day Streak</span>
              </div>
            </div>
          </div>
        </div>

        <form className="profile-form-card" onSubmit={handleSave}>
          <div className="profile-form-header">
            <div>
              <h2>Редактирование профиля</h2>
              <p>Измени свои настройки обучения и персональные данные.</p>
            </div>
          </div>

          {error && <div className="profile-alert error">{error}</div>}
          {saveMessage && <div className="profile-alert success">{saveMessage}</div>}

          <div className="profile-form-grid">
            <label className="profile-field">
              <span>Имя</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Введите имя" />
            </label>

            <label className="profile-field">
              <span>Ссылка на аватар</span>
              <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </label>

            <label className="profile-field">
              <span>Языковая пара</span>
              <select value={languagePair} onChange={(e) => setLanguagePair(e.target.value as 'ru-kz' | 'en-kz')}>
                <option value="ru-kz">Русский → Қазақша</option>
                <option value="en-kz">English → Қазақша</option>
              </select>
            </label>

            <label className="profile-field">
              <span>Цель обучения</span>
              <select value={learningGoal} onChange={(e) => setLearningGoal(e.target.value as 'general' | 'travel' | 'study' | 'work')}>
                <option value="general">Общее изучение</option>
                <option value="travel">Путешествия</option>
                <option value="study">Учёба</option>
                <option value="work">Работа</option>
              </select>
            </label>

            <label className="profile-field profile-field-full">
              <span>Текущий уровень</span>
              <select value={proficiencyLevel} onChange={(e) => setProficiencyLevel(e.target.value as 'beginner' | 'elementary' | 'intermediate')}>
                <option value="beginner">Beginner / Начинающий</option>
                <option value="elementary">Elementary / Базовый</option>
                <option value="intermediate">Intermediate / Средний</option>
              </select>
            </label>
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="profile-save-btn" disabled={saving || !hasChanges}>
              {saving ? 'Сохраняем...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-value">{stats.total_lessons}</div>
              <div className="stat-card-label">Уроков пройдено</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.total_xp}</div>
              <div className="stat-card-label">Всего XP</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.avg_score}%</div>
              <div className="stat-card-label">Средний балл</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.completed_units}</div>
              <div className="stat-card-label">Юнитов завершено</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
