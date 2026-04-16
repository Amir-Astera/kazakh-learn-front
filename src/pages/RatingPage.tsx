import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import './RatingPage.css';
import api from '../api';

interface RatingUser {
  id: number;
  name: string;
  xp: number;
  streak: number;
}

export default function RatingPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const [users, setUsers] = useState<RatingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/progress/rating')
      .then(res => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rating-page">
      <div className="rating-container">
        <div className="rating-header">
          <h1 className="rating-title">{t('rating.title')}</h1>
          <p className="rating-sub">{t('rating.sub')}</p>
        </div>

        <div className="rating-card">
          {loading ? (
            <div className="rating-loading">{t('rating.loading')}</div>
          ) : users.length === 0 ? (
            <div className="rating-empty">{t('rating.empty')}</div>
          ) : (
            <table className="rating-table">
              <thead>
                <tr>
                  <th>{t('rating.thRank')}</th>
                  <th>{t('rating.thUser')}</th>
                  <th>{t('rating.thXp')}</th>
                  <th>{t('rating.thStreak')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className={u.id === user?.id ? 'current-user' : ''}>
                    <td className="rating-rank">
                      {i === 0 && <span className="medal gold">🥇</span>}
                      {i === 1 && <span className="medal silver">🥈</span>}
                      {i === 2 && <span className="medal bronze">🥉</span>}
                      {i > 2 && <span className="rank-num">{i + 1}</span>}
                    </td>
                    <td className="rating-user">
                      <div className="rating-avatar">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="rating-name">{u.name}</span>
                      {u.id === user?.id && <span className="you-badge">{t('rating.you')}</span>}
                    </td>
                    <td className="rating-xp">{u.xp} XP</td>
                    <td className="rating-streak">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#f97316">
                        <path d="M11.71 3.03C11.36 2.5 10.5 2.65 10.37 3.27c-.4 1.96-1.57 3.65-3.23 4.8C5.24 9.4 4 11.66 4 14.15 4 18.48 7.58 22 12 22c4.42 0 8-3.52 8-7.85 0-2.42-1.18-4.66-3.04-6.02-1.55-1.13-2.67-2.73-3.13-4.57-.14-.59-.97-.68-1.28-.15l-1.09 1.63z" />
                      </svg>
                      {u.streak}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
