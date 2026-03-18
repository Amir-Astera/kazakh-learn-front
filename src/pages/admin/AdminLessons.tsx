import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { adminGetLessons, adminCreateLesson, adminUpdateLesson, adminDeleteLesson, adminGetUnits } from '../../api';

interface Unit { id: number; title_kz: string; title: string; module_title: string; }
interface Lesson { id: number; unit_id: number; unit_title: string; title: string; type: string; xp_reward: number; order_num: number; }

const TYPES = ['translation','choice','grammar','sentence','listening','speaking'];
const TYPE_LABELS: Record<string,string> = { translation:'Перевод', choice:'Выбор', grammar:'Грамматика', sentence:'Предложение', listening:'Аудирование', speaking:'Произношение' };
const TYPE_COLORS: Record<string,string> = { translation:'admin-badge-blue', choice:'admin-badge-green', grammar:'admin-badge-purple', sentence:'admin-badge-orange', listening:'admin-badge-purple', speaking:'admin-badge-blue' };

const empty = { unit_id: 1, title: '', type: 'translation', xp_reward: 10, order_num: 1 };

export default function AdminLessons() {
  const [items, setItems]   = useState<Lesson[]>([]);
  const [units, setUnits]   = useState<Unit[]>([]);
  const [filterUnit, setFilterUnit] = useState<number | undefined>(undefined);
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [form, setForm]     = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);

  const load = (uid?: number) => {
    adminGetLessons(uid).then(r => setItems(r.data)).catch(() => {});
    adminGetUnits().then(r => setUnits(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const onFilter = (uid: number | undefined) => { setFilterUnit(uid); load(uid); };

  const openCreate = () => { setEditing(null); setForm({ ...empty, unit_id: units[0]?.id || 1 }); setModal(true); };
  const openEdit = (l: Lesson) => {
    setEditing(l);
    setForm({ unit_id: l.unit_id, title: l.title, type: l.type, xp_reward: l.xp_reward, order_num: l.order_num });
    setModal(true);
  };
  const close = () => setModal(false);

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await adminUpdateLesson(editing.id, form);
      else await adminCreateLesson(form);
      load(filterUnit); close();
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Удалить урок и все его задания?')) return;
    await adminDeleteLesson(id); load(filterUnit);
  };

  return (
    <AdminLayout title="Уроки">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Уроки</div>
          <div className="admin-page-sub">Микро-уроки внутри разделов</div>
        </div>
        <button className="btn-admin-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Добавить урок
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.85rem', color: 'var(--bg-night)' }}
          value={filterUnit ?? ''}
          onChange={e => onFilter(e.target.value ? +e.target.value : undefined)}
        >
          <option value="">Все разделы</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.module_title} → {u.title_kz || u.title}</option>)}
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>Раздел</th><th>Название урока</th><th>Тип</th><th>XP</th><th>Порядок</th><th>Действия</th>
          </tr></thead>
          <tbody>
            {items.map(l => (
              <tr key={l.id}>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{l.unit_title}</td>
                <td style={{ fontWeight: 600 }}>{l.title}</td>
                <td><span className={`admin-badge ${TYPE_COLORS[l.type]}`}>{TYPE_LABELS[l.type] || l.type}</span></td>
                <td>+{l.xp_reward}</td>
                <td>{l.order_num}</td>
                <td><div className="actions">
                  <button className="btn-admin-edit" onClick={() => openEdit(l)}>Изменить</button>
                  <button className="btn-admin-danger" onClick={() => del(l.id)}>Удалить</button>
                </div></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="admin-empty">Уроков нет</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="admin-modal-backdrop" onClick={close}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-title">{editing ? 'Редактировать урок' : 'Новый урок'}</div>
            <div className="admin-form">
              <div className="admin-field"><label>Раздел</label>
                <select value={form.unit_id} onChange={e => setForm({...form, unit_id: +e.target.value})}>
                  {units.map(u => <option key={u.id} value={u.id}>{u.module_title} → {u.title_kz || u.title}</option>)}
                </select></div>
              <div className="admin-field"><label>Название урока</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Сағат неше? — Который час?" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="admin-field"><label>Тип</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select></div>
                <div className="admin-field"><label>XP награда</label>
                  <input type="number" value={form.xp_reward} onChange={e => setForm({...form, xp_reward: +e.target.value})} /></div>
                <div className="admin-field"><label>Порядок</label>
                  <input type="number" value={form.order_num} onChange={e => setForm({...form, order_num: +e.target.value})} /></div>
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
