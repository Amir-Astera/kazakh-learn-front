import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLesson, submitAnswer, completeLesson } from '../api';
import { useAuth } from '../context/AuthContext';
import SpeechInput from '../components/SpeechInput';
import './LessonPage.css';

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

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation?: string | null; correct_answer?: string } | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!lessonId) return;
    getLesson(parseInt(lessonId))
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

  if (loading || !lesson) {
    return (
      <div className="lesson-page">
        <div className="lesson-container">
          <div className="lesson-loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (!lesson.exercises || lesson.exercises.length === 0) {
    return (
      <div className="lesson-page">
        <div className="lesson-container">
          <div className="lesson-complete">
            <div className="complete-icon">&#128679;</div>
            <h2>Урок в разработке</h2>
            <p className="complete-title">{lesson.title}</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Упражнения для этого урока скоро появятся!</p>
            <button className="lesson-btn continue" onClick={() => navigate(-1)}>
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  const exercise = lesson.exercises[currentIndex];
  const totalExercises = lesson.exercises.length;
  const progress = ((currentIndex) / totalExercises) * 100;

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
    }
  };

  const handleSpeechResult = useCallback((_transcript: string, isMatch: boolean) => {
    if (isMatch) {
      setScore(prev => prev + Math.floor(100 / totalExercises));
      setFeedback({ correct: true, correct_answer: exercise.correct_answer });
    } else {
      setMistakes(prev => prev + 1);
      setFeedback({ correct: false, correct_answer: exercise.correct_answer });
    }
  }, [exercise, totalExercises]);

  const handleNext = async () => {
    if (currentIndex < totalExercises - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer('');
      setFeedback(null);
    } else {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const finalScore = Math.max(0, 100 - mistakes * 15);
      try {
        const res = await completeLesson(lesson.id, {
          score: finalScore,
          mistakes,
          timeSpent,
        });
        setXpEarned(res.data.xp_earned);
        await refreshUser();
      } catch {}
      setCompleted(true);
    }
  };

  if (completed) {
    return (
      <div className="lesson-page">
        <div className="lesson-container">
          <div className="lesson-complete">
            <div className="complete-icon">&#127881;</div>
            <h2>Урок завершён!</h2>
            <p className="complete-title">{lesson.title}</p>
            <div className="complete-stats">
              <div className="complete-stat">
                <span className="stat-value">{xpEarned}</span>
                <span className="stat-label">XP получено</span>
              </div>
              <div className="complete-stat">
                <span className="stat-value">{Math.max(0, 100 - mistakes * 15)}%</span>
                <span className="stat-label">Точность</span>
              </div>
              <div className="complete-stat">
                <span className="stat-value">{mistakes}</span>
                <span className="stat-label">Ошибки</span>
              </div>
            </div>
            <button className="lesson-btn continue" onClick={() => navigate(-1)}>
              Продолжить
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-page">
      <div className="lesson-container">
        <div className="lesson-header">
          <button className="lesson-close" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
          <div className="lesson-progress-bar">
            <div className="lesson-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="lesson-counter">{currentIndex + 1}/{totalExercises}</span>
        </div>

        <div className="exercise-area">
          <div className="exercise-type-badge">{exercise.type}</div>
          <h2 className="exercise-question">{exercise.question}</h2>

          {exercise.type === 'speaking' ? (
            <SpeechInput
              targetWord={exercise.correct_answer}
              onResult={handleSpeechResult}
            />
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
                  {option}
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

        <div className="lesson-footer">
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
              {currentIndex < totalExercises - 1 ? 'Далее' : 'Завершить'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
