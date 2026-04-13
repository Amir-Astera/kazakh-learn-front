import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  language_pair: 'ru-kz' | 'en-kz';
  learning_goal: 'general' | 'travel' | 'study' | 'work';
  proficiency_level: 'beginner' | 'elementary' | 'intermediate';
}

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (payload: RegisterPayload) =>
  api.post('/auth/register', payload);

export const getMe = () => api.get('/auth/me');

export interface UpdateProfilePayload {
  name: string;
  avatar_url: string | null;
  language_pair: 'ru-kz' | 'en-kz';
  learning_goal: 'general' | 'travel' | 'study' | 'work';
  proficiency_level: 'beginner' | 'elementary' | 'intermediate';
}

export const updateProfile = (payload: UpdateProfilePayload) =>
  api.put('/auth/profile', payload);

// Modules
export const getLevels = () => api.get('/modules/levels');

export const getModule = (moduleId: number) =>
  api.get(`/modules/${moduleId}`);

export const getNextModule = (moduleId: number) =>
  api.get(`/modules/${moduleId}/next`);

// Lessons
export const getUnitLessons = (unitId: number) =>
  api.get(`/lessons/unit/${unitId}`);

export const getLesson = (lessonId: number) =>
  api.get(`/lessons/${lessonId}`);

export const submitAnswer = (lessonId: number, exerciseId: number, answer: string) =>
  api.post(`/lessons/${lessonId}/answer`, { exerciseId, answer });

export const completeLesson = (lessonId: number, data: { score: number; mistakes: number; timeSpent: number }) =>
  api.post(`/lessons/${lessonId}/complete`, data);

// Progress
export const getDashboard = () => api.get('/progress/dashboard');

export const getStats = () => api.get('/progress/stats');

export const getProverb = () => api.get('/progress/proverb');

// Admin
export const adminGetStats = () => api.get('/admin/stats');

export const adminGetLevels = () => api.get('/admin/levels');
export const adminCreateLevel = (data: object) => api.post('/admin/levels', data);
export const adminUpdateLevel = (id: number, data: object) => api.put(`/admin/levels/${id}`, data);
export const adminDeleteLevel = (id: number) => api.delete(`/admin/levels/${id}`);

export const adminGetModules = () => api.get('/admin/modules');
export const adminCreateModule = (data: object) => api.post('/admin/modules', data);
export const adminUpdateModule = (id: number, data: object) => api.put(`/admin/modules/${id}`, data);
export const adminDeleteModule = (id: number) => api.delete(`/admin/modules/${id}`);

export const adminGetUnits = () => api.get('/admin/units');
export const adminCreateUnit = (data: object) => api.post('/admin/units', data);
export const adminUpdateUnit = (id: number, data: object) => api.put(`/admin/units/${id}`, data);
export const adminUpdateUnitLayout = (id: number, data: object) => api.put(`/admin/units/${id}/layout`, data);
export const adminDeleteUnit = (id: number) => api.delete(`/admin/units/${id}`);
export const adminUploadUnitPathImage = (unitId: number, formData: FormData) =>
  api.post(`/admin/units/${unitId}/path-image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminDeleteUnitPathImage = (unitId: number) => api.delete(`/admin/units/${unitId}/path-image`);
export const adminCreateLandmark = (unitId: number, formData: FormData) =>
  api.post(`/admin/units/${unitId}/landmarks`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminUpdateLandmark = (unitId: number, landmarkId: number, formData: FormData) =>
  api.put(`/admin/units/${unitId}/landmarks/${landmarkId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminDeleteLandmark = (unitId: number, landmarkId: number) => api.delete(`/admin/units/${unitId}/landmarks/${landmarkId}`);

export const adminGetLessons = (unitId?: number) =>
  api.get('/admin/lessons', { params: unitId ? { unit_id: unitId } : {} });
export const adminCreateLesson = (data: object) => api.post('/admin/lessons', data);
export const adminUpdateLesson = (id: number, data: object) => api.put(`/admin/lessons/${id}`, data);
export const adminDeleteLesson = (id: number) => api.delete(`/admin/lessons/${id}`);

export const adminGetExercises = (lessonId?: number) =>
  api.get('/admin/exercises', { params: lessonId ? { lesson_id: lessonId } : {} });
export const adminCreateExercise = (data: object) => api.post('/admin/exercises', data);
export const adminUpdateExercise = (id: number, data: object) => api.put(`/admin/exercises/${id}`, data);
export const adminDeleteExercise = (id: number) => api.delete(`/admin/exercises/${id}`);

// Chat
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const sendChatMessage = (messages: ChatMessage[]) =>
  api.post('/chat', { messages });

export default api;
