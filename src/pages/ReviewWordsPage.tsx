import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReviewWords } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import SpeechInput from '../components/SpeechInput';
import './ReviewWordsPage.css';

export default function ReviewWordsPage() {
  const navigate = useNavigate();
  const [words, setWords] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getReviewWords()
      .then(res => {
        setWords(res.data.words || []);
        setActive(0);
      })
      .catch(() => setError('Не удалось загрузить слова'))
      .finally(() => setLoading(false));
  }, []);

  const current = words[active] || '';

  if (loading) {
    return (
      <div className="review-words-page">
        <LoadingSpinner message="Загружаем слова из пройденных уроков…" />
      </div>
    );
  }

  return (
    <div className="review-words-page">
      <button type="button" className="review-back" onClick={() => navigate(-1)}>
        ← Назад
      </button>

      <h1 className="review-title">Повторение слов</h1>
      <p className="review-sub">
        Слова и ответы из уроков, которые вы уже завершили. Произносите вслух для закрепления.
      </p>

      {error && <p className="review-error">{error}</p>}

      {!error && words.length === 0 && (
        <p className="review-empty">Пока нет завершённых уроков с заданиями на слова. Пройдите несколько уроков — список появится здесь.</p>
      )}

      {words.length > 0 && (
        <div className="review-card">
          <div className="review-counter">
            {active + 1} / {words.length}
          </div>
          <SpeechInput key={`${active}-${current}`} targetWord={current} onResult={() => {}} disabled={false} />
          <div className="review-nav">
            <button
              type="button"
              className="review-nav-btn"
              disabled={active <= 0}
              onClick={() => setActive(a => Math.max(0, a - 1))}
            >
              Предыдущее
            </button>
            <button
              type="button"
              className="review-nav-btn primary"
              disabled={active >= words.length - 1}
              onClick={() => setActive(a => Math.min(words.length - 1, a + 1))}
            >
              Следующее
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
