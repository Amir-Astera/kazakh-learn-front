import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent as ReactMouseEvent } from 'react';
import {
  adminDeleteUnitPathImage,
  adminUpdateUnitLayout,
  adminUploadUnitPathImage,
} from '../../api';

const API_BASE = 'http://localhost:5000';

type Point = {
  x: number;
  y: number;
};

type LandmarkItem = {
  id: number;
  image_url: string;
  alt_text: string;
  position: Point | null;
};

type LayoutUnit = {
  id: number;
  title: string;
  title_kz: string;
  path_image_url: string | null;
  path_points: Point[] | null;
  landmark_position: Point | null;
  landmarks: LandmarkItem[];
};

type DragState =
  | { type: 'path'; index: number }
  | { type: 'landmark'; id: number }
  | null;

type Props = {
  unit: LayoutUnit | null;
  defaultImageSrc: string;
  onClose: () => void;
  onSaved: () => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizePoint(raw: Point) {
  return {
    x: clamp(Number(raw?.x) || 0, 0, 1),
    y: clamp(Number(raw?.y) || 0, 0, 1),
  };
}

function formatPoint(point: Point) {
  return `${(point.x * 100).toFixed(1)}%, ${(point.y * 100).toFixed(1)}%`;
}

export default function UnitPathLayoutEditor({ unit, defaultImageSrc, onClose, onSaved }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'path' | 'landmark'>('path');
  const [points, setPoints] = useState<Point[]>([]);
  const [landmarks, setLandmarks] = useState<LandmarkItem[]>([]);
  const [activeLandmarkId, setActiveLandmarkId] = useState<number | null>(null);
  const [previewSrc, setPreviewSrc] = useState(defaultImageSrc);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState<DragState>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveTone, setSaveTone] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    if (!unit) return;

    setMode('path');
    setPoints(Array.isArray(unit.path_points) ? unit.path_points.map(normalizePoint) : []);
    const normalizedLandmarks = Array.isArray(unit.landmarks)
      ? unit.landmarks.map((landmark) => ({
          ...landmark,
          position: landmark.position ? normalizePoint(landmark.position) : null,
        }))
      : [];
    setLandmarks(normalizedLandmarks);
    setActiveLandmarkId(normalizedLandmarks[0]?.id ?? null);
    setPreviewSrc(unit.path_image_url ? `${API_BASE}${unit.path_image_url}` : defaultImageSrc);
    setImageFile(null);
    setDragging(null);
    setSaveMessage('');
    setSaveTone('info');
  }, [unit, defaultImageSrc]);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      const point = getRelativePoint(event);
      if (!point) return;

      if (dragging.type === 'path') {
        setPoints(prev => prev.map((item, index) => index === dragging.index ? point : item));
        return;
      }

      setLandmarks(prev => prev.map((landmark) => landmark.id === dragging.id ? { ...landmark, position: point } : landmark));
    };

    const handleMouseUp = () => setDragging(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  if (!unit) return null;

  const getRelativePoint = (event: MouseEvent | ReactMouseEvent) => {
    const container = mapRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    return normalizePoint({
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    });
  };

  const handleMapClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (dragging) return;

    const point = getRelativePoint(event);
    if (!point) return;

    if (mode === 'landmark') {
      if (activeLandmarkId == null) return;
      setLandmarks(prev => prev.map((landmark) => landmark.id === activeLandmarkId ? { ...landmark, position: point } : landmark));
      return;
    }

    setPoints(prev => [...prev, point]);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setPreviewSrc(URL.createObjectURL(file));
    setSaveMessage('Новая карта выбрана. Нажмите «Сохранить разметку», чтобы применить изменения.');
    setSaveTone('info');
  };

  const handleRemovePathImage = async () => {
    if (!unit.path_image_url && !imageFile) return;
    if (!confirm('Удалить пользовательскую картинку пути и вернуться к дефолтной?')) return;

    if (unit.path_image_url) {
      await adminDeleteUnitPathImage(unit.id);
    }

    setImageFile(null);
    setPreviewSrc(defaultImageSrc);
    onSaved();
    setSaveMessage('Пользовательская картинка пути удалена. Сохранение разметки для точек не требуется.');
    setSaveTone('success');
  };

  const handleSave = async () => {
    if (points.length === 1) {
      setSaveMessage('Для дороги нужно минимум 2 точки. Либо добавьте ещё одну, либо удалите единственную точку и сохраните только landmark.');
      setSaveTone('error');
      return;
    }

    setSaving(true);
    setSaveMessage('');
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('path_image', imageFile);
        await adminUploadUnitPathImage(unit.id, formData);
      }

      await adminUpdateUnitLayout(unit.id, {
        path_points: points.length >= 2 ? points.map(normalizePoint) : null,
        landmark_position: null,
        landmarks: landmarks.map((landmark) => ({
          id: landmark.id,
          position: landmark.position ? normalizePoint(landmark.position) : null,
        })),
      });

      onSaved();
      setSaveMessage('Разметка сохранена. Точка №1 — это старт движения уроков, последняя точка — финиш.');
      setSaveTone('success');
    } catch (error: any) {
      setSaveMessage(error?.response?.data?.error || 'Не удалось сохранить разметку. Проверьте соединение и попробуйте снова.');
      setSaveTone('error');
    } finally {
      setSaving(false);
    }
  };

  const canSaveLayout = !saving && points.length !== 1;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal"
        style={{ maxWidth: 1180, padding: 24 }}
        onClick={event => event.stopPropagation()}
      >
        <div className="admin-modal-title" style={{ marginBottom: 14 }}>
          Разметка пути — <span style={{ color: 'var(--bg-sky)' }}>{unit.title_kz || unit.title}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(300px, 0.9fr)', gap: 20, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <button type="button" className={mode === 'path' ? 'btn-admin-primary' : 'btn-admin-edit'} onClick={() => setMode('path')}>
                Точки пути
              </button>
              <button type="button" className={mode === 'landmark' ? 'btn-admin-primary' : 'btn-admin-edit'} onClick={() => setMode('landmark')}>
                Точки landmarks
              </button>
              <button type="button" className="btn-admin-edit" onClick={() => setPoints(prev => prev.slice(0, -1))} disabled={points.length === 0}>
                Удалить последнюю
              </button>
              <button type="button" className="btn-admin-edit" onClick={() => setPoints(prev => [...prev].reverse())} disabled={points.length < 2}>
                Развернуть путь
              </button>
              <button type="button" className="btn-admin-danger" onClick={() => setPoints([])} disabled={points.length === 0}>
                Очистить путь
              </button>
              <button
                type="button"
                className="btn-admin-edit"
                onClick={() => activeLandmarkId != null && setLandmarks(prev => prev.map((landmark) => landmark.id === activeLandmarkId ? { ...landmark, position: null } : landmark))}
                disabled={activeLandmarkId == null || !landmarks.find((landmark) => landmark.id === activeLandmarkId)?.position}
              >
                Убрать точку landmark
              </button>
            </div>

            <div
              ref={mapRef}
              onClick={handleMapClick}
              style={{
                position: 'relative',
                width: '100%',
                borderRadius: 18,
                overflow: 'hidden',
                background: '#f8fafc',
                border: '1px solid #dbeafe',
                cursor: mode === 'path' ? 'crosshair' : 'cell',
                boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
              }}
            >
              <img src={previewSrc} alt="Path layout" style={{ display: 'block', width: '100%', height: 'auto' }} />

              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              >
                {points.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="rgba(239, 68, 68, 0.75)"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points.map(point => `${point.x * 100},${point.y * 100}`).join(' ')}
                  />
                )}
              </svg>

              {points.map((point, index) => (
                <button
                  key={`path-${index}`}
                  type="button"
                  onMouseDown={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    setDragging({ type: 'path', index });
                  }}
                  style={{
                    position: 'absolute',
                    left: `${point.x * 100}%`,
                    top: `${point.y * 100}%`,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: '2px solid white',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 800,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
                    zIndex: 3,
                    cursor: 'grab',
                  }}
                  title={`Точка ${index + 1}: ${formatPoint(point)}`}
                >
                  {index + 1}
                </button>
              ))}

              {landmarks.map((landmark, index) => landmark.position ? (
                <button
                  key={`landmark-point-${landmark.id}`}
                  type="button"
                  onMouseDown={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    setActiveLandmarkId(landmark.id);
                    setDragging({ type: 'landmark', id: landmark.id });
                  }}
                  style={{
                    position: 'absolute',
                    left: `${landmark.position.x * 100}%`,
                    top: `${landmark.position.y * 100}%`,
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: activeLandmarkId === landmark.id ? '3px solid #fef08a' : '2px solid white',
                    background: '#0ea5e9',
                    color: 'white',
                    fontSize: 16,
                    fontWeight: 800,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 6px 16px rgba(14, 165, 233, 0.35)',
                    zIndex: 4,
                    cursor: 'grab',
                  }}
                  title={`${landmark.alt_text}: ${formatPoint(landmark.position)}`}
                >
                  {index + 1}
                </button>
              ) : null)}
            </div>
          </div>

          <div className="admin-form" style={{ gap: 12 }}>
            <div className="admin-field">
              <label>Фоновая картинка пути</label>
              <div className="landmark-upload-area" onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} />
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--bg-night)' }}>
                    {imageFile ? imageFile.name : unit.path_image_url ? 'Пользовательская карта пути' : 'Используется дефолтная карта пути'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    Нажмите, чтобы загрузить фон для этого юнита
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn-admin-edit" onClick={() => fileRef.current?.click()}>
                  Выбрать файл
                </button>
                <button
                  type="button"
                  className="btn-admin-danger"
                  onClick={handleRemovePathImage}
                  disabled={!unit.path_image_url && !imageFile}
                >
                  Удалить картинку
                </button>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, background: '#f8fafc' }}>
              <div style={{ fontWeight: 800, color: 'var(--bg-night)', marginBottom: 8 }}>Что делать</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                1. Выберите режим «Точки пути» и проставьте точки по центру дороги по порядку движения.
                <br />
                2. Если нужно, перетяните точку мышкой.
                <br />
                3. Номер на точке — это не номер урока, а порядок маршрута: 1 = старт, последняя точка = финиш.
                <br />
                4. Если начали ставить точки не с той стороны, нажмите «Развернуть путь».
                <br />
                5. Выберите режим «Точки landmarks», затем выберите достопримечательность справа и поставьте её точку на карте.
                <br />
                6. На модуле уроки будут распределяться автоматически от первой точки до последней по длине пути.
              </div>
            </div>

            {saveMessage && (
              <div
                style={{
                  borderRadius: 14,
                  padding: '12px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  lineHeight: 1.5,
                  background: saveTone === 'success' ? 'rgba(16, 185, 129, 0.1)' : saveTone === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                  border: saveTone === 'success' ? '1px solid rgba(16, 185, 129, 0.25)' : saveTone === 'error' ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(59, 130, 246, 0.2)',
                  color: saveTone === 'success' ? '#047857' : saveTone === 'error' ? '#b91c1c' : '#1d4ed8',
                }}
              >
                {saveMessage}
              </div>
            )}

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 800, color: 'var(--bg-night)' }}>Точки пути</div>
                <span className="admin-badge admin-badge-red">{points.length}</span>
              </div>
              <div style={{ display: 'grid', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                {points.map((point, index) => (
                  <div
                    key={`point-row-${index}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#f8fafc', borderRadius: 10, padding: '8px 10px' }}
                  >
                    <div style={{ fontSize: '0.82rem', color: 'var(--bg-night)', fontWeight: 700 }}>
                      {index + 1}. {formatPoint(point)}
                    </div>
                    <button
                      type="button"
                      className="btn-admin-danger"
                      style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                      onClick={() => setPoints(prev => prev.filter((_, pointIndex) => pointIndex !== index))}
                    >
                      Удалить
                    </button>
                  </div>
                ))}
                {points.length === 0 && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Пока нет точек. Кликните по дороге на изображении.
                  </div>
                )}
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, background: '#f8fafc' }}>
              <div style={{ fontWeight: 800, color: 'var(--bg-night)', marginBottom: 10 }}>Landmarks</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {landmarks.map((landmark) => (
                  <button
                    key={landmark.id}
                    type="button"
                    className={activeLandmarkId === landmark.id ? 'btn-admin-primary' : 'btn-admin-edit'}
                    style={{ justifyContent: 'space-between' }}
                    onClick={() => {
                      setMode('landmark');
                      setActiveLandmarkId(landmark.id);
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{landmark.alt_text}</span>
                    <span style={{ fontSize: '0.72rem' }}>{landmark.position ? formatPoint(landmark.position) : 'без точки'}</span>
                  </button>
                ))}
                {landmarks.length === 0 && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Сначала добавьте достопримечательности в разделе «Разделы».
                  </div>
                )}
              </div>
            </div>

            <div className="admin-form-actions">
              <button type="button" className="btn-admin-cancel" onClick={onClose}>Отмена</button>
              <button type="button" className="btn-admin-primary" onClick={handleSave} disabled={!canSaveLayout}>
                {saving ? 'Сохранение...' : 'Сохранить разметку'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
