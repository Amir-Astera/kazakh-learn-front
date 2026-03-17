import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { adminGetExercises, adminCreateExercise, adminUpdateExercise, adminDeleteExercise, adminGetLessons } from '../../api';

interface Lesson { id: number; title: string; unit_title: string; }
interface Exercise {
  id: number; lesson_id: number; lesson_title: string;
  type: string; question: string; options: string[] | null;
  correct_answer: string; explanation: string; order_num: number;
}

const TYPES = ['translation','choice','sentence','listening','speaking'];
const TYPE_LABELS: Record<string,string> = { translation:'Перевод', choice:'Выбор', sentence:'Предложение', listening:'Аудирование', speaking:'Произношение' };

const empty = { lesson_id: 1, type: 'choice', question: '', options: '["Вариант 1","Вариант 2","Вариант 3","Вариант 4"]', correct_answer: '', explanation: '', order_num: 1 };

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
      options: ex.options ? JSON.stringify(ex.options) : '',
      correct_answer: ex.correct_answer, explanation: ex.explanation || '', order_num: ex.order_num
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

  const needsOptions = form.type === 'choice' || form.type === 'translation';

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
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select></div>
                <div className="admin-field"><label>Порядок</label>
                  <input type="number" value={form.order_num} onChange={e => setForm({...form, order_num: +e.target.value})} /></div>
              </div>

              <div className="admin-field"><label>Вопрос / Задание</label>
                <textarea value={form.question} onChange={e => setForm({...form, question: e.target.value})} placeholder='Переведите: "Привет"' /></div>

              {needsOptions && (
                <div className="admin-field">
                  <label>Варианты ответа (JSON массив)</label>
                  <textarea value={form.options} onChange={e => setForm({...form, options: e.target.value})} rows={3} placeholder='["Вариант 1","Вариант 2","Вариант 3","Вариант 4"]' />
                  <div style={{ fontSize: '0.71rem', color: '#94a3b8', marginTop: 3 }}>Формат: ["Ответ1","Ответ2","Ответ3","Ответ4"]</div>
                </div>
              )}

              <div className="admin-field"><label>Правильный ответ</label>
                <input value={form.correct_answer} onChange={e => setForm({...form, correct_answer: e.target.value})} placeholder="Сәлем" /></div>

              <div className="admin-field"><label>Пояснение (необязательно)</label>
                <input value={form.explanation} onChange={e => setForm({...form, explanation: e.target.value})} placeholder="Сәлем — приветствие в казахском языке" /></div>

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
