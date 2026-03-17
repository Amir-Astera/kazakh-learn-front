import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { adminGetModules, adminCreateModule, adminUpdateModule, adminDeleteModule, adminGetLevels } from '../../api';

interface Level { id: number; code: string; name: string; }
interface Module { id: number; level_id: number; level_code: string; title: string; title_kz: string; description: string; order_num: number; required_xp: number; }
const empty = { level_id: 1, title: '', title_kz: '', description: '', order_num: 1, required_xp: 0 };

export default function AdminModules() {
  const [items, setItems] = useState<Module[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    adminGetModules().then(r => setItems(r.data)).catch(() => {});
    adminGetLevels().then(r => setLevels(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...empty, level_id: levels[0]?.id || 1 }); setModal(true); };
  const openEdit = (m: Module) => {
    setEditing(m);
    setForm({ level_id: m.level_id, title: m.title, title_kz: m.title_kz || '', description: m.description || '', order_num: m.order_num, required_xp: m.required_xp });
    setModal(true);
  };
  const close = () => setModal(false);

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await adminUpdateModule(editing.id, form);
      else await adminCreateModule(form);
      load(); close();
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Удалить модуль и весь его контент?')) return;
    await adminDeleteModule(id); load();
  };

  return (
    <AdminLayout title="Модули">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Модули</div>
          <div className="admin-page-sub">Группы тем внутри уровня</div>
        </div>
        <button className="btn-admin-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Добавить модуль
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>Уровень</th><th>Название</th><th>Каз. название</th><th>Порядок</th><th>XP</th><th>Действия</th>
          </tr></thead>
          <tbody>
            {items.map(m => (
              <tr key={m.id}>
                <td><span className="admin-badge admin-badge-blue">{m.level_code}</span></td>
                <td style={{ fontWeight: 600 }}>{m.title}</td>
                <td style={{ color: 'var(--text-muted)' }}>{m.title_kz}</td>
                <td>{m.order_num}</td>
                <td>{m.required_xp}</td>
                <td><div className="actions">
                  <button className="btn-admin-edit" onClick={() => openEdit(m)}>Изменить</button>
                  <button className="btn-admin-danger" onClick={() => del(m.id)}>Удалить</button>
                </div></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="admin-empty">Модулей нет</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="admin-modal-backdrop" onClick={close}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-title">{editing ? 'Редактировать модуль' : 'Новый модуль'}</div>
            <div className="admin-form">
              <div className="admin-field"><label>Уровень</label>
                <select value={form.level_id} onChange={e => setForm({...form, level_id: +e.target.value})}>
                  {levels.map(l => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
                </select></div>
              <div className="admin-field"><label>Название (рус.)</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Первые шаги" /></div>
              <div className="admin-field"><label>Название (каз.)</label>
                <input value={form.title_kz} onChange={e => setForm({...form, title_kz: e.target.value})} placeholder="Алғашқы қадамдар" /></div>
              <div className="admin-field"><label>Описание</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="admin-field"><label>Порядок</label>
                  <input type="number" value={form.order_num} onChange={e => setForm({...form, order_num: +e.target.value})} /></div>
                <div className="admin-field"><label>Требуемый XP</label>
                  <input type="number" value={form.required_xp} onChange={e => setForm({...form, required_xp: +e.target.value})} /></div>
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
