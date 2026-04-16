import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import './AdminLayout.css';

interface Props { children: React.ReactNode; title: string; }

export default function AdminLayout({ children, title }: Props) {
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = useMemo(() => [
    { path: '/admin', labelKey: 'admin.nav.dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg> },
    { path: '/admin/levels', labelKey: 'admin.nav.levels', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> },
    { path: '/admin/modules', labelKey: 'admin.nav.modules', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.35C18 2.08 15.93 0 13.35 0c-1.33 0-2.54.55-3.41 1.44L9 2.88 8.06 1.44C7.19.55 5.98 0 4.65 0 2.07 0 0 2.08 0 4.65c0 .47.11.91.18 1.35H0v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5-4c.97 0 1.65.68 1.65 1.65S15.97 5.3 15 5.3H11.5l1.54-1.54C13.47 3.33 14.21 2 15 2z"/></svg> },
    { path: '/admin/units', labelKey: 'admin.nav.units', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg> },
    { path: '/admin/lessons', labelKey: 'admin.nav.lessons', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg> },
    { path: '/admin/exercises', labelKey: 'admin.nav.exercises', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> },
  ], []);

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-logo-title">QazaqTili</div>
          <div className="admin-logo-sub">{t('admin.logoSub')}</div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">{t('admin.navSection')}</div>
          {navItems.map(item => (
            <button
              key={item.path}
              className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              {t(item.labelKey)}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-back-btn" onClick={() => navigate('/')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            {t('admin.home')}
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">{title}</div>
          <div className="admin-topbar-right">
            <span className="admin-user-badge">{t('admin.userBadge')}: {user?.name}</span>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
