import { useState, useRef, useEffect, type ReactNode } from 'react';
import { sendChatMessage, type ChatMessage } from '../api';
import { useLang } from '../context/LanguageContext';
import './ChatPage.css';

/** Простой inline-Markdown: **жирный**, `код` (без HTML из ответа модели). */
function renderInlineMarkdown(text: string, baseKey: string): ReactNode {
  const re = /(\*\*.+?\*\*|`[^`]+`)/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(<span key={`${baseKey}-t-${idx++}`}>{text.slice(last, m.index)}</span>);
    }
    const tok = m[1];
    if (tok.startsWith('**') && tok.endsWith('**') && tok.length > 4) {
      nodes.push(<strong key={`${baseKey}-b-${idx++}`}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) {
      nodes.push(<code key={`${baseKey}-c-${idx++}`} className="chat-inline-code">{tok.slice(1, -1)}</code>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) {
    nodes.push(<span key={`${baseKey}-t-${idx++}`}>{text.slice(last)}</span>);
  }
  return nodes.length > 0 ? nodes : text;
}

/** Блоки для ответа ассистента: переносы, #–###, списки - / *, inline ** и `. */
function renderAssistantMarkdown(content: string): ReactNode {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];
  let k = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={`ul-${k++}`} className="chat-md-ul">
        {listBuffer.map((item, i) => (
          <li key={i} className="chat-md-li">{renderInlineMarkdown(item, `li-${k}-${i}`)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  for (const line of lines) {
    const listMatch = /^\s*[-*]\s+(.+)$/.exec(line);
    if (listMatch) {
      listBuffer.push(listMatch[1]);
      continue;
    }
    flushList();

    if (line.trim() === '') {
      blocks.push(<div key={`gap-${k++}`} className="chat-md-gap" />);
      continue;
    }

    const lineT = line.trimStart();
    if (lineT.startsWith('### ')) {
      blocks.push(
        <h3 key={`h3-${k++}`} className="chat-md-h3">{renderInlineMarkdown(lineT.slice(4), `h3-${k}`)}</h3>
      );
    } else if (lineT.startsWith('## ')) {
      blocks.push(
        <h2 key={`h2-${k++}`} className="chat-md-h2">{renderInlineMarkdown(lineT.slice(3), `h2-${k}`)}</h2>
      );
    } else if (lineT.startsWith('# ')) {
      blocks.push(
        <h2 key={`h1-${k++}`} className="chat-md-h1">{renderInlineMarkdown(lineT.slice(2), `h1-${k}`)}</h2>
      );
    } else {
      blocks.push(
        <p key={`p-${k++}`} className="chat-md-p">{renderInlineMarkdown(line, `p-${k}`)}</p>
      );
    }
  }
  flushList();

  return <div className="chat-md-root">{blocks}</div>;
}

export default function ChatPage() {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const welcome = t('chat.welcome');
    setMessages((prev) => {
      if (prev.length === 0) {
        return [{ role: 'assistant', content: welcome }];
      }
      if (prev.length === 1 && prev[0].role === 'assistant' && prev[0].content !== welcome) {
        return [{ role: 'assistant', content: welcome }];
      }
      return prev;
    });
  }, [lang, t]);

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
    } catch (err: unknown) {
      const errorText = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || t('chat.error');
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
      content: t('chat.welcome'),
    }]);
  };

  const tips = [t('chat.tip1'), t('chat.tip2'), t('chat.tip3'), t('chat.tip4'), t('chat.tip5')];

  return (
    <div className="chat-page">
      <div className="chat-sidebar-col">
        <div className="chat-sidebar-inner">
          <div className="chat-sidebar-icon">🤖</div>
          <h2 className="chat-sidebar-title">{t('chat.sidebarTitle')}</h2>
          <p className="chat-sidebar-desc">
            {t('chat.sidebarDesc')}
          </p>
          <div className="chat-tips">
            <div className="chat-tip-label">{t('chat.tipsLabel')}</div>
            {tips.map((tip, i) => (
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
            {t('chat.clear')}
          </button>
        </div>
      </div>

      <div className="chat-main-col">
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-header-avatar">🇰🇿</div>
            <div>
              <div className="chat-header-name">{t('chat.headerName')}</div>
              <div className="chat-header-status">{t('chat.headerPowered')}</div>
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
                {msg.role === 'assistant'
                  ? renderAssistantMarkdown(msg.content)
                  : msg.content.split('\n').map((line, j, arr) => (
                      <span key={j}>
                        {line}
                        {j < arr.length - 1 && <br />}
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
            placeholder={t('chat.placeholder')}
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
