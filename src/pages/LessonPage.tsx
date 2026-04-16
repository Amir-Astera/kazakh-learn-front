import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLesson, submitAnswer, completeLesson } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
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
  content: string | null;
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

function getExerciseTypeLabel(type: string, t: (key: string) => string) {
  const norm = type === 'multiple_choice' ? 'choice' : type;
  const key = `lessonType.${norm}`;
  const val = t(key);
  return val !== key ? val : t('lessonType.default');
}

function renderSimpleMarkdown(text: string): ReactNode[] {
  const lines = text.split('\n');
  const result: ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    result.push(
      <ul key={result.length} className="theory-list">
        {listBuffer.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((line, i) => {
    if (line.startsWith('### ')) {
      flushList();
      result.push(<h3 key={i} className="theory-h3">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      flushList();
      result.push(<h2 key={i} className="theory-h2">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      flushList();
      result.push(<h1 key={i} className="theory-h1">{line.slice(2)}</h1>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listBuffer.push(line.slice(2));
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      flushList();
      result.push(<p key={i} className="theory-bold-line"><strong>{line.slice(2, -2)}</strong></p>);
    } else if (line.trim() === '') {
      flushList();
      result.push(<div key={i} className="theory-spacer" />);
    } else {
      flushList();
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      result.push(
        <p key={i} className="theory-p">
          {parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={j}>{part.slice(2, -2)}</strong>
              : part
          )}
        </p>
      );
    }
  });
  flushList();
  return result;
}

function TheoryLesson({ lesson, onComplete }: { lesson: LessonData; onComplete: () => void }) {
  const { t } = useLang();
  const [page, setPage] = useState(0);
  const content = lesson.content || '';
  const sections = content.split(/\n---\n/).map(s => s.trim()).filter(Boolean);
  const pages = sections.length > 0 ? sections : [content];
  const total = pages.length;
  const isLast = page === total - 1;

  return (
    <div className="lesson-container">
      <div className="lesson-header lesson-header-card">
        <div className="lesson-header-copy">
          <span className="lesson-kicker">{t('theory.kicker')}</span>
          <h1 className="lesson-title">{lesson.title}</h1>
        </div>
        <div className="lesson-progress-stack">
          <div className="lesson-progress-bar">
            <div className="lesson-progress-fill" style={{ width: `${((page + 1) / total) * 100}%` }} />
          </div>
          <span className="lesson-counter">{page + 1}/{total}</span>
        </div>
      </div>

      <div className="theory-card exercise-area lesson-exercise-card">
        <div className="theory-content">
          {renderSimpleMarkdown(pages[page])}
        </div>
      </div>

      <div className="lesson-footer lesson-footer-card">
        <div className="lesson-footer-copy">
          {isLast ? t('theory.footerLast') : t('theory.footerMore')}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {page > 0 && (
            <button className="lesson-btn check" onClick={() => setPage(p => p - 1)}>{t('lesson.back')}</button>
          )}
          {!isLast ? (
            <button className="lesson-btn continue" onClick={() => setPage(p => p + 1)}>{t('lesson.next')}</button>
          ) : (
            <button className="lesson-btn continue" onClick={onComplete}>{t('theory.complete')}</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Listening Exercise ───────────────────────────────────────────────────────
function ListeningExercise({
  exercise, selectedAnswer, setSelectedAnswer, feedback,
}: {
  exercise: Exercise;
  selectedAnswer: string;
  setSelectedAnswer: (v: string) => void;
  feedback: FeedbackState;
}) {
  const { t } = useLang();
  const [played, setPlayed] = useState(false);

  const speak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(exercise.correct_answer);
    utt.lang = 'kk-KZ';
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
    setPlayed(true);
  };

  return (
    <div className="listening-wrap">
      <div className="listening-play-area">
        <button className={`listening-play-btn ${played ? 'played' : ''}`} onClick={speak} type="button">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
        </button>
        <div className="listening-hint">
          {played ? t('listening.hintAfter') : t('listening.hintBefore')}
        </div>
      </div>
      <div className="exercise-options">
        {exercise.options && exercise.options.map((option: string, i: number) => (
          <button
            key={i}
            className={`option-btn ${selectedAnswer === option ? 'selected' : ''} ${
              feedback
                ? option === feedback.correct_answer ? 'correct'
                  : selectedAnswer === option && !feedback.correct ? 'wrong' : ''
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
    </div>
  );
}

// ── Sentence Builder Exercise ─────────────────────────────────────────────────
function SentenceExercise({
  exercise, selectedAnswer, setSelectedAnswer, feedback,
}: {
  exercise: Exercise;
  selectedAnswer: string;
  setSelectedAnswer: (v: string) => void;
  feedback: FeedbackState;
}) {
  const { t } = useLang();
  const words = selectedAnswer ? selectedAnswer.split(' ').filter(Boolean) : [];
  const allWords = exercise.options || [];
  // Count usage per word to handle duplicates
  const usedCount: Record<string, number> = {};
  words.forEach(w => { usedCount[w] = (usedCount[w] || 0) + 1; });
  const availCount: Record<string, number> = {};
  allWords.forEach(w => { availCount[w] = (availCount[w] || 0) + 1; });

  const addWord = (word: string) => {
    if (feedback) return;
    const newWords = [...words, word];
    setSelectedAnswer(newWords.join(' '));
  };

  const removeWord = (index: number) => {
    if (feedback) return;
    const newWords = words.filter((_, i) => i !== index);
    setSelectedAnswer(newWords.join(' '));
  };

  const isWordAvailable = (word: string) => {
    const used = usedCount[word] || 0;
    const avail = availCount[word] || 0;
    return used < avail;
  };

  return (
    <div className="sentence-wrap">
      <div className="sentence-drop-area">
        {words.length === 0 && (
          <span className="sentence-placeholder">{t('sentence.placeholder')}</span>
        )}
        {words.map((word, i) => (
          <button key={i} className="sentence-word chosen" onClick={() => removeWord(i)} type="button" disabled={!!feedback}>
            {word}
          </button>
        ))}
      </div>
      <div className="sentence-bank">
        {allWords.map((word, i) => (
          <button
            key={i}
            className={`sentence-word bank ${!isWordAvailable(word) || !!feedback ? 'used' : ''}`}
            onClick={() => isWordAvailable(word) && addWord(word)}
            type="button"
            disabled={!isWordAvailable(word) || !!feedback}
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Grammar Fill-in-blank Exercise ────────────────────────────────────────────
function GrammarExercise({
  exercise, selectedAnswer, setSelectedAnswer, feedback,
}: {
  exercise: Exercise;
  selectedAnswer: string;
  setSelectedAnswer: (v: string) => void;
  feedback: FeedbackState;
}) {
  const { t } = useLang();
  // If options exist — render as choice; if no options — free text input
  const hasOptions = exercise.options && exercise.options.length > 0;

  if (hasOptions) {
    return (
      <div className="exercise-options">
        {exercise.options.map((option: string, i: number) => (
          <button
            key={i}
            className={`option-btn ${selectedAnswer === option ? 'selected' : ''} ${
              feedback
                ? option === feedback.correct_answer ? 'correct'
                  : selectedAnswer === option && !feedback.correct ? 'wrong' : ''
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
    );
  }

  return (
    <div className="grammar-input-wrap">
      <input
        className={`grammar-input ${feedback ? (feedback.correct ? 'correct' : 'wrong') : ''}`}
        type="text"
        value={selectedAnswer}
        onChange={e => !feedback && setSelectedAnswer(e.target.value)}
        placeholder={t('grammar.placeholder')}
        disabled={!!feedback}
        autoFocus
      />
    </div>
  );
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
  const { t } = useLang();
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
  const [lockedMessage, setLockedMessage] = useState('');

  const completionAccuracy = Math.max(0, 100 - mistakes * 15);

  useEffect(() => {
    if (!lessonId) return;
    setLockedMessage('');
    setLoading(true);
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
      .catch((err) => {
        if (err.response?.status === 403) {
          setLesson(null);
          setLockedMessage(err.response?.data?.error || t('module.lockedPrev'));
          return;
        }
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [lessonId, navigate, t]);

  if (loading) {
    return (
      <LessonShell
        badge={t('lesson.badgeLoading')}
        title={t('lesson.titleLoading')}
        subtitle={t('lesson.subLoading')}
      >
        <div className="lesson-container lesson-state-layout">
          <div className="lesson-loading">{t('lesson.loadingInner')}</div>
        </div>
      </LessonShell>
    );
  }

  if (!lesson) {
    if (lockedMessage) {
      return (
        <LessonShell
          badge={t('lesson.badgeLocked')}
          title={t('lesson.titleLocked')}
          subtitle={t('lesson.subLocked')}
        >
          <div className="lesson-container lesson-state-layout">
            <div className="lesson-complete lesson-complete-card">
              <div className="complete-icon">🔒</div>
              <h2>{t('lesson.accessTitle')}</h2>
              <p className="lesson-state-copy">{lockedMessage}</p>
              <button className="lesson-btn continue" onClick={() => navigate(-1)}>
                {t('lesson.backShort')}
              </button>
            </div>
          </div>
        </LessonShell>
      );
    }
    return null;
  }

  if (completed) {
    return (
      <LessonShell
        badge={t('lesson.badgeComplete')}
        title={t('lesson.titleComplete')}
        subtitle={t('lesson.subComplete')}
      >
        <div className="lesson-container lesson-state-layout">
          <div className="lesson-complete lesson-complete-card">
            <div className="complete-icon">&#127881;</div>
            <h2>{t('lesson.doneTitle')}</h2>
            <p className="complete-title">{lesson.title}</p>
            <div className="complete-stats">
              <div className="complete-stat">
                <span className="stat-value">{xpEarned}</span>
                <span className="stat-label">{t('lesson.xpGot')}</span>
              </div>
              <div className="complete-stat">
                <span className="stat-value">{completionAccuracy}%</span>
                <span className="stat-label">{t('lesson.accuracy')}</span>
              </div>
              <div className="complete-stat">
                <span className="stat-value">{mistakes}</span>
                <span className="stat-label">{t('lesson.mistakes')}</span>
              </div>
            </div>
            <button className="lesson-btn continue" onClick={() => navigate(-1)}>
              {t('lesson.backModule')}
            </button>
          </div>
        </div>
      </LessonShell>
    );
  }

  if (lesson.type === 'theory') {
    const handleTheoryComplete = async () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      try {
        const res = await completeLesson(lesson.id, { score: 100, mistakes: 0, timeSpent });
        setXpEarned(res.data.xp_earned);
        await refreshUser();
      } catch {}
      setCompleted(true);
    };

    return (
      <LessonShell
        badge={t('lesson.badgeTheory')}
        title={lesson.title}
        subtitle={t('lesson.subTheory')}
      >
        <TheoryLesson lesson={lesson} onComplete={handleTheoryComplete} />
      </LessonShell>
    );
  }

  if (!lesson.exercises || lesson.exercises.length === 0) {
    return (
      <LessonShell
        badge={t('lesson.badgeDraft')}
        title={t('lesson.titleDraft')}
        subtitle={t('lesson.subDraft')}
      >
        <div className="lesson-container lesson-state-layout">
          <div className="lesson-complete lesson-complete-card">
            <div className="complete-icon">&#128679;</div>
            <h2>{t('lesson.titleDraft')}</h2>
            <p className="complete-title">{lesson.title}</p>
            <p className="lesson-state-copy">{t('lesson.draftBody')}</p>
            <button className="lesson-btn continue" onClick={() => navigate(-1)}>
              {t('lesson.back')}
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
  const exerciseTypeLabel = getExerciseTypeLabel(exercise.type, t);

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
        score: completionAccuracy,
        mistakes,
        timeSpent,
      });
      setXpEarned(res.data.xp_earned);
      await refreshUser();
    } catch {}
    setCompleted(true);
  };

  return (
    <LessonShell
      badge={t('lesson.badgeInteractive')}
      title={lesson.title}
      subtitle={t('lesson.subInteractive')}
    >
      <div className="lesson-container">
        <div className="lesson-header lesson-header-card">
          <button className="lesson-close" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>

          <div className="lesson-header-copy">
            <span className="lesson-kicker">{t('lesson.kickerProgress')}</span>
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
            <span className="lesson-metric-label">{t('lesson.metricType')}</span>
            <span className="lesson-metric-value">{exerciseTypeLabel}</span>
          </div>
          <div className="lesson-metric-pill">
            <span className="lesson-metric-label">{t('lesson.metricScore')}</span>
            <span className="lesson-metric-value">{score}</span>
          </div>
          <div className="lesson-metric-pill">
            <span className="lesson-metric-label">{t('lesson.metricErrors')}</span>
            <span className="lesson-metric-value">{mistakes}</span>
          </div>
        </div>

        <div className="exercise-area lesson-exercise-card">
          <div className="exercise-type-badge">{exerciseTypeLabel}</div>
          <h2 className="exercise-question">{exercise.question}</h2>

          {exercise.type === 'speaking' ? (
            <div className="lesson-speaking-wrap">
              <div className="lesson-speaking-note">
                {t('lesson.speakHint')}
              </div>
              <SpeechInput
                key={exercise.id}
                targetWord={exercise.correct_answer}
                onResult={handleSpeechResult}
                disabled={!!feedback}
              />
            </div>
          ) : exercise.type === 'listening' ? (
            <ListeningExercise
              exercise={exercise}
              selectedAnswer={selectedAnswer}
              setSelectedAnswer={setSelectedAnswer}
              feedback={feedback}
            />
          ) : exercise.type === 'sentence' ? (
            <SentenceExercise
              exercise={exercise}
              selectedAnswer={selectedAnswer}
              setSelectedAnswer={setSelectedAnswer}
              feedback={feedback}
            />
          ) : exercise.type === 'grammar' ? (
            <GrammarExercise
              exercise={exercise}
              selectedAnswer={selectedAnswer}
              setSelectedAnswer={setSelectedAnswer}
              feedback={feedback}
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
                <strong>{feedback.correct ? t('lesson.correct') : t('lesson.wrongTitle')}</strong>
                {!feedback.correct && feedback.correct_answer && (
                  <span> · {t('lesson.correctAnswer')}: <strong>{feedback.correct_answer}</strong></span>
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
                ? t('lesson.footerSpeak')
                : t('lesson.footerBefore')
              : currentIndex < totalExercises - 1
                ? t('lesson.footerAfter')
                : t('lesson.footerLast')}
          </div>

          {!feedback && exercise.type !== 'speaking' ? (
            <button
              className="lesson-btn check"
              onClick={handleCheck}
              disabled={!selectedAnswer}
            >
              {t('lesson.check')}
            </button>
          ) : feedback ? (
            <button className="lesson-btn continue" onClick={handleNext}>
              {currentIndex < totalExercises - 1 ? t('lesson.next') : t('lesson.finishLesson')}
            </button>
          ) : null}
        </div>
      </div>
    </LessonShell>
  );
}
