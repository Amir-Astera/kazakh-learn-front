import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
  light?: boolean;
}

export default function LoadingSpinner({ message = 'Жүктелуде...', light = false }: LoadingSpinnerProps) {
  return (
    <div className={`loading-container ${light ? 'light' : ''}`}>
      <div className="loading-dots">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
      <span className="loading-msg">{message}</span>
    </div>
  );
}
