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
  mistakes: number;
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
    grammar: 'Грамматика',
    sentence: 'Составление',
    listening: 'Аудирование',
    speaking: 'Произношение',
  };

  const typeColors: Record<string, string> = {
    translation: 'var(--blue-500)',
    choice: 'var(--brand-500)',
    grammar: 'var(--violet-500)',
    sentence: 'var(--orange-500)',
    listening: 'var(--violet-500)',
    speaking: 'var(--red-500)',
  };

  const completedCount = lessons.filter(lesson => lesson.completed).length;
  const totalLessons = lessons.length;
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const nextLesson =
    lessons.find((lesson, index) => !lesson.completed && (index === 0 || lessons[index - 1].completed)) ||
    lessons[0] ||
    null;

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
      <div className="unit-container">
        <button className="unit-back" type="button" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Назад к модулю
        </button>

        <section className="unit-hero">
          <div className="unit-hero-main">
            <span className="unit-badge">Unit {unitId}</span>
            <h1 className="unit-title">Список уроков</h1>
            <p className="unit-subtitle">
              Проходи уроки по порядку. Следующий урок открывается после завершения предыдущего.
            </p>

            <div className="unit-progress-panel">
              <div className="unit-progress-topline">
                <span>Прогресс юнита</span>
                <strong>{progress}%</strong>
              </div>
              <div className="unit-progress-track">
                <div className="unit-progress-fill-bar" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="unit-stats-grid">
              <div className="unit-stat-card">
                <span className="unit-stat-value">{completedCount}/{totalLessons}</span>
                <span className="unit-stat-label">Завершено уроков</span>
              </div>
              <div className="unit-stat-card">
                <span className="unit-stat-value">{lessons.reduce((sum, lesson) => sum + lesson.xp_reward, 0)}</span>
                <span className="unit-stat-label">XP в юните</span>
              </div>
              <div className="unit-stat-card">
                <span className="unit-stat-value">{nextLesson ? nextLesson.order_num : '—'}</span>
                <span className="unit-stat-label">Следующий урок</span>
              </div>
            </div>
          </div>

          <div className="unit-hero-side">
            <div className="unit-next-card">
              <div className="unit-next-title">Готов продолжить?</div>
              <div className="unit-next-desc">
                {nextLesson ? nextLesson.title : 'Уроки появятся здесь, когда юнит будет заполнен.'}
              </div>
              <button
                type="button"
                className="unit-next-btn"
                onClick={() => nextLesson && navigate(`/lesson/${nextLesson.id}`)}
                disabled={!nextLesson}
              >
                {nextLesson ? 'Открыть следующий урок' : 'Пока нет уроков'}
              </button>
            </div>
          </div>
        </section>

        <div className="lessons-list">
          {lessons.map((lesson, index) => {
            const isLocked = index > 0 && !lessons[index - 1].completed && !lesson.completed;
            const isNext = !lesson.completed && !isLocked;
            const completionTone = lesson.completed ? (lesson.mistakes === 0 ? 'perfect' : 'with-mistakes') : '';
            
            return (
              <button
                key={lesson.id}
                type="button"
                className={`lesson-card ${lesson.completed ? `completed ${completionTone}` : ''} ${isLocked ? 'locked' : ''}`}
                onClick={() => !isLocked && navigate(`/lesson/${lesson.id}`)}
                disabled={isLocked}
              >
                <div className="lesson-card-left">
                  <div className="lesson-card-num" style={{
                    background: lesson.completed
                      ? lesson.mistakes === 0
                        ? 'var(--brand-500)'
                        : 'var(--amber-500)'
                      : isLocked
                        ? 'rgba(148,163,184,0.24)'
                        : typeColors[lesson.type] || 'var(--blue-500)'
                }}>
                    {lesson.completed ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  ) : isLocked ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(71,85,105,0.9)">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  </div>

                  <div className="lesson-card-info">
                    <div className="lesson-card-title-row">
                      <div className="lesson-card-title">{lesson.title}</div>
                      {isNext && <span className="lesson-next-pill">Сейчас</span>}
                    </div>
                    <div className="lesson-card-meta">
                      <span className="lesson-type-tag" style={{ color: typeColors[lesson.type] }}>
                        {typeLabels[lesson.type] || lesson.type}
                      </span>
                      <span className="lesson-xp">+{lesson.xp_reward} XP</span>
                      <span className="lesson-order-pill">Урок {lesson.order_num}</span>
                    </div>
                  </div>
                </div>

                <div className="lesson-card-right">
                  {lesson.completed && (
                    <div className={`lesson-card-score ${completionTone}`}>{lesson.score}%</div>
                  )}
                  {!lesson.completed && !isLocked && (
                    <div className="lesson-card-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--slate-500)">
                      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                    </svg>
                  </div>
                  )}
                </div>
              </button>
            );
          })}

          {lessons.length === 0 && (
            <div className="unit-empty-state">
              В этом юните пока нет уроков.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
