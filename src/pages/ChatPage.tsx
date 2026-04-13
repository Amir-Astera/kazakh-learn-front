import { useState, useRef, useEffect } from 'react';
import { sendChatMessage, type ChatMessage } from '../api';
import './ChatPage.css';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Сәлем! Мен сіздің қазақ тілі бойынша көмекшіңізбін.\n\nПривет! Я твой помощник по казахскому языку. Задавай любые вопросы об алфавите, грамматике, переводах и произношении.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(nextMessages);
      const reply: ChatMessage = { role: 'assistant', content: res.data.reply };
      setMessages(prev => [...prev, reply]);
    } catch (err: any) {
      const errorText = err?.response?.data?.error || 'Произошла ошибка. Попробуйте ещё раз.';
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${errorText}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clear = () => {
    setMessages([{
      role: 'assistant',
      content: 'Сәлем! Мен сіздің қазақ тілі бойынша көмекшіңізбін.\n\nПривет! Я твой помощник по казахскому языку. Задавай любые вопросы об алфавите, грамматике, переводах и произношении.',
    }]);
  };

  return (
    <div className="chat-page">
      <div className="chat-sidebar-col">
        <div className="chat-sidebar-inner">
          <div className="chat-sidebar-icon">🤖</div>
          <h2 className="chat-sidebar-title">AI-ассистент</h2>
          <p className="chat-sidebar-desc">
            Задавай вопросы по казахскому языку — грамматике, переводам, алфавиту и произношению.
          </p>
          <div className="chat-tips">
            <div className="chat-tip-label">Примеры вопросов:</div>
            {[
              'Как сказать "Где находится…" на казахском?',
              'Объясни падежи казахского языка',
              'Переведи слово "кітап"',
              'Какой алфавит используется в Казахстане?',
              'Как произносится буква Ң?',
            ].map((tip, i) => (
              <button
                key={i}
                className="chat-tip-btn"
                onClick={() => { setInput(tip); inputRef.current?.focus(); }}
              >
                {tip}
              </button>
            ))}
          </div>
          <button className="chat-clear-btn" onClick={clear}>
            Очистить чат
          </button>
        </div>
      </div>

      <div className="chat-main-col">
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-header-avatar">🇰🇿</div>
            <div>
              <div className="chat-header-name">Казахский ассистент</div>
              <div className="chat-header-status">Powered by Gemini AI</div>
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble-wrap ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="chat-avatar">🤖</div>
              )}
              <div className={`chat-bubble ${msg.role}`}>
                {msg.content.split('\n').map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-bubble-wrap assistant">
              <div className="chat-avatar">🤖</div>
              <div className="chat-bubble assistant chat-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            className="chat-input"
            rows={1}
            placeholder="Напишите вопрос по казахскому языку..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <button
            className="chat-send-btn"
            onClick={send}
            disabled={!input.trim() || loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
