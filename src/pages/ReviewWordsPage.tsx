import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReviewWords } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import SpeechInput from '../components/SpeechInput';
import { useLang } from '../context/LanguageContext';
import './ReviewWordsPage.css';

export default function ReviewWordsPage() {
  const { t } = useLang();
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
      .catch(() => setError(t('review.loadErr')))
      .finally(() => setLoading(false));
  }, [t]);

  const current = words[active] || '';

  if (loading) {
    return (
      <div className="review-words-page">
        <LoadingSpinner messageKey="review.loading" />
      </div>
    );
  }

  return (
    <div className="review-words-page">
      <button type="button" className="review-back" onClick={() => navigate(-1)}>
        {t('review.back')}
      </button>

      <h1 className="review-title">{t('review.title')}</h1>
      <p className="review-sub">
        {t('review.sub')}
      </p>

      {error && <p className="review-error">{error}</p>}

      {!error && words.length === 0 && (
        <p className="review-empty">{t('review.empty')}</p>
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
              {t('review.prev')}
            </button>
            <button
              type="button"
              className="review-nav-btn primary"
              disabled={active >= words.length - 1}
              onClick={() => setActive(a => Math.min(words.length - 1, a + 1))}
            >
              {t('review.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
