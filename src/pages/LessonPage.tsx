import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLesson, submitAnswer, completeLesson } from '../api';
import { useAuth } from '../context/AuthContext';
import SpeechInput from '../components/SpeechInput';
import './LessonPage.css';
import mascotImg from '../assets/ChatGPT Image 6 мар. 2026 г., 23_45_55.png';
import violinImg from '../assets/deco-violin.png';
import bookImg from '../assets/deco-book.png';
import yurtImg from '../assets/deco-yurt.png';
import dombraImg from '../assets/deco-dombra.png';

interface Exercise {
  id: number;
  type: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
}

interface LessonData {
  id: number;
  title: string;
  type: string;
  xp_reward: number;
  exercises: Exercise[];
}

type FeedbackState = {
  correct: boolean;
  explanation?: string | null;
  correct_answer?: string;
} | null;

type LessonShellProps = {
  badge: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

function getExerciseTypeLabel(type: string) {
  switch (type) {
    case 'speaking':
      return 'Практика произношения';
    case 'choice':
    case 'multiple_choice':
      return 'Выберите правильный ответ';
    case 'translation':
      return 'Перевод';
    case 'sentence':
      return 'Соберите предложение';
    case 'listening':
      return 'Аудирование';
    default:
      return 'Задание урока';
  }
}

function LessonShell({ badge, title, subtitle, children }: LessonShellProps) {
  return (
    <div className="lesson-page">
      <svg className="lesson-bg-wave" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 0 0 L 58 0 C 84 5 24 35 50 100 L 0 100 Z" fill="#22c55e" />
      </svg>

      <div className="lesson-panel-left">
        {children}
      </div>

      <div className="lesson-panel-right">
        <div className="lesson-right-inner">
          <div className="lesson-right-copy">
            <span className="lesson-right-badge">{badge}</span>
            <h2 className="lesson-right-title">{title}</h2>
            <p className="lesson-right-subtitle">{subtitle}</p>
          </div>

          <div className="lesson-mascot-area">
            <div className="lesson-mascot-circle">
              <img className="lesson-mascot-img" src={mascotImg} alt="Mascot" />
            </div>
            <div className="lesson-deco-item lesson-deco-violin"><img src={violinImg} alt="" /></div>
            <div className="lesson-deco-item lesson-deco-book"><img src={bookImg} alt="" /></div>
            <div className="lesson-deco-item lesson-deco-yurt"><img src={yurtImg} alt="" /></div>
            <div className="lesson-deco-item lesson-deco-dombra"><img src={dombraImg} alt="" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!lessonId) return;
    getLesson(parseInt(lessonId, 10))
      .then(res => {
        const data = res.data;
        if (data.exercises) {
          data.exercises = data.exercises.map((ex: any) => ({
            ...ex,
            options: typeof ex.options === 'string' ? JSON.parse(ex.options) : ex.options,
          }));
        }
        setLesson(data);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [lessonId, navigate]);

  if (loading) {
    return (
      <LessonShell
        badge="Lesson mode"
        title="Подготавливаем урок"
        subtitle="Загружаю упражнения, прогресс и практические задания."
      >
        <div className="lesson-container lesson-state-layout">
          <div className="lesson-loading">Загрузка урока...</div>
        </div>
      </LessonShell>
    );
  }

  if (!lesson) {
    return null;
  }

  if (!lesson.exercises || lesson.exercises.length === 0) {
    return (
      <LessonShell
        badge="Lesson draft"
        title="Урок в разработке"
        subtitle="Контент ещё не опубликован. Можно вернуться назад и выбрать другой урок."
      >
        <div className="lesson-container lesson-state-layout">
          <div className="lesson-complete lesson-complete-card">
            <div className="complete-icon">&#128679;</div>
            <h2>Урок в разработке</h2>
            <p className="complete-title">{lesson.title}</p>
            <p className="lesson-state-copy">Упражнения для этого урока скоро появятся.</p>
            <button className="lesson-btn continue" onClick={() => navigate(-1)}>
              Назад
            </button>
          </div>
        </div>
      </LessonShell>
    );
  }

  const exercise = lesson.exercises[currentIndex];
  const totalExercises = lesson.exercises.length;
  const solvedExercises = currentIndex + (feedback ? 1 : 0);
  const progress = (solvedExercises / totalExercises) * 100;
  const finalAccuracy = Math.max(0, 100 - mistakes * 15);
  const exerciseTypeLabel = getExerciseTypeLabel(exercise.type);

  const handleCheck = async () => {
    if (!selectedAnswer || !exercise) return;

    try {
      const res = await submitAnswer(lesson.id, exercise.id, selectedAnswer);
      setFeedback(res.data);
      if (res.data.correct) {
        setScore(prev => prev + Math.floor(100 / totalExercises));
      } else {
        setMistakes(prev => prev + 1);
      }
    } catch {
      setFeedback({ correct: false, correct_answer: exercise.correct_answer });
      setMistakes(prev => prev + 1);
    }
  };

  const handleSpeechResult = (_transcript: string, isMatch: boolean) => {
    if (feedback) return;

    if (isMatch) {
      setScore(prev => prev + Math.floor(100 / totalExercises));
      setFeedback({ correct: true, correct_answer: exercise.correct_answer });
    } else {
      setMistakes(prev => prev + 1);
      setFeedback({ correct: false, correct_answer: exercise.correct_answer });
    }
  };

  const handleNext = async () => {
    if (currentIndex < totalExercises - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer('');
      setFeedback(null);
      return;
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    try {
      const res = await completeLesson(lesson.id, {
        score: finalAccuracy,
        mistakes,
        timeSpent,
      });
      setXpEarned(res.data.xp_earned);
      await refreshUser();
    } catch {}
    setCompleted(true);
  };

  if (completed) {
    return (
      <LessonShell
        badge="Lesson complete"
        title="Отличная работа"
        subtitle="Ты завершил урок и можешь вернуться на дорожку, чтобы открыть следующий шаг."
      >
        <div className="lesson-container lesson-state-layout">
          <div className="lesson-complete lesson-complete-card">
            <div className="complete-icon">&#127881;</div>
            <h2>Урок завершён!</h2>
            <p className="complete-title">{lesson.title}</p>
            <div className="complete-stats">
              <div className="complete-stat">
                <span className="stat-value">{xpEarned}</span>
                <span className="stat-label">XP получено</span>
              </div>
              <div className="complete-stat">
                <span className="stat-value">{finalAccuracy}%</span>
                <span className="stat-label">Точность</span>
              </div>
              <div className="complete-stat">
                <span className="stat-value">{mistakes}</span>
                <span className="stat-label">Ошибки</span>
              </div>
            </div>
            <button className="lesson-btn continue" onClick={() => navigate(-1)}>
              Вернуться к модулю
            </button>
          </div>
        </div>
      </LessonShell>
    );
  }

  return (
    <LessonShell
      badge="Interactive lesson"
      title={lesson.title}
      subtitle="Решай задания по шагам и заверши практику, чтобы открыть следующий урок на дороге."
    >
      <div className="lesson-container">
        <div className="lesson-header lesson-header-card">
          <button className="lesson-close" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>

          <div className="lesson-header-copy">
            <span className="lesson-kicker">Lesson progression</span>
            <h1 className="lesson-title">{lesson.title}</h1>
          </div>

          <div className="lesson-progress-stack">
            <div className="lesson-progress-bar">
              <div className="lesson-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="lesson-counter">{currentIndex + 1}/{totalExercises}</span>
          </div>
        </div>

        <div className="lesson-metrics-row">
          <div className="lesson-metric-pill">
            <span className="lesson-metric-label">Тип</span>
            <span className="lesson-metric-value">{exerciseTypeLabel}</span>
          </div>
          <div className="lesson-metric-pill">
            <span className="lesson-metric-label">Очки</span>
            <span className="lesson-metric-value">{score}</span>
          </div>
          <div className="lesson-metric-pill">
            <span className="lesson-metric-label">Ошибки</span>
            <span className="lesson-metric-value">{mistakes}</span>
          </div>
        </div>

        <div className="exercise-area lesson-exercise-card">
          <div className="exercise-type-badge">{exerciseTypeLabel}</div>
          <h2 className="exercise-question">{exercise.question}</h2>

          {exercise.type === 'speaking' ? (
            <div className="lesson-speaking-wrap">
              <div className="lesson-speaking-note">
                Произнесите слово или фразу как можно ближе к правильному варианту.
              </div>
              <SpeechInput
                targetWord={exercise.correct_answer}
                onResult={handleSpeechResult}
                disabled={!!feedback}
              />
            </div>
          ) : (
            <div className="exercise-options">
              {exercise.options && exercise.options.map((option: string, i: number) => (
                <button
                  key={i}
                  className={`option-btn ${selectedAnswer === option ? 'selected' : ''} ${
                    feedback
                      ? option === feedback.correct_answer
                        ? 'correct'
                        : selectedAnswer === option && !feedback.correct
                          ? 'wrong'
                          : ''
                      : ''
                  }`}
                  onClick={() => !feedback && setSelectedAnswer(option)}
                  disabled={!!feedback}
                >
                  <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="option-copy">{option}</span>
                </button>
              ))}
            </div>
          )}

          {feedback && (
            <div className={`feedback-bar ${feedback.correct ? 'correct' : 'wrong'}`}>
              <div className="feedback-icon">
                {feedback.correct ? '✓' : '✗'}
              </div>
              <div className="feedback-text">
                <strong>{feedback.correct ? 'Правильно!' : 'Неправильно'}</strong>
                {!feedback.correct && feedback.correct_answer && (
                  <span> · Правильный ответ: <strong>{feedback.correct_answer}</strong></span>
                )}
                {feedback.explanation && <p className="feedback-explanation">{feedback.explanation}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="lesson-footer lesson-footer-card">
          <div className="lesson-footer-copy">
            {!feedback
              ? exercise.type === 'speaking'
                ? 'После успешного распознавания появится кнопка перехода к следующему шагу.'
                : 'Выберите вариант ответа и проверьте себя.'
              : currentIndex < totalExercises - 1
                ? 'Ответ зафиксирован. Можно переходить к следующему упражнению.'
                : 'Последний шаг. Завершите урок и получите награду.'}
          </div>

          {!feedback && exercise.type !== 'speaking' ? (
            <button
              className="lesson-btn check"
              onClick={handleCheck}
              disabled={!selectedAnswer}
            >
              Проверить
            </button>
          ) : feedback ? (
            <button className="lesson-btn continue" onClick={handleNext}>
              {currentIndex < totalExercises - 1 ? 'Далее' : 'Завершить урок'}
            </button>
          ) : null}
        </div>
      </div>
    </LessonShell>
  );
}
