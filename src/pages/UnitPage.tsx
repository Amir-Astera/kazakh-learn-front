import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUnitLessons } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import './UnitPage.css';

interface Lesson {
  id: number;
  title: string;
  type: string;
  xp_reward: number;
  order_num: number;
  completed: boolean;
  score: number;
}

export default function UnitPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unitId) return;
    getUnitLessons(parseInt(unitId))
      .then(res => setLessons(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [unitId, navigate]);

  const typeLabels: Record<string, string> = {
    translation: 'Перевод',
    choice: 'Выбор ответа',
    sentence: 'Составление',
    listening: 'Аудирование',
    speaking: 'Произношение',
  };

  const typeColors: Record<string, string> = {
    translation: 'var(--bg-sky)',
    choice: 'var(--grass-light)',
    sentence: 'var(--accent-orange)',
    listening: 'var(--accent-pink)',
    speaking: 'var(--accent-red)',
  };

  if (loading) {
    return (
      <div className="unit-page">
        <div className="unit-container">
          <LoadingSpinner message="Загрузка уроков..." />
        </div>
      </div>
    );
  }

  return (
    <div className="unit-page">
      <div className="bg-clouds">
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
      </div>

      <div className="unit-container">
        <button className="unit-back" onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Назад к модулю
        </button>

        <h1 className="unit-title">Уроки</h1>

        <div className="lessons-list">
          {lessons.map((lesson, index) => {
            const isLocked = index > 0 && !lessons[index - 1].completed && !lesson.completed;
            
            return (
              <div
                key={lesson.id}
                className={`lesson-card ${lesson.completed ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
                onClick={() => !isLocked && navigate(`/lesson/${lesson.id}`)}
              >
                <div className="lesson-card-num" style={{
                  background: lesson.completed ? 'var(--accent-yellow)' : isLocked ? 'rgba(10,29,58,0.1)' : typeColors[lesson.type] || 'var(--bg-sky)'
                }}>
                  {lesson.completed ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--bg-night)">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  ) : isLocked ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(10,29,58,0.3)">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="lesson-card-info">
                  <div className="lesson-card-title">{lesson.title}</div>
                  <div className="lesson-card-meta">
                    <span className="lesson-type-tag" style={{ color: typeColors[lesson.type] }}>
                      {typeLabels[lesson.type] || lesson.type}
                    </span>
                    <span className="lesson-xp">+{lesson.xp_reward} XP</span>
                  </div>
                </div>
                {lesson.completed && (
                  <div className="lesson-card-score">{lesson.score}%</div>
                )}
                {!lesson.completed && !isLocked && (
                  <div className="lesson-card-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-muted)">
                      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
