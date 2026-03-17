import { useNavigate } from 'react-router-dom';
import './PathNode.css';

interface PathNodeProps {
  unit: {
    id: number;
    title: string;
    title_kz: string;
    subtitle: string;
    status: string;
    completed_lessons: number;
    lesson_count: number;
    stars: number;
    icon: string;
  };
  position: 'left' | 'right';
  isLast: boolean;
}

const iconMap: Record<string, JSX.Element> = {
  wave: <path d="M7 24h2v-2H7v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zM16 .01L8 0C6.9 0 6 .9 6 2v16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V2c0-1.1-.9-1.99-2-1.99zM16 16H8V4h8v12z" />,
  numbers: <path d="M4 9h16v2H4zm0 4h10v2H4z" />,
  family: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />,
  food: <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" />,
  directions: <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" />,
  alphabet: <path d="M5 4v3h5.5v12h3V7H19V4H5z" />,
  chat: <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z" />,
  people: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />,
  book: <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />,
  clock: <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />,
  description: <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />,
  sentence: <path d="M21 11.01L3 11v2h18zM3 16h12v2H3zM21 6H3v2.01L21 8z" />,
  shop: <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />,
  transport: <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />,
  health: <path d="M10.5 13H8v-3h2.5V7.5h3V10H16v3h-2.5v2.5h-3V13zM12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />,
};

function getNodeIcon(icon: string, status: string) {
  if (status === 'completed') {
    return <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />;
  }
  if (status === 'locked') {
    return <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />;
  }
  return iconMap[icon] || iconMap.book;
}

export default function PathNode({ unit, position, isLast }: PathNodeProps) {
  const navigate = useNavigate();
  const progress = unit.lesson_count > 0 ? unit.completed_lessons / unit.lesson_count : 0;
  const circumference = unit.status === 'current' ? 2 * Math.PI * 44 : 2 * Math.PI * 40;
  const offset = circumference * (1 - progress);

  const ringSize = unit.status === 'current' ? 98 : 88;
  const ringR = unit.status === 'current' ? 44 : 40;
  const ringCenter = ringSize / 2;

  const strokeColor =
    unit.status === 'completed' ? '#FFD200' :
    unit.status === 'current' ? '#F05AA6' :
    'rgba(255,255,255,0.15)';

  const handleClick = () => {
    if (unit.status !== 'locked') {
      navigate(`/unit/${unit.id}`);
    }
  };

  return (
    <div className={`ld-row ${position}`} style={{ paddingLeft: position === 'left' ? '30px' : undefined, paddingRight: position === 'right' ? '30px' : undefined }}>
      <div className="ld-node-row">
        <div className="ld-node" onClick={handleClick}>
          {unit.status === 'current' && <div className="ld-now-badge">&#9654; Сейчас</div>}
          <svg className="ld-ring-svg" width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <circle cx={ringCenter} cy={ringCenter} r={ringR} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={unit.status === 'current' ? 5 : 4.5} />
            {unit.status !== 'locked' && (
              <circle
                cx={ringCenter} cy={ringCenter} r={ringR}
                fill="none"
                stroke={strokeColor}
                strokeWidth={unit.status === 'current' ? 5 : 4.5}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
              />
            )}
            {unit.status === 'locked' && (
              <circle cx={ringCenter} cy={ringCenter} r={ringR} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={4} strokeDasharray="10 6" />
            )}
          </svg>
          <div className={`ld-node-inner ${unit.status}`}>
            <svg viewBox="0 0 24 24" fill="white">{getNodeIcon(unit.icon, unit.status)}</svg>
          </div>
          {unit.status === 'completed' && (
            <div className="ld-stars">
              {[1, 2, 3].map(i => (
                <span key={i} className={`ld-star ${i <= unit.stars ? 'lit' : 'dim'}`}>&#11088;</span>
              ))}
            </div>
          )}
          {unit.status === 'current' && (
            <div className="ld-stars">
              {[1, 2, 3].map(i => (
                <span key={i} className={`ld-star ${i <= unit.stars ? 'lit' : 'dim'}`}>&#11088;</span>
              ))}
            </div>
          )}
        </div>
        <div className="ld-info" style={position === 'right' ? { textAlign: 'right', alignItems: 'flex-end' } : undefined}>
          <div className={`ld-info-name ${unit.status === 'locked' ? 'locked-text' : ''}`}
               style={unit.status === 'current' ? { color: 'white', fontWeight: 700 } : undefined}>
            {unit.title_kz}{unit.icon === 'family' ? ' (Грамматика)' : ''}
          </div>
          <div className={`ld-info-sub ${unit.status === 'locked' ? 'locked-text' : ''}`}>
            {unit.subtitle}
          </div>
          {unit.status !== 'locked' && (
            <div className="ld-mini-bar">
              <div className="ld-mini-fill" style={{
                width: `${progress * 100}%`,
                background: unit.status === 'completed' ? '#FFD200' : '#F05AA6'
              }} />
            </div>
          )}
          {unit.status === 'locked' && (
            <div className="ld-mini-bar">
              <div className="ld-mini-fill" style={{ width: '0%', background: 'rgba(255,255,255,0.2)' }} />
            </div>
          )}
        </div>
      </div>

      {!isLast && (
        <div className="ld-connector" style={position === 'left' ? { marginLeft: '64px' } : { alignSelf: 'flex-end', marginRight: '64px' }}>
          <svg width="180" height="52" viewBox="0 0 180 52">
            {position === 'left' ? (
              <path d="M44 0 C44 30 140 22 140 52"
                stroke={unit.status === 'locked' ? 'rgba(255,255,255,0.2)' : unit.status === 'completed' ? '#FFD200' : '#F05AA6'}
                strokeWidth="4"
                strokeDasharray={unit.status === 'locked' ? '8 8' : '10 7'}
                fill="none" strokeLinecap="round"
                opacity={unit.status === 'locked' ? 1 : 0.7} />
            ) : (
              <path d="M136 0 C136 30 40 22 40 52"
                stroke={unit.status === 'locked' ? 'rgba(255,255,255,0.2)' : unit.status === 'completed' ? '#FFD200' : '#F05AA6'}
                strokeWidth="4"
                strokeDasharray={unit.status === 'locked' ? '8 8' : '10 7'}
                fill="none" strokeLinecap="round"
                opacity={unit.status === 'locked' ? 1 : 0.75} />
            )}
          </svg>
        </div>
      )}
    </div>
  );
}
