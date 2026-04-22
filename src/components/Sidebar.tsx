import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { getDashboard, getLevels } from '../api';
import { resolveMediaUrl, AVATAR_IMG_REFERRER_POLICY } from '../config/apiBase';
import './Sidebar.css';

interface Skill {
  skill_name: string;
  progress: number;
}

interface Quest {
  id: number;
  quest_name: string;
  quest_type: string;
  target: number;
  current: number;
  xp_reward: number;
  completed: boolean;
}

interface Reminder {
  type?: 'long_absence' | 'spaced_repetition' | 'falling_progress';
  title?: string;
  message?: string;
  skill_name?: string;
  days_away?: number | null;
}

interface LevelModule {
  id: number;
  title: string;
  title_kz: string;
  order_num: number;
  required_xp: number;
}

interface LevelData {
  id: number;
  code: string;
  name: string;
  order_num: number;
  modules: LevelModule[];
}

const skillColors: Record<string, string> = {
  vocabulary: '#10b981',
  grammar: '#3b82f6',
  listening: '#8b5cf6',
  speaking: '#f97316',
};

const skillIconPaths: Record<string, { d: string; fill: string }> = {
  vocabulary: {
    fill: 'none',
    d: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',
  },
  grammar: {
    fill: 'none',
    d: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  },
  listening: {
    fill: 'none',
    d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
  },
  speaking: {
    fill: 'none',
    d: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
  },
};
 
function questDisplayName(quest: Quest, translate: (key: string) => string) {
  if (quest.quest_type === 'words') {
    return translate('quest.words').replace('{target}', String(quest.target));
  }
  if (quest.quest_type === 'lessons') {
    return translate('quest.lessons').replace('{target}', String(quest.target));
  }
  return quest.quest_name;
}

function flattenModules(levels: LevelData[]) {
   return [...levels]
     .sort((a, b) => a.order_num - b.order_num)
     .flatMap(level =>
       [...level.modules]
         .sort((a, b) => a.order_num - b.order_num)
         .map(module => ({
           ...module,
           level_id: level.id,
           level_code: level.code,
           level_name: level.name,
           level_order: level.order_num,
         }))
     );
 }

export default function Sidebar() {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [levels, setLevels] = useState<LevelData[]>([]);

  useEffect(() => {
    Promise.all([getDashboard(), getLevels()]).then(([dashboardRes, levelsRes]) => {
      setSkills(dashboardRes.data.skills);
      setQuests(dashboardRes.data.quests);
      setReminder(dashboardRes.data.reminder);
      setLevels(levelsRes.data);
    }).catch(() => {});
  }, []);

  const xp = user?.xp || 0;
  const allModules = flattenModules(levels);
  const currentUnlockedModule = allModules.filter(module => (module.required_xp || 0) <= xp).at(-1) || allModules[0] || null;
  const currentLevel = currentUnlockedModule
    ? levels.find(level => level.id === currentUnlockedModule.level_id) || null
    : levels[0] || null;
  const nextLevel = currentLevel
    ? [...levels].sort((a, b) => a.order_num - b.order_num).find(level => level.order_num > currentLevel.order_num) || null
    : null;
  const currentLevelFloor = currentLevel && currentLevel.modules.length > 0
    ? Math.min(...currentLevel.modules.map(module => module.required_xp || 0))
    : 0;
  const nextLevelRequirement = nextLevel && nextLevel.modules.length > 0
    ? Math.min(...nextLevel.modules.map(module => module.required_xp || 0))
    : null;
  const xpBarWidth = nextLevelRequirement == null
    ? 100
    : Math.min(100, Math.max(0, ((xp - currentLevelFloor) / Math.max(1, nextLevelRequirement - currentLevelFloor)) * 100));
  const currentLevelCode = currentLevel?.code || 'A1';
  const cefrKey = `cefr.${currentLevelCode}`;
  const cefrTranslated = t(cefrKey);
  const currentLevelName = (cefrTranslated !== cefrKey ? cefrTranslated : null) || currentLevel?.name || t('cefr.A1');

  return (
    <aside className="dashboard-section">
      {/* User card */}
      <div className="paper-card">
        <div className="user-card-top">
          <div className="user-card-avatar-wrap">
            <div className="user-card-avatar">
              {user?.avatar_url ? (
                <img src={resolveMediaUrl(user.avatar_url) || ''} alt="" className="user-card-avatar-img" referrerPolicy={AVATAR_IMG_REFERRER_POLICY} />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div className="user-card-level-badge">{currentLevelCode}</div>
          </div>
          <div>
            <h2 className="user-card-name">{currentLevelName}</h2>
            <p className="user-card-sub">{t('sidebar.cefrPrefix')} {currentLevelCode}{currentLevel?.name ? ` • ${currentLevel.name}` : ''}</p>
          </div>
        </div>
        <div className="user-xp-bar">
          <div className="user-xp-fill" style={{ width: `${xpBarWidth}%` }} />
        </div>
        <p className="user-xp-label">
          {nextLevelRequirement == null
            ? t('sidebar.xpBarMax').replace('{xp}', String(xp))
            : t('sidebar.xpBarNext')
              .replace('{xp}', String(xp))
              .replace('{need}', String(nextLevelRequirement))
              .replace('{code}', String(nextLevel?.code ?? ''))}
        </p>
      </div>

      {/* Smart reminder */}
      {reminder && (
        <div className={`smart-reminder smart-reminder--${reminder.type || 'default'}`}>
          <div className="reminder-icon">
            {reminder.type === 'long_absence' ? (
              <svg width="16" height="16" fill="none" stroke="#f97316" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
            ) : reminder.type === 'spaced_repetition' ? (
              <svg width="16" height="16" fill="none" stroke="#8b5cf6" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" stroke="#6366f1" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>
          <div className="reminder-content">
            {reminder.type === 'long_absence' && (
              <>
                <h4>{t('reminder.absence.title')}</h4>
                <p>
                  {reminder.days_away != null
                    ? t('reminder.absence.msg').replace('{days}', String(reminder.days_away))
                    : t('reminder.absence.msgFirst')}
                </p>
              </>
            )}
            {reminder.type === 'spaced_repetition' && (
              <>
                <h4>{t('reminder.spaced.title')}</h4>
                <p>{t('reminder.spaced.msg')}</p>
              </>
            )}
            {reminder.type === 'falling_progress' && (
              <>
                <h4>{t('reminder.falling.title')}</h4>
                <p>
                  {t('reminder.falling.msg').replace(
                    '{skill}',
                    reminder.skill_name
                      ? (t(`skill.${reminder.skill_name}`) !== `skill.${reminder.skill_name}`
                          ? t(`skill.${reminder.skill_name}`)
                          : reminder.skill_name)
                      : '',
                  )}
                </p>
              </>
            )}
            {!reminder.type && (
              <>
                <h4>{reminder.skill_name ? t('sidebar.reminderTitle') : (reminder.title || t('sidebar.reminderTitle'))}</h4>
                <p>
                  {reminder.skill_name
                    ? t('sidebar.reminderMsg').replace(
                        '{skill}',
                        t(`skill.${reminder.skill_name}`) !== `skill.${reminder.skill_name}`
                          ? t(`skill.${reminder.skill_name}`)
                          : reminder.skill_name,
                      )
                    : (reminder.message || '')}
                </p>
              </>
            )}
            <button type="button" className="btn-primary" onClick={() => navigate('/review-words')}>{t('sidebar.reviewWords')}</button>
          </div>
        </div>
      )}

      {/* Skills */}
      <div className="paper-card">
        <div className="card-header">
          <span className="card-title">{t('sidebar.skills')}</span>
        </div>
        <div className="rings-grid">
          {skills.map(skill => {
            const color = skillColors[skill.skill_name] || '#3b82f6';
            const circumference = 2 * Math.PI * 20;
            const offset = circumference - (skill.progress / 100) * circumference;
            const iconData = skillIconPaths[skill.skill_name];
            return (
              <div className="ring-container" key={skill.skill_name}>
                <div className="skill-ring-wrap">
                  <svg width="48" height="48" viewBox="0 0 48 48" className="ring-svg-bg">
                    <circle cx="24" cy="24" r="20" stroke="#f1f5f9" strokeWidth="4" fill="none" />
                    <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="4" fill="none"
                      strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '24px 24px' }} />
                  </svg>
                  {iconData && (
                    <svg className="ring-icon-overlay" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={iconData.d} />
                    </svg>
                  )}
                </div>
                <span className="ring-label">{t(`skill.${skill.skill_name}`) !== `skill.${skill.skill_name}` ? t(`skill.${skill.skill_name}`) : skill.skill_name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Chat */}
      <div className="paper-card sidebar-chat-card" onClick={() => navigate('/chat')} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--bg-night, #1a2236)' }}>{t('sidebar.aiTitle')}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{t('sidebar.aiSubtitle')}</div>
          </div>
          <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>

      {/* Daily Quests */}
      <div className="paper-card">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="#f59e0b">
            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
          {t('sidebar.quests')}
        </h3>
        <div className="quest-list">
          {quests.map(quest => {
            const isDone = quest.completed || quest.current >= quest.target;
            const progress = Math.min(100, (quest.current / quest.target) * 100);
            return (
              <div className="quest-item" key={quest.id}>
                <div className={`quest-checkbox ${isDone ? 'done' : ''}`}>
                  {isDone && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="quest-details">
                  <p className="quest-name">{questDisplayName(quest, t)}</p>
                  {!isDone && (
                    <div className="quest-progress-row">
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="quest-counter">{quest.current}/{quest.target}</span>
                    </div>
                  )}
                  {isDone && <p className="quest-xp-done">+{quest.xp_reward} XP</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
