import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { adminGetLevels, adminCreateLevel, adminUpdateLevel, adminDeleteLevel } from '../../api';

interface Level { id: number; code: string; name: string; description: string; order_num: number; }
const empty = { code: '', name: '', description: '', order_num: 1 };

export default function AdminLevels() {
  const [items, setItems] = useState<Level[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Level | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => adminGetLevels().then(r => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (l: Level) => { setEditing(l); setForm({ code: l.code, name: l.name, description: l.description || '', order_num: l.order_num }); setModal(true); };
  const close = () => setModal(false);

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await adminUpdateLevel(editing.id, form);
      else await adminCreateLevel(form);
      load(); close();
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Удалить уровень и весь его контент?')) return;
    await adminDeleteLevel(id); load();
  };

  return (
    <AdminLayout title="Уровни">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Уровни</div>
          <div className="admin-page-sub">A1, A2, B1... — города Казахстана</div>
        </div>
        <button className="btn-admin-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Добавить уровень
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>Код</th><th>Название</th><th>Описание</th><th>Порядок</th><th>Действия</th>
          </tr></thead>
          <tbody>
            {items.map(l => (
              <tr key={l.id}>
                <td><span className="admin-badge admin-badge-blue">{l.code}</span></td>
                <td style={{ fontWeight: 600 }}>{l.name}</td>
                <td style={{ color: 'var(--text-muted)', maxWidth: 200 }}>{l.description}</td>
                <td>{l.order_num}</td>
                <td><div className="actions">
                  <button className="btn-admin-edit" onClick={() => openEdit(l)}>Изменить</button>
                  <button className="btn-admin-danger" onClick={() => del(l.id)}>Удалить</button>
                </div></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="admin-empty">Уровней нет</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="admin-modal-backdrop" onClick={close}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-title">{editing ? 'Редактировать уровень' : 'Новый уровень'}</div>
            <div className="admin-form">
              <div className="admin-field"><label>Код (A1, A2, B1...)</label>
                <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="A1" /></div>
              <div className="admin-field"><label>Название (город)</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Алматы" /></div>
              <div className="admin-field"><label>Описание</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Начальный уровень..." /></div>
              <div className="admin-field"><label>Порядковый номер</label>
                <input type="number" value={form.order_num} onChange={e => setForm({...form, order_num: +e.target.value})} /></div>
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
