import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getModule, getUnitLessons } from '../api';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import './ModulePage.css';

import pathGreenImg from '../assets/path-green.png';

interface Unit {
  id: number;
  title: string;
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
  landmark_url: string | null;
  landmark_alt: string | null;
}

interface Lesson {
  id: number;
  title: string;
  type: string;
  xp_reward: number;
  order_num: number;
  completed: boolean;
  score: number;
}

interface ModuleData {
  id: number;
  title: string;
  title_kz: string;
  level_code: string;
  level_name: string;
  order_num: number;
  units: Unit[];
}

type Point = {
  x: number;
  y: number;
};

type RoadPoint = Point & {
  tangentX: number;
  tangentY: number;
};

type LandmarkPlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type RoadGeometry = {
  points: Point[];
  samples: Point[];
  cumulativeLengths: number[];
  totalLength: number;
};

const DEFAULT_PATH_POINTS: Point[] = [
  { x: 0.79, y: 0.90 },
  { x: 0.76, y: 0.87 },
  { x: 0.77, y: 0.81 },
  { x: 0.82, y: 0.76 },
  { x: 0.89, y: 0.71 },
  { x: 0.93, y: 0.64 },
  { x: 0.92, y: 0.56 },
  { x: 0.88, y: 0.50 },
  { x: 0.81, y: 0.46 },
  { x: 0.73, y: 0.43 },
  { x: 0.65, y: 0.44 },
  { x: 0.58, y: 0.48 },
  { x: 0.52, y: 0.53 },
  { x: 0.47, y: 0.56 },
  { x: 0.42, y: 0.55 },
  { x: 0.39, y: 0.51 },
  { x: 0.41, y: 0.46 },
  { x: 0.46, y: 0.42 },
  { x: 0.49, y: 0.37 },
  { x: 0.46, y: 0.32 },
  { x: 0.38, y: 0.30 },
  { x: 0.29, y: 0.30 },
  { x: 0.20, y: 0.34 },
  { x: 0.11, y: 0.41 },
  { x: 0.06, y: 0.51 },
  { x: 0.07, y: 0.62 },
  { x: 0.14, y: 0.70 },
  { x: 0.24, y: 0.75 },
  { x: 0.33, y: 0.77 },
];

const LANDMARK_ANCHOR_PROGRESS = [0.24, 0.54, 0.8];
const LANDMARK_FALLBACKS: Point[] = [
  { x: 0.88, y: 0.34 },
  { x: 0.62, y: 0.66 },
  { x: 0.15, y: 0.22 },
  { x: 0.18, y: 0.56 },
];

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

function getPathPoints(pathPoints: Point[] | null | undefined) {
  if (!Array.isArray(pathPoints)) return DEFAULT_PATH_POINTS;

  const normalized = pathPoints
    .filter(point => Number.isFinite(point?.x) && Number.isFinite(point?.y))
    .map(normalizePoint);

  return normalized.length >= 2 ? normalized : DEFAULT_PATH_POINTS;
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
  if (count === 1) return [getRoadPointAt(road, 0.02)];

  const startProgress = count > 10 ? 0.02 : 0.03;
  const endProgress = count > 10 ? 0.98 : 0.97;

  return Array.from({ length: count }, (_, index) => {
    const progress = lerp(startProgress, endProgress, index / (count - 1));
    return getRoadPointAt(road, progress);
  });
}

function getDistanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) return distance(point, start);

  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
  return distance(point, {
    x: start.x + dx * t,
    y: start.y + dy * t,
  });
}

function getDistanceToRoad(road: RoadGeometry, point: Point) {
  let minDistance = Number.POSITIVE_INFINITY;

  for (let i = 1; i < road.samples.length; i++) {
    minDistance = Math.min(minDistance, getDistanceToSegment(point, road.samples[i - 1], road.samples[i]));
  }

  return minDistance;
}

function getLandmarkPlacement(
  road: RoadGeometry,
  explicitPoint: Point | null,
  seed: number,
  lessonPoints: RoadPoint[]
): LandmarkPlacement | null {
  if (explicitPoint) {
    const point = normalizePoint(explicitPoint);
    const size = Math.round(88 + clamp((point.y - 0.2) / 0.7, 0, 1) * 24);
    return {
      x: point.x,
      y: point.y,
      width: size,
      height: size,
    };
  }

  const orderedAnchors = LANDMARK_ANCHOR_PROGRESS.map((_, index) => {
    const rotatedIndex = (index + seed) % LANDMARK_ANCHOR_PROGRESS.length;
    return LANDMARK_ANCHOR_PROGRESS[rotatedIndex];
  });

  for (const progress of orderedAnchors) {
    const anchor = getRoadPointAt(road, progress);
    const normalX = -anchor.tangentY;
    const normalY = anchor.tangentX;
    const sidePriority = seed % 2 === 0 ? [1, -1] : [-1, 1];
    const offsets = [0.10, 0.12, 0.14];

    for (const side of sidePriority) {
      for (const offset of offsets) {
        const candidate = {
          x: anchor.x + normalX * offset * side,
          y: anchor.y + normalY * offset * side,
        };

        if (candidate.x < 0.05 || candidate.x > 0.95 || candidate.y < 0.18 || candidate.y > 0.9) continue;
        if (getDistanceToRoad(road, candidate) < 0.07) continue;
        if (lessonPoints.some(point => distance(candidate, point) < 0.08)) continue;

        const size = Math.round(88 + clamp((candidate.y - 0.18) / 0.72, 0, 1) * 24);
        return {
          x: candidate.x,
          y: candidate.y,
          width: size,
          height: size,
        };
      }
    }
  }

  for (let i = 0; i < LANDMARK_FALLBACKS.length; i++) {
    const candidate = LANDMARK_FALLBACKS[(i + seed) % LANDMARK_FALLBACKS.length];
    if (getDistanceToRoad(road, candidate) >= 0.07 && lessonPoints.every(point => distance(candidate, point) >= 0.08)) {
      return {
        x: candidate.x,
        y: candidate.y,
        width: 96,
        height: 96,
      };
    }
  }

  return null;
}

function getLessonNodeScale(count: number) {
  return clamp(1 - Math.max(0, count - 7) * 0.045, 0.72, 1);
}

const API_BASE = 'http://localhost:5000';

const UNIT_GRADIENTS = [
  'linear-gradient(135deg, #f97316, #ef4444)',
  'linear-gradient(135deg, #6366f1, #3b82f6)',
  'linear-gradient(135deg, #10b981, #14b8a6)',
  'linear-gradient(135deg, #8b5cf6, #a855f7)',
  'linear-gradient(135deg, #f59e0b, #eab308)',
];

export default function ModulePage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openUnitId, setOpenUnitId] = useState<number | null>(null);
  const [unitLessons, setUnitLessons] = useState<Record<number, Lesson[]>>({});

  useEffect(() => {
    const id = moduleId ? parseInt(moduleId) : 1;
    setLoading(true);
    getModule(id)
      .then(res => {
        setModuleData(res.data);
        if (res.data.units.length > 0) {
          setOpenUnitId(res.data.units[0].id);
        }
      })
      .catch(err => console.error('Error loading module:', err))
      .finally(() => setLoading(false));
  }, [moduleId]);

  const loadLessons = useCallback((unitId: number) => {
    if (unitLessons[unitId]) return;
    getUnitLessons(unitId)
      .then(res => setUnitLessons(prev => ({ ...prev, [unitId]: res.data })))
      .catch(() => {});
  }, [unitLessons]);

  useEffect(() => {
    if (openUnitId) loadLessons(openUnitId);
  }, [openUnitId, loadLessons]);

  const toggleUnit = (unitId: number) => {
    setOpenUnitId(prev => prev === unitId ? null : unitId);
  };

  if (loading || !moduleData) {
    return (
      <div className="app-layout">
        <main className="path-section">
          <LoadingSpinner message="Загрузка модуля..." />
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="path-section">
        <div className="units-container">
          {moduleData.units.map((unit, idx) => {
            const isOpen = openUnitId === unit.id;
            const lessons = [...(unitLessons[unit.id] || [])].sort((a, b) => a.order_num - b.order_num);
            const progress = unit.lesson_count > 0
              ? Math.round((unit.completed_lessons / unit.lesson_count) * 100)
              : 0;
            const gradient = UNIT_GRADIENTS[idx % UNIT_GRADIENTS.length];
            const road = buildRoadGeometry(unit.path_points);
            const nodePositions = getPointsOnRoad(road, lessons.length);
            const landmarkPlacement = unit.landmark_url
              ? getLandmarkPlacement(road, unit.landmark_position, idx + lessons.length, nodePositions)
              : null;
            const nodeScale = getLessonNodeScale(lessons.length);
            const pathImageSrc = unit.path_image_url ? `${API_BASE}${unit.path_image_url}` : pathGreenImg;

            return (
              <div className="unit-block" key={unit.id}>
                <button
                  className="unit-header"
                  style={{ background: gradient }}
                  onClick={() => toggleUnit(unit.id)}
                >
                  <div className="unit-header-left">
                    <div className="unit-header-icon">
                      <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="unit-header-info">
                      <div className="unit-header-title">Unit {unit.order_num}</div>
                      <div className="unit-header-sub">{unit.title_kz} • {unit.subtitle}</div>
                    </div>
                  </div>
                  <div className="unit-header-right">
                    <div className="unit-progress-bar">
                      <span className="unit-progress-label">Прогресс: {progress}%</span>
                      <div className="unit-progress-track">
                        <div className="unit-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <svg className={`unit-chevron ${isOpen ? 'open' : ''}`} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                <div className={`unit-content ${isOpen ? 'open' : 'closed'}`}>
                  <div className="unit-path-map">
                    <img className="unit-path-bg" src={pathImageSrc} alt="" />

                    <div className="path-nodes-layer">
                      {unit.landmark_url && landmarkPlacement && (
                        <div
                          className="path-landmark-img"
                          style={{
                            left: `${(landmarkPlacement.x * 100).toFixed(1)}%`,
                            top: `${(landmarkPlacement.y * 100).toFixed(1)}%`,
                            width: landmarkPlacement.width,
                            height: landmarkPlacement.height,
                          }}
                        >
                          <img src={`${API_BASE}${unit.landmark_url}`} alt={unit.landmark_alt || ''} />
                        </div>
                      )}

                      {lessons.map((lesson, li) => {
                        const pos = nodePositions[li] || getRoadPointAt(road, 0.5);
                        const isFirst = li === 0;
                        const isCompleted = lesson.completed;
                        const isLocked = li > 0 && !lessons[li - 1].completed && !lesson.completed;
                        const isActive = !isCompleted && !isLocked;

                        return (
                          <div
                            key={lesson.id}
                            className={`path-lesson-node ${isLocked ? 'locked' : ''}`}
                            style={{
                              left: `${(pos.x * 100).toFixed(1)}%`,
                              top: `${(pos.y * 100).toFixed(1)}%`,
                              ['--node-scale' as '--node-scale']: `${nodeScale}`,
                            }}
                            onClick={() => !isLocked && navigate(`/lesson/${lesson.id}`)}
                          >
                            <div className={`node-circle ${isCompleted ? 'completed' : isActive && isFirst ? 'active' : isActive ? 'active' : 'locked-circle'}`}>
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
                          Загрузка уроков...
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
