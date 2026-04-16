import { useState, useCallback, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import './SpeechInput.css';

interface SpeechInputProps {
  targetWord: string;
  onResult: (transcript: string, isMatch: boolean) => void;
  disabled?: boolean;
}

const MAX_ATTEMPTS = 3;

export default function SpeechInput({ targetWord, onResult, disabled = false }: SpeechInputProps) {
  const { t } = useLang();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'success' | 'fail' | 'no-support'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [similarity, setSimilarity] = useState(0);

  useEffect(() => {
    setListening(false);
    setTranscript('');
    setStatus('idle');
    setAttempts(0);
    setSimilarity(0);
  }, [targetWord]);

  const startListening = useCallback(() => {
    if (disabled || status === 'success') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('no-support');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'kk-KZ';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    setListening(true);
    setStatus('listening');
    setTranscript('');

    recognition.onresult = (event: any) => {
      const alternatives: string[] = [];
      for (let i = 0; i < event.results[0].length; i++) {
        alternatives.push(event.results[0][i].transcript.trim());
      }

      const target = normalizeKazakh(targetWord);
      let bestTranscript = alternatives[0] || '';
      let bestSimilarity = 0;
      let isMatch = false;

      for (const alt of alternatives) {
        const normalized = normalizeKazakh(alt);
        if (normalized === target) {
          isMatch = true;
          bestTranscript = alt;
          bestSimilarity = 1;
          break;
        }
        const sim = calculateSimilarity(normalized, target);
        if (sim > bestSimilarity) {
          bestSimilarity = sim;
          bestTranscript = alt;
        }
      }

      if (!isMatch) {
        isMatch = bestSimilarity >= 0.72;
      }

      setAttempts((prevAttempts) => {
        const next = prevAttempts + 1;
        return next;
      });
      setTranscript(bestTranscript);
      setSimilarity(Math.round(bestSimilarity * 100));
      setStatus(isMatch ? 'success' : 'fail');
      setListening(false);
      onResult(bestTranscript, isMatch);
    };

    recognition.onerror = (event: any) => {
      setListening(false);
      if (event.error === 'no-speech') {
        setTranscript('Речь не распознана. Говорите чётче и ближе к микрофону.');
      } else if (event.error === 'not-allowed') {
        setTranscript('Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.');
      } else {
        setTranscript(t('speech.recognizeFail'));
      }
      setStatus('fail');
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  }, [disabled, targetWord, onResult, status, t]);

  const canRetry = status === 'fail' && attempts < MAX_ATTEMPTS && !disabled;

  return (
    <div className="speech-input">
      <div className="speech-target">
        <span className="speech-label">{t('speech.say')}</span>
        <span className="speech-word">{targetWord}</span>
        {targetWord && (
          <span className="speech-phonetic">{toSimpleTranslit(targetWord)}</span>
        )}
      </div>

      {status === 'no-support' ? (
        <div className="speech-no-support">
          <span>🎤</span>
          <p>{t('speech.noSupport')}</p>
          <p className="speech-no-support-hint">{t('speech.noSupportHint')}</p>
        </div>
      ) : (
        <button
          className={`speech-btn ${listening ? 'active' : ''} ${status === 'success' ? 'success' : ''} ${status === 'fail' && !listening ? 'fail' : ''} ${disabled || status === 'success' ? 'disabled' : ''}`}
          onClick={startListening}
          disabled={listening || disabled || status === 'success'}
        >
          <div className="speech-btn-inner">
            {listening ? (
              <div className="speech-waves">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
              </div>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            )}
          </div>
          <span className="speech-btn-label">
            {disabled || status === 'success'
              ? t('speech.answerLocked')
              : listening
              ? t('speech.listening')
              : status === 'idle'
              ? t('speech.tap')
              : canRetry
              ? t('speech.retryLeft').replace('{n}', String(MAX_ATTEMPTS - attempts))
              : t('speech.tap')}
          </span>
        </button>
      )}

      {transcript && status !== 'listening' && status !== 'no-support' && (
        <div className={`speech-result ${status}`}>
          <span className="speech-result-icon">
            {status === 'success' ? '✓' : '✗'}
          </span>
          <div className="speech-result-body">
            {status === 'success' ? (
              <span className="speech-result-text">
                {t('speech.great')} <strong>&quot;{transcript}&quot;</strong>
              </span>
            ) : (
              <>
                <span className="speech-result-text">
                  {t('speech.said')} <strong>&quot;{transcript}&quot;</strong>
                  {similarity > 0 && <span className="speech-similarity"> · {similarity}% {t('speech.similarity')}</span>}
                </span>
                {!canRetry && attempts >= MAX_ATTEMPTS && (
                  <span className="speech-correct-hint">
                    {t('speech.correctIs')}: <strong>{targetWord}</strong>
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {attempts > 0 && status !== 'success' && (
        <div className="speech-attempts">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
            <div key={i} className={`speech-attempt-dot ${i < attempts ? 'used' : ''}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function normalizeKazakh(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/ə/g, 'а')
    .replace(/ä/g, 'а')
    .replace(/ғ/g, 'г')
    .replace(/қ/g, 'к')
    .replace(/ң/g, 'н')
    .replace(/ө/g, 'о')
    .replace(/ұ/g, 'у')
    .replace(/ү/g, 'у')
    .replace(/һ/g, 'х')
    .replace(/і/g, 'и')
    .replace(/[^а-яёa-z0-9\s]/gi, '');
}

function toSimpleTranslit(text: string): string {
  const map: Record<string, string> = {
    'ә': 'ae', 'ғ': 'gh', 'қ': 'q', 'ң': 'ng', 'ө': 'oe',
    'ұ': 'u', 'ү': 'ue', 'һ': 'h', 'і': 'i',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y',
    'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh',
    'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e',
    'ю': 'yu', 'я': 'ya',
  };
  return text.toLowerCase().split('').map(ch => map[ch] ?? ch).join('');
}

function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const maxLen = Math.max(a.length, b.length);
  return 1 - matrix[b.length][a.length] / maxLen;
}
