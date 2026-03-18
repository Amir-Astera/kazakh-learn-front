import { useState, useCallback } from 'react';
import './SpeechInput.css';

interface SpeechInputProps {
  targetWord: string;
  onResult: (transcript: string, isMatch: boolean) => void;
  disabled?: boolean;
}

export default function SpeechInput({ targetWord, onResult, disabled = false }: SpeechInputProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'success' | 'fail'>('idle');

  const startListening = useCallback(() => {
    if (disabled) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('fail');
      setTranscript('Speech Recognition не поддерживается в этом браузере');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'kk-KZ';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    setListening(true);
    setStatus('listening');
    setTranscript('');

    recognition.onresult = (event: any) => {
      let bestMatch = '';
      let isMatch = false;

      for (let i = 0; i < event.results[0].length; i++) {
        const result = event.results[0][i].transcript.trim().toLowerCase();
        if (result === targetWord.toLowerCase()) {
          isMatch = true;
          bestMatch = event.results[0][i].transcript;
          break;
        }
        if (!bestMatch) bestMatch = event.results[0][i].transcript;
      }

      if (!isMatch) {
        const similarity = calculateSimilarity(bestMatch.toLowerCase(), targetWord.toLowerCase());
        isMatch = similarity > 0.7;
      }

      setTranscript(bestMatch);
      setStatus(isMatch ? 'success' : 'fail');
      setListening(false);
      onResult(bestMatch, isMatch);
    };

    recognition.onerror = () => {
      setListening(false);
      setStatus('fail');
      setTranscript('Не удалось распознать речь. Попробуйте снова.');
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  }, [disabled, targetWord, onResult]);

  return (
    <div className="speech-input">
      <div className="speech-target">
        <span className="speech-label">Произнесите:</span>
        <span className="speech-word">{targetWord}</span>
      </div>

      <button
        className={`speech-btn ${listening ? 'active' : ''} ${status === 'success' ? 'success' : ''} ${status === 'fail' && !listening ? 'fail' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={startListening}
        disabled={listening || disabled}
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
          {disabled ? 'Ответ уже зафиксирован' : listening ? 'Слушаю...' : status === 'idle' ? 'Нажмите и говорите' : 'Попробовать снова'}
        </span>
      </button>

      {transcript && (
        <div className={`speech-result ${status}`}>
          <span className="speech-result-icon">
            {status === 'success' ? '✓' : '✗'}
          </span>
          <span className="speech-result-text">
            {status === 'success' ? `Отлично! Вы сказали: "${transcript}"` : `Вы сказали: "${transcript}". Попробуйте ещё раз.`}
          </span>
        </div>
      )}
    </div>
  );
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
