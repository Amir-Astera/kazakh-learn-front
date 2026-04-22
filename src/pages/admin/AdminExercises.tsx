import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { adminGetExercises, adminCreateExercise, adminUpdateExercise, adminDeleteExercise, adminGetLessons } from '../../api';

interface Lesson { id: number; title: string; unit_title: string; }
interface Exercise {
  id: number; lesson_id: number; lesson_title: string;
  type: string; question: string; question_en: string | null;
  options: string[] | null;
  correct_answer: string; explanation: string; explanation_en: string | null; order_num: number;
}

const TYPES = ['translation','choice','grammar','sentence','listening','speaking'];
const TYPE_LABELS: Record<string,string> = { translation:'Перевод', choice:'Выбор', grammar:'Грамматика', sentence:'Предложение', listening:'Аудирование', speaking:'Произношение' };

const empty = { lesson_id: 1, type: 'choice', question: '', question_en: '', options: '["Вариант 1","Вариант 2","Вариант 3","Вариант 4"]', correct_answer: '', explanation: '', explanation_en: '', order_num: 1 };

export default function AdminExercises() {
  const [items, setItems]     = useState<Exercise[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filterLesson, setFilterLesson] = useState<number | undefined>(undefined);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [form, setForm]       = useState<typeof empty>(empty);
  const [saving, setSaving]   = useState(false);

  const load = (lid?: number) => {
    adminGetExercises(lid).then(r => setItems(r.data)).catch(() => {});
    adminGetLessons().then(r => setLessons(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const onFilter = (lid: number | undefined) => { setFilterLesson(lid); load(lid); };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty, lesson_id: lessons[0]?.id || 1 });
    setModal(true);
  };
  const openEdit = (ex: Exercise) => {
    setEditing(ex);
    setForm({
      lesson_id: ex.lesson_id, type: ex.type, question: ex.question,
      question_en: ex.question_en || '',
      options: ex.options ? JSON.stringify(ex.options) : '',
      correct_answer: ex.correct_answer, explanation: ex.explanation || '',
      explanation_en: ex.explanation_en || '', order_num: ex.order_num
    });
    setModal(true);
  };
  const close = () => setModal(false);

  const save = async () => {
    setSaving(true);
    try {
      let parsedOptions: string[] | null = null;
      if (form.options.trim()) {
        try { parsedOptions = JSON.parse(form.options); } catch { alert('Неверный формат вариантов (должен быть JSON массив)'); setSaving(false); return; }
      }
      const payload = { ...form, options: parsedOptions };
      if (editing) await adminUpdateExercise(editing.id, payload);
      else await adminCreateExercise(payload);
      load(filterLesson); close();
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Удалить задание?')) return;
    await adminDeleteExercise(id); load(filterLesson);
  };

  const needsOptions = form.type === 'choice' || form.type === 'translation' || form.type === 'listening' || form.type === 'sentence' || (form.type === 'grammar' && form.options.trim() !== '');
  const exerciseHint = form.type === 'speaking'
    ? 'Для произношения в поле «Правильный ответ» укажите слово или фразу, которую ученик должен произнести.'
    : form.type === 'listening'
      ? 'Аудирование: в «Правильный ответ» впишите слово которое будет произнесено TTS. В вариантах — варианты на выбор (JSON-массив).'
      : form.type === 'sentence'
        ? 'Сборка предложения: в «Варианты» укажите все слова JSON-массивом (включая лишние), в «Правильный ответ» — правильный порядок через пробел.'
        : form.type === 'grammar'
          ? 'Грамматика: если оставить варианты пустыми — ученик введёт ответ вручную. С вариантами — задание на выбор.'
          : needsOptions
            ? 'Добавьте варианты ответа JSON-массивом и выберите один правильный ответ.'
            : 'Заполните вопрос и правильный ответ для этого типа задания.';

  return (
    <AdminLayout title="Задания">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Задания (упражнения)</div>
          <div className="admin-page-sub">Интерактивные задания внутри уроков</div>
        </div>
        <button className="btn-admin-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Добавить задание
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.85rem', color: 'var(--bg-night)' }}
          value={filterLesson ?? ''}
          onChange={e => onFilter(e.target.value ? +e.target.value : undefined)}
        >
          <option value="">Все уроки</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.unit_title} → {l.title}</option>)}
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>Урок</th><th>Тип</th><th>Вопрос</th><th>Правильный ответ</th><th>№</th><th>Действия</th>
          </tr></thead>
          <tbody>
            {items.map(ex => (
              <tr key={ex.id}>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: 130 }}>{ex.lesson_title}</td>
                <td><span className="admin-badge admin-badge-purple">{TYPE_LABELS[ex.type] || ex.type}</span></td>
                <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.83rem' }}>{ex.question}</td>
                <td style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.83rem' }}>{ex.correct_answer}</td>
                <td>{ex.order_num}</td>
                <td><div className="actions">
                  <button className="btn-admin-edit" onClick={() => openEdit(ex)}>Изменить</button>
                  <button className="btn-admin-danger" onClick={() => del(ex.id)}>Удалить</button>
                </div></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="admin-empty">Заданий нет</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="admin-modal-backdrop" onClick={close}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-title">{editing ? 'Редактировать задание' : 'Новое задание'}</div>
            <div className="admin-form">
              <div className="admin-field"><label>Урок</label>
                <select value={form.lesson_id} onChange={e => setForm({...form, lesson_id: +e.target.value})}>
                  {lessons.map(l => <option key={l.id} value={l.id}>{l.unit_title} → {l.title}</option>)}
                </select></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="admin-field"><label>Тип задания</label>
                  <select value={form.type} onChange={e => setForm(prev => ({
                    ...prev,
                    type: e.target.value,
                    options: e.target.value === 'choice' || e.target.value === 'translation'
                      ? (prev.options.trim() ? prev.options : '["Вариант 1","Вариант 2","Вариант 3","Вариант 4"]')
                      : ''
                  }))}>
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select></div>
                <div className="admin-field"><label>Порядок</label>
                  <input type="number" value={form.order_num} onChange={e => setForm({...form, order_num: +e.target.value})} /></div>
              </div>

              <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: -4 }}>
                {exerciseHint}
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', marginBottom: 4, border: '1.5px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', marginBottom: 8, letterSpacing: '0.04em' }}>🌐 ВОПРОС / ЗАДАНИЕ</div>
                <div className="admin-field" style={{ marginBottom: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ background: '#dc2626', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>RU</span>
                    На русском
                  </label>
                  <textarea value={form.question} onChange={e => setForm({...form, question: e.target.value})} placeholder={
                    form.type === 'speaking' ? 'Произнесите: "Сәлеметсіз бе"'
                    : form.type === 'listening' ? 'Прослушайте и выберите правильный перевод'
                    : form.type === 'sentence' ? 'Составьте предложение: "Менің атым Амир"'
                    : form.type === 'grammar' ? 'Вставьте пропущенное слово: "Менің ___ Амир"'
                    : 'Переведите: "Привет"'
                  } />
                </div>
                <div className="admin-field" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ background: '#2563eb', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>EN</span>
                    In English (необязательно)
                  </label>
                  <textarea value={form.question_en} onChange={e => setForm({...form, question_en: e.target.value})} placeholder={
                    form.type === 'speaking' ? 'Say: "Сәлеметсіз бе"'
                    : form.type === 'listening' ? 'Listen and choose the correct translation'
                    : form.type === 'sentence' ? 'Build the sentence: "Менің атым Амир"'
                    : form.type === 'grammar' ? 'Fill in the blank: "Менің ___ Амир"'
                    : 'Translate: "Hello"'
                  } />
                </div>
              </div>

              {(form.type === 'choice' || form.type === 'translation' || form.type === 'listening' || form.type === 'sentence' || form.type === 'grammar') && (
                <div className="admin-field">
                  <label>Варианты ответа (JSON массив)</label>
                  <textarea value={form.options} onChange={e => setForm({...form, options: e.target.value})} rows={3} placeholder='["Вариант 1","Вариант 2","Вариант 3","Вариант 4"]' />
                  <div style={{ fontSize: '0.71rem', color: '#94a3b8', marginTop: 3 }}>Формат: ["Ответ1","Ответ2","Ответ3","Ответ4"]</div>
                </div>
              )}

              <div className="admin-field"><label>Правильный ответ</label>
                <input value={form.correct_answer} onChange={e => setForm({...form, correct_answer: e.target.value})} placeholder={form.type === 'speaking' ? 'Сәлеметсіз бе' : 'Сәлем'} /></div>

              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', marginBottom: 8, letterSpacing: '0.04em' }}>💡 ПОЯСНЕНИЕ (необязательно)</div>
                <div className="admin-field" style={{ marginBottom: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ background: '#dc2626', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>RU</span>
                    На русском
                  </label>
                  <input value={form.explanation} onChange={e => setForm({...form, explanation: e.target.value})} placeholder="Сәлем — приветствие в казахском языке" />
                </div>
                <div className="admin-field" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ background: '#2563eb', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>EN</span>
                    In English
                  </label>
                  <input value={form.explanation_en} onChange={e => setForm({...form, explanation_en: e.target.value})} placeholder="Sәlem — a greeting in the Kazakh language" />
                </div>
              </div>

              <div className="admin-form-actions">
                <button className="btn-admin-cancel" onClick={close}>Отмена</button>
                <button className="btn-admin-primary" onClick={save} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
