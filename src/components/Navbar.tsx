import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, toggle } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="top-nav">
      <a className="nav-logo" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
        <div className="nav-logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
          </svg>
        </div>
        <span className="nav-logo-text">Qazaq<span> Lingo</span></span>
      </a>

      <div className="nav-links">
        <a className={`nav-link ${isActive('/') || location.pathname.startsWith('/module') ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
        <a className="nav-link" href="#" onClick={(e) => e.preventDefault()}>AI help</a>
        <a className={`nav-link ${isActive('/rating') ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); navigate('/rating'); }}>Rating</a>
      </div>

      <div className="nav-right">
        <button className="lang-toggle" onClick={toggle} title="Switch language">
          {lang === 'ru' ? 'EN' : 'RU'}
        </button>

        <div className="nav-badge streak">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#f97316"><path d="M11.71 3.03C11.36 2.5 10.5 2.65 10.37 3.27c-.4 1.96-1.57 3.65-3.23 4.8C5.24 9.4 4 11.66 4 14.15 4 18.48 7.58 22 12 22c4.42 0 8-3.52 8-7.85 0-2.42-1.18-4.66-3.04-6.02-1.55-1.13-2.67-2.73-3.13-4.57-.14-.59-.97-.68-1.28-.15l-1.09 1.63z" /></svg>
          <span className="badge-val">{user?.streak || 0}</span>
        </div>

        <div className="nav-badge xp">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#3b82f6"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          <span className="badge-val">{user?.xp || 0}</span>
        </div>

        <div className="nav-avatar" onClick={logout} title="Logout">
          <div className="nav-avatar-placeholder">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </nav>
  );
}
