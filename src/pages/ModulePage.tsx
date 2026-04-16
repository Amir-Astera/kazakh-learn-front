import { useEffect, useState, useCallback, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLevels, getModule, getUnitLessons } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import './ModulePage.css';

import pathGreenImg from '../assets/path-green.png';
import { API_ORIGIN } from '../config/apiBase';

interface Landmark {
  id: number;
  image_url: string;
  alt_text: string;
  position: Point | null;
}

interface Unit {
  id: number;
  title?: string;
  title_kz: string;
  subtitle: string;
  icon: string;
  lesson_count: number;
  status: string;
  completed_lessons: number;
  stars: number;
  order_num: number;
  path_image_url: string | null;
  path_points: Point[] | null;
  landmark_position: Point | null;
  landmarks: Landmark[];
}

interface Lesson {
  id: number;
  title: string;
  type: string;
  xp_reward: number;
  order_num: number;
  completed: boolean;
  score: number;
  mistakes: number;
}

interface ModuleData {
  id: number;
  title: string;
  title_kz: string;
  level_code: string;
  level_name: string;
  order_num: number;
  required_xp: number;
  units: Unit[];
}

interface LevelModule {
  id: number;
  title: string;
  title_kz: string;
  order_num: number;
  required_xp: number;
}

interface LevelData {
  id: number;
  code: string;
  name: string;
  order_num: number;
  modules: LevelModule[];
}

type Point = {
  x: number;
  y: number;
};

type RoadPoint = Point & {
  tangentX: number;
  tangentY: number;
};

type RoadGeometry = {
  points: Point[];
  samples: Point[];
  cumulativeLengths: number[];
  totalLength: number;
};

const DEFAULT_PATH_POINTS: Point[] = [
  { x: 0.04, y: 0.74 },
  { x: 0.09, y: 0.67 },
  { x: 0.17, y: 0.60 },
  { x: 0.28, y: 0.56 },
  { x: 0.39, y: 0.58 },
  { x: 0.44, y: 0.66 },
  { x: 0.38, y: 0.76 },
  { x: 0.28, y: 0.83 },
  { x: 0.17, y: 0.82 },
  { x: 0.13, y: 0.73 },
  { x: 0.21, y: 0.66 },
  { x: 0.33, y: 0.63 },
  { x: 0.47, y: 0.63 },
  { x: 0.60, y: 0.62 },
  { x: 0.73, y: 0.56 },
  { x: 0.86, y: 0.54 },
  { x: 0.95, y: 0.60 },
];

const LANDMARK_SIZE = 132;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function normalizePoint(point: Point): Point {
  return {
    x: clamp(Number(point?.x) || 0, 0, 1),
    y: clamp(Number(point?.y) || 0, 0, 1),
  };
}

function getEdgeAverageX(points: Point[]) {
  const edgeSize = Math.max(1, Math.min(5, Math.floor(points.length / 3) || 1));
  const start = points.slice(0, edgeSize);
  const end = points.slice(-edgeSize);
  const startAverage = start.reduce((sum, point) => sum + point.x, 0) / start.length;
  const endAverage = end.reduce((sum, point) => sum + point.x, 0) / end.length;
  return endAverage - startAverage;
}

function getPathPoints(pathPoints: Point[] | null | undefined) {
  if (!Array.isArray(pathPoints)) return DEFAULT_PATH_POINTS;

  const normalized = pathPoints
    .filter(point => Number.isFinite(point?.x) && Number.isFinite(point?.y))
    .map(normalizePoint);

  return normalized.length >= 2 ? normalized : DEFAULT_PATH_POINTS;
}

function isRoadFlowLeftToRight(road: RoadGeometry) {
  return getEdgeAverageX(road.points) >= 0;
}

function getCatmullRomPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: 0.5 * (
      2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    ),
    y: 0.5 * (
      2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    ),
  };
}

function sampleRoadCurve(points: Point[], samplesPerSegment = 28) {
  const samples: Point[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const limit = i === points.length - 2 ? samplesPerSegment : samplesPerSegment - 1;

    for (let step = 0; step <= limit; step++) {
      const t = step / samplesPerSegment;
      samples.push(getCatmullRomPoint(p0, p1, p2, p3, t));
    }
  }

  return samples;
}

function buildRoadGeometry(pathPoints: Point[] | null | undefined): RoadGeometry {
  const points = getPathPoints(pathPoints);
  const samples = sampleRoadCurve(points);
  const cumulativeLengths = samples.reduce<number[]>((acc, point, index) => {
    if (index === 0) {
      acc.push(0);
      return acc;
    }

    acc.push(acc[index - 1] + distance(samples[index - 1], point));
    return acc;
  }, []);

  return {
    points,
    samples,
    cumulativeLengths,
    totalLength: cumulativeLengths[cumulativeLengths.length - 1] || 1,
  };
}

function getRoadPointAt(road: RoadGeometry, progress: number): RoadPoint {
  const targetLength = clamp(progress, 0, 1) * road.totalLength;
  const segmentIndex = Math.max(
    1,
    road.cumulativeLengths.findIndex(length => length >= targetLength)
  );
  const endIndex = segmentIndex === -1 ? road.samples.length - 1 : segmentIndex;
  const startIndex = Math.max(0, endIndex - 1);
  const startPoint = road.samples[startIndex];
  const endPoint = road.samples[endIndex];
  const startLength = road.cumulativeLengths[startIndex];
  const endLength = road.cumulativeLengths[endIndex];
  const segmentLength = endLength - startLength || 1;
  const localT = clamp((targetLength - startLength) / segmentLength, 0, 1);
  const tangentStart = road.samples[Math.max(0, startIndex - 1)];
  const tangentEnd = road.samples[Math.min(road.samples.length - 1, endIndex + 1)];
  const tangentLength = Math.hypot(tangentEnd.x - tangentStart.x, tangentEnd.y - tangentStart.y) || 1;

  return {
    x: lerp(startPoint.x, endPoint.x, localT),
    y: lerp(startPoint.y, endPoint.y, localT),
    tangentX: (tangentEnd.x - tangentStart.x) / tangentLength,
    tangentY: (tangentEnd.y - tangentStart.y) / tangentLength,
  };
}

function getPointsOnRoad(road: RoadGeometry, count: number): RoadPoint[] {
  if (count <= 0) return [];

  const startProgress = count > 10 ? 0.02 : 0.03;
  const endProgress = count > 10 ? 0.98 : 0.97;
  const flowLeftToRight = isRoadFlowLeftToRight(road);
  const firstProgress = flowLeftToRight ? startProgress : endProgress;
  const lastProgress = flowLeftToRight ? endProgress : startProgress;

  if (count === 1) return [getRoadPointAt(road, firstProgress)];

  return Array.from({ length: count }, (_, index) => {
    const progress = lerp(firstProgress, lastProgress, index / (count - 1));
    return getRoadPointAt(road, progress);
  });
}

function getLessonNodeScale(count: number) {
  return clamp(1 - Math.max(0, count - 7) * 0.045, 0.72, 1);
}

function flattenModules(levels: LevelData[]) {
  return [...levels]
    .sort((a, b) => a.order_num - b.order_num)
    .flatMap(level =>
      [...level.modules]
        .sort((a, b) => a.order_num - b.order_num)
        .map(module => ({
          ...module,
          level_id: level.id,
          level_code: level.code,
          level_name: level.name,
          level_order: level.order_num,
        }))
    );
}

function getHighestUnlockedModule(levels: LevelData[], xp: number) {
  const modules = flattenModules(levels);
  return modules.filter(module => (module.required_xp || 0) <= xp).at(-1) || modules[0] || null;
}

const UNIT_GRADIENTS = [
  'linear-gradient(135deg, #f97316, #ef4444)',
  'linear-gradient(135deg, #6366f1, #3b82f6)',
  'linear-gradient(135deg, #10b981, #14b8a6)',
  'linear-gradient(135deg, #8b5cf6, #a855f7)',
  'linear-gradient(135deg, #f59e0b, #eab308)',
];

export default function ModulePage() {
  const { t, lang } = useLang();
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [levelsData, setLevelsData] = useState<LevelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [openUnitId, setOpenUnitId] = useState<number | null>(null);
  const [unitLessons, setUnitLessons] = useState<Record<number, Lesson[]>>({});
  const [lockedUnitMessage, setLockedUnitMessage] = useState('');

  useEffect(() => {
    const requestedId = moduleId ? parseInt(moduleId, 10) : null;
    if (moduleId && Number.isNaN(requestedId)) {
      navigate('/', { replace: true });
      return;
    }

    setLoading(true);
    setLockedUnitMessage('');
    getLevels()
      .then((levelsRes) => {
        const levels = levelsRes.data as LevelData[];
        setLevelsData(levels);
        const unlockedModule = getHighestUnlockedModule(levels, user?.xp || 0);
        const flatModules = flattenModules(levels);
        const requestedModule = requestedId ? flatModules.find(module => module.id === requestedId) || null : null;
        const targetModuleId = requestedModule && (requestedModule.required_xp || 0) <= (user?.xp || 0)
          ? requestedModule.id
          : unlockedModule?.id || requestedId || 1;

        if (!requestedId || targetModuleId !== requestedId) {
          navigate(`/module/${targetModuleId}`, { replace: true });
          return null;
        }

        return getModule(targetModuleId);
      })
      .then((moduleRes) => {
        if (!moduleRes) return;
        setModuleData(moduleRes.data);
        setUnitLessons({});
        const firstAccessibleUnit = moduleRes.data.units.find((unit: Unit) => unit.status !== 'locked') || null;
        setOpenUnitId(firstAccessibleUnit?.id || null);
      })
      .catch(err => console.error('Error loading module:', err))
      .finally(() => setLoading(false));
  }, [moduleId, navigate, user?.xp]);

  const levelProgress = useMemo(() => {
    const xp = user?.xp ?? 0;
    if (!moduleData || levelsData.length === 0) {
      return { showNextLevel: false, nextModuleId: null as number | null };
    }
    const moduleLevel = levelsData.find((level) => level.modules.some((m) => m.id === moduleData.id));
    const sortedLevels = [...levelsData].sort((a, b) => a.order_num - b.order_num);
    const nextLevel = moduleLevel ? sortedLevels.find((l) => l.order_num > moduleLevel.order_num) : null;
    const nextLevelRequirement = nextLevel && nextLevel.modules.length > 0
      ? Math.min(...nextLevel.modules.map((m) => m.required_xp || 0))
      : null;
    const showNextLevel = Boolean(
      moduleLevel &&
      nextLevel &&
      nextLevelRequirement != null &&
      xp >= nextLevelRequirement,
    );
    const sortedNextMods = nextLevel ? [...nextLevel.modules].sort((a, b) => a.order_num - b.order_num) : [];
    const nextModuleId = sortedNextMods[0]?.id ?? null;
    return { showNextLevel, nextModuleId };
  }, [moduleData, levelsData, user?.xp]);

  const loadLessons = useCallback((unitId: number) => {
    getUnitLessons(unitId)
      .then(res => setUnitLessons(prev => ({ ...prev, [unitId]: res.data })))
      .catch((err) => {
        if (err.response?.status === 403) {
          setLockedUnitMessage(t('module.lockedPrev'));
        }
      });
  }, [t]);

  useEffect(() => {
    if (openUnitId) loadLessons(openUnitId);
  }, [openUnitId, loadLessons]);

  if (loading || !moduleData) {
    return (
      <div className="app-layout">
        <main className="path-section">
          <LoadingSpinner messageKey="module.loading" />
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="path-section">
        {levelProgress.showNextLevel && levelProgress.nextModuleId != null && (
          <div className="module-next-level-banner">
            <p>{t('module.nextLevelBanner')}</p>
            <button type="button" className="module-next-level-btn" onClick={() => navigate(`/module/${levelProgress.nextModuleId}`)}>
              {t('module.nextLevelBtn')}
            </button>
          </div>
        )}
        {lockedUnitMessage && (
          <div className="module-locked-banner">
            {lockedUnitMessage}
          </div>
        )}
        <div className="units-container">
          {moduleData.units.map((unit, idx) => {
            const isOpen = openUnitId === unit.id;
            const lessons = [...(unitLessons[unit.id] || [])].sort((a, b) => a.order_num - b.order_num);
            const progress = unit.lesson_count > 0
              ? Math.min(100, Math.round((unit.completed_lessons / unit.lesson_count) * 100))
              : 0;
            const gradient = UNIT_GRADIENTS[idx % UNIT_GRADIENTS.length];
            const road = buildRoadGeometry(unit.path_points);
            const nodePositions = getPointsOnRoad(road, lessons.length);
            const landmarkPlacements = Array.isArray(unit.landmarks)
              ? unit.landmarks
                  .filter((landmark) => landmark.position && Number.isFinite(landmark.position.x) && Number.isFinite(landmark.position.y))
                  .map((landmark) => ({
                    id: landmark.id,
                    image_url: landmark.image_url,
                    alt_text: landmark.alt_text,
                    x: clamp(Number(landmark.position?.x) || 0, 0, 1),
                    y: clamp(Number(landmark.position?.y) || 0, 0, 1),
                    width: LANDMARK_SIZE,
                    height: LANDMARK_SIZE,
                  }))
              : [];
            const nodeScale = getLessonNodeScale(lessons.length);
            const pathImageSrc = unit.path_image_url ? `${API_ORIGIN}${unit.path_image_url}` : pathGreenImg;
            const titleLine = lang === 'en' && unit.title?.trim()
              ? unit.title.trim()
              : (unit.title_kz || unit.title || '').trim();
            const sub = unit.subtitle?.trim();
            const unitHeaderSub = sub ? `${titleLine} • ${sub}` : titleLine;
            const handleToggleUnit = () => {
              if (unit.status === 'locked') {
                setLockedUnitMessage(t('module.lockedUnit'));
                return;
              }
              setLockedUnitMessage('');
              setOpenUnitId(prev => prev === unit.id ? null : unit.id);
            };

            return (
              <div className={`unit-block ${unit.status === 'locked' ? 'locked-unit-block' : ''}`} key={unit.id}>
                <div className={`unit-header ${unit.status === 'locked' ? 'locked-unit' : ''}`} style={{ background: gradient }} onClick={handleToggleUnit} role="button" tabIndex={0} onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleToggleUnit();
                  }
                }}>
                  <div className="unit-header-left">
                    <div className="unit-header-icon">
                      <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="unit-header-info">
                      <div className="unit-header-title">{t('module.unitOrder').replace('{n}', String(unit.order_num))}</div>
                      <div className="unit-header-sub">{unitHeaderSub}</div>
                    </div>
                  </div>
                  <div className="unit-header-right">
                    <div className="unit-progress-bar">
                      <span className="unit-progress-label">{t('module.unitProgress').replace('{p}', String(progress))}</span>
                      <div className="unit-progress-track">
                        <div className="unit-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <div aria-hidden="true" style={{ color: 'rgba(255,255,255,0.92)', fontSize: '1.2rem', fontWeight: 800, marginLeft: 14 }}>
                      {isOpen ? '−' : '+'}
                    </div>
                  </div>
                </div>

                <div className={`unit-content ${isOpen ? 'open' : 'closed'}`}>
                  <div className="unit-path-map">
                    <img className="unit-path-bg" src={pathImageSrc} alt="" />

                    <div className="path-nodes-layer">
                      {landmarkPlacements.map((landmarkPlacement, landmarkIndex) => (
                        <div
                          key={`landmark-${unit.id}-${landmarkPlacement.id ?? landmarkIndex}`}
                          className="path-landmark-img"
                          style={{
                            left: `${(landmarkPlacement.x * 100).toFixed(1)}%`,
                            top: `${(landmarkPlacement.y * 100).toFixed(1)}%`,
                            width: landmarkPlacement.width,
                            height: landmarkPlacement.height,
                          }}
                        >
                          <img src={`${API_ORIGIN}${landmarkPlacement.image_url}`} alt={landmarkPlacement.alt_text || ''} />
                        </div>
                      ))}

                      {lessons.map((lesson, li) => {
                        const pos = nodePositions[li] || getRoadPointAt(road, 0.5);
                        const isFirst = li === 0;
                        const isCompleted = lesson.completed;
                        const isLocked = li > 0 && !lessons[li - 1].completed && !lesson.completed;
                        const isActive = !isCompleted && !isLocked;
                        const completedClass = isCompleted ? (lesson.mistakes === 0 ? 'completed' : 'completed-warning') : '';
                        const lessonNodeStyle: CSSProperties & Record<'--node-scale', string> = {
                          left: `${(pos.x * 100).toFixed(1)}%`,
                          top: `${(pos.y * 100).toFixed(1)}%`,
                          '--node-scale': `${nodeScale}`,
                        };

                        return (
                          <div
                            key={lesson.id}
                            className={`path-lesson-node ${isLocked ? 'locked' : ''}`}
                            style={lessonNodeStyle}
                            onClick={() => !isLocked && navigate(`/lesson/${lesson.id}`)}
                          >
                            <div className={`node-circle ${isCompleted ? completedClass : isActive && isFirst ? 'active' : isActive ? 'active' : 'locked-circle'}`}>
                              {isActive && isFirst && <div className="node-ring" />}
                              {isCompleted ? (
                                <svg viewBox="0 0 24 24" fill="white" stroke="none">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                              ) : isLocked ? (
                                <svg viewBox="0 0 24 24" fill="#94a3b8" stroke="none">
                                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="white" stroke="none">
                                  <path d="M21 6H3v2h18V6zm-9 4l-6 6h4v4h4v-4h4l-6-6z" />
                                </svg>
                              )}
                            </div>
                            <span className="node-label">{lesson.title.split('—')[0].trim()}</span>
                          </div>
                        );
                      })}

                      {lessons.length === 0 && isOpen && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(255,255,255,0.9)', padding: '16px 24px', borderRadius: 12, fontWeight: 600, color: '#475569', fontSize: '0.9rem', backdropFilter: 'blur(4px)' }}>
                          {t('module.loadingLessons')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
