import { useEffect, useRef, useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  adminGetUnits, adminCreateUnit, adminUpdateUnit, adminDeleteUnit,
  adminGetModules, adminUploadLandmark, adminDeleteLandmark
} from '../../api';
import UnitPathLayoutEditor from '../../components/admin/UnitPathLayoutEditor';
import pathGreenImg from '../../assets/path-green.png';

interface Module { id: number; title: string; level_code: string; }
interface Point { x: number; y: number; }
interface Unit {
  id: number; module_id: number; module_title: string;
  title: string; title_kz: string; subtitle: string;
  icon: string; order_num: number; lesson_count: number;
  path_image_url: string | null;
  path_points: Point[] | null;
  landmark_position: Point | null;
  image_url: string | null; alt_text: string | null;
}

const ICONS = ['book','alphabet','wave','numbers','family','food','directions','chat','people','clock','description','sentence','shop','transport','health'];
const emptyForm = { module_id: 1, title: '', title_kz: '', subtitle: '', icon: 'book', order_num: 1 };

const API_BASE = 'http://localhost:5000';

export default function AdminUnits() {
  const [items, setItems]     = useState<Unit[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [form, setForm]       = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving]   = useState(false);
  const [layoutUnit, setLayoutUnit] = useState<Unit | null>(null);

  const [lmModal, setLmModal]   = useState(false);
  const [lmUnit, setLmUnit]     = useState<Unit | null>(null);
  const [lmFile, setLmFile]     = useState<File | null>(null);
  const [lmAlt, setLmAlt]       = useState('');
  const [lmPreview, setLmPreview] = useState<string | null>(null);
  const [lmSaving, setLmSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    adminGetUnits().then(r => setItems(r.data)).catch(() => {});
    adminGetModules().then(r => setModules(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, module_id: modules[0]?.id || 1 }); setModal(true); };
  const openEdit = (u: Unit) => {
    setEditing(u);
    setForm({ module_id: u.module_id, title: u.title, title_kz: u.title_kz || '', subtitle: u.subtitle || '', icon: u.icon || 'book', order_num: u.order_num });
    setModal(true);
  };
  const openLayout = (u: Unit) => setLayoutUnit(u);
  const closeMain = () => setModal(false);
  const closeLayout = () => setLayoutUnit(null);

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await adminUpdateUnit(editing.id, form);
      else await adminCreateUnit(form);
      load(); closeMain();
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Удалить раздел и весь его контент?')) return;
    await adminDeleteUnit(id); load();
  };

  const openLandmark = (u: Unit) => {
    setLmUnit(u);
    setLmFile(null);
    setLmAlt(u.alt_text || '');
    setLmPreview(u.image_url ? `${API_BASE}${u.image_url}` : null);
    setLmModal(true);
  };
  const closeLm = () => setLmModal(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLmFile(f);
    setLmPreview(URL.createObjectURL(f));
  };

  const saveLandmark = async () => {
    if (!lmUnit) return;
    if (!lmFile && !lmUnit.image_url) { alert('Выберите изображение'); return; }
    if (!lmAlt.trim()) { alert('Введите описание достопримечательности'); return; }
    setLmSaving(true);
    try {
      if (lmFile) {
        const fd = new FormData();
        fd.append('image', lmFile);
        fd.append('alt_text', lmAlt);
        await adminUploadLandmark(lmUnit.id, fd);
      } else if (lmAlt !== lmUnit.alt_text) {
        const fd = new FormData();
        fd.append('alt_text', lmAlt);
        await adminUploadLandmark(lmUnit.id, fd);
      }
      load(); closeLm();
    } finally { setLmSaving(false); }
  };

  const removeLandmark = async (u: Unit) => {
    if (!confirm('Удалить достопримечательность?')) return;
    await adminDeleteLandmark(u.id); load();
  };

  return (
    <AdminLayout title="Разделы (юниты)">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Разделы</div>
          <div className="admin-page-sub">Каждый раздел — тема внутри модуля, отображается как узел на пути</div>
        </div>
        <button className="btn-admin-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Добавить раздел
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>Модуль</th><th>Каз. название</th><th>Подзаголовок</th>
            <th>Уроков</th><th>Путь</th><th>Достопримечательность</th><th>Порядок</th><th>Действия</th>
          </tr></thead>
          <tbody>
            {items.map(u => (
              <tr key={u.id}>
                <td><span className="admin-badge admin-badge-green">{u.module_title}</span></td>
                <td style={{ fontWeight: 600 }}>{u.title_kz || u.title}</td>
                <td style={{ color: 'var(--text-muted)', maxWidth: 160, fontSize: '0.8rem' }}>{u.subtitle}</td>
                <td><span className="admin-badge admin-badge-blue">{u.lesson_count}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className={`admin-badge ${u.path_points?.length ? 'admin-badge-green' : 'admin-badge-red'}`}>
                      {u.path_points?.length ? `${u.path_points.length} точек` : 'Нет пути'}
                    </span>
                    {u.landmark_position && <span className="admin-badge admin-badge-blue">landmark</span>}
                    {u.path_image_url && <span className="admin-badge admin-badge-purple">своя карта</span>}
                  </div>
                </td>
                <td>
                  {u.image_url ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={`${API_BASE}${u.image_url}`} alt={u.alt_text || ''} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6 }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.alt_text}</span>
                      <button className="btn-admin-edit" onClick={() => openLandmark(u)}>Изм.</button>
                      <button className="btn-admin-danger" onClick={() => removeLandmark(u)}>✕</button>
                    </div>
                  ) : (
                    <button className="btn-admin-primary" style={{ fontSize: '0.75rem', padding: '5px 10px' }} onClick={() => openLandmark(u)}>
                      + Добавить
                    </button>
                  )}
                </td>
                <td>{u.order_num}</td>
                <td><div className="actions">
                  <button className="btn-admin-edit" onClick={() => openLayout(u)}>Разметка</button>
                  <button className="btn-admin-edit" onClick={() => openEdit(u)}>Изменить</button>
                  <button className="btn-admin-danger" onClick={() => del(u.id)}>Удалить</button>
                </div></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={8} className="admin-empty">Разделов нет</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Unit create/edit modal */}
      {modal && (
        <div className="admin-modal-backdrop" onClick={closeMain}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-title">{editing ? 'Редактировать раздел' : 'Новый раздел'}</div>
            <div className="admin-form">
              <div className="admin-field"><label>Модуль</label>
                <select value={form.module_id} onChange={e => setForm({...form, module_id: +e.target.value})}>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.level_code} — {m.title}</option>)}
                </select></div>
              <div className="admin-field"><label>Название (рус.)</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Алфавит" /></div>
              <div className="admin-field"><label>Название (каз.)</label>
                <input value={form.title_kz} onChange={e => setForm({...form, title_kz: e.target.value})} placeholder="Әліпби" /></div>
              <div className="admin-field"><label>Подзаголовок</label>
                <input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} placeholder="Буквы и звуки" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="admin-field"><label>Иконка</label>
                  <select value={form.icon} onChange={e => setForm({...form, icon: e.target.value})}>
                    {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select></div>
                <div className="admin-field"><label>Порядок</label>
                  <input type="number" value={form.order_num} onChange={e => setForm({...form, order_num: +e.target.value})} /></div>
              </div>
              <div className="admin-form-actions">
                <button className="btn-admin-cancel" onClick={closeMain}>Отмена</button>
                <button className="btn-admin-primary" onClick={save} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Landmark modal */}
      {lmModal && lmUnit && (
        <div className="admin-modal-backdrop" onClick={closeLm}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-title">
              Достопримечательность — <span style={{ color: 'var(--bg-sky)' }}>{lmUnit.title_kz || lmUnit.title}</span>
            </div>
            <div className="admin-form">
              <div className="admin-field">
                <label>Изображение достопримечательности</label>
                <div className="landmark-upload-area" onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} />
                  {lmPreview ? (
                    <div className="landmark-preview">
                      <img src={lmPreview} alt="" />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bg-night)' }}>
                          {lmFile ? lmFile.name : 'Текущее изображение'}
                        </div>
                        <div className="landmark-preview-name">Нажмите чтобы заменить</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '20px 0' }}>
                      <div style={{ fontSize: '2rem' }}>🏛️</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6 }}>
                        Нажмите чтобы загрузить изображение
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>PNG, JPG до 10МБ</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="admin-field">
                <label>Название / Описание (текст подсказки)</label>
                <input
                  value={lmAlt}
                  onChange={e => setLmAlt(e.target.value)}
                  placeholder="Колесо обозрения Көк-Төбе, Алматы"
                />
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                  Отображается при наведении на картинку на карте обучения
                </div>
              </div>
              <div className="admin-form-actions">
                <button className="btn-admin-cancel" onClick={closeLm}>Отмена</button>
                <button className="btn-admin-primary" onClick={saveLandmark} disabled={lmSaving}>
                  {lmSaving ? 'Загрузка...' : '💾 Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {layoutUnit && (
        <UnitPathLayoutEditor
          unit={layoutUnit}
          defaultImageSrc={pathGreenImg}
          onClose={closeLayout}
          onSaved={load}
        />
      )}
    </AdminLayout>
  );
}
