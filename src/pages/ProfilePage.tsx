import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStats } from '../api';
import './ProfilePage.css';

interface Stats {
  total_lessons: number;
  total_xp: number;
  avg_score: number;
  completed_units: number;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    getStats()
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="profile-page">
      <div className="bg-clouds">
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="profile-avatar-inner">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
          <h1 className="profile-name">{user?.name}</h1>
          <p className="profile-email">{user?.email}</p>

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
