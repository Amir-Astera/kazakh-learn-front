import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import mascotImg from '../assets/ChatGPT Image 6 мар. 2026 г., 23_45_55.png';
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
          <img src={mascotImg} alt="Qazaq Lingo mascot" />
        </div>
        <span className="nav-logo-text">Qazaq<span> Lingo</span></span>
      </a>

      <div className="nav-links">
        <a className={`nav-link ${isActive('/') || location.pathname.startsWith('/module') ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
        <a className="nav-link" href="#" onClick={(e) => e.preventDefault()}>AI help</a>
        <a className={`nav-link ${isActive('/rating') ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); navigate('/rating'); }}>Rating</a>
        <a className={`nav-link ${isActive('/profile') ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); navigate('/profile'); }}>Profile</a>
        {user?.is_admin && (
          <a className={`nav-link admin-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); navigate('/admin'); }}>
            Admin Panel
          </a>
        )}
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

        <button className="nav-profile-btn" type="button" onClick={() => navigate('/profile')} title="Profile settings">
          {user?.name || 'Profile'}
        </button>

        <div className="nav-avatar" onClick={() => navigate('/profile')} title="Open profile">
          <div className="nav-avatar-placeholder">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>

        <button className="nav-logout-btn" type="button" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
