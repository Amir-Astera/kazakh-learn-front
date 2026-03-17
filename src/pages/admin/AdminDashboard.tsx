import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { adminGetStats } from '../../api';

interface Stats {
  levels: number; modules: number; units: number;
  lessons: number; exercises: number; users: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    adminGetStats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  const cards = stats ? [
    { label: 'Уровней', num: stats.levels, color: '#3b82f6' },
    { label: 'Модулей', num: stats.modules, color: '#10b981' },
    { label: 'Разделов', num: stats.units, color: '#f59e0b' },
    { label: 'Уроков', num: stats.lessons, color: '#8b5cf6' },
    { label: 'Заданий', num: stats.exercises, color: '#ef4444' },
    { label: 'Пользователей', num: stats.users, color: '#06b6d4' },
  ] : [];

  return (
    <AdminLayout title="Дашборд">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Обзор платформы</div>
          <div className="admin-page-sub">Статистика всего контента</div>
        </div>
      </div>

      {!stats ? (
        <div className="admin-loading">Загрузка...</div>
      ) : (
        <div className="admin-stats-grid">
          {cards.map(c => (
            <div className="admin-stat-card" key={c.label}>
              <div className="admin-stat-num" style={{ color: c.color }}>{c.num}</div>
              <div className="admin-stat-label">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="admin-table-wrap" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--bg-night)' }}>
          Быстрые действия
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Добавить уровень', path: '/admin/levels' },
            { label: 'Добавить модуль', path: '/admin/modules' },
            { label: 'Добавить раздел', path: '/admin/units' },
            { label: 'Добавить урок', path: '/admin/lessons' },
            { label: 'Добавить задание', path: '/admin/exercises' },
          ].map(a => (
            <a key={a.path} href={a.path} style={{
              display: 'block', padding: '14px 16px', background: '#f8fafc',
              borderRadius: '10px', textDecoration: 'none', color: 'var(--bg-night)',
              fontSize: '0.85rem', fontWeight: 600, border: '1.5px solid #e2e8f0',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--bg-sky)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >→ {a.label}</a>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
