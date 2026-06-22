import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: apiBase
});

// Used for non-/api paths served by the backend (currently just uploaded photos).
// Same-origin deployments (the VPS / docker-compose nginx proxy) use a relative
// '/api' base, so this resolves to '' and paths stay relative as before.
// Cross-origin deployments (Railway/Render, where frontend and backend are on
// different domains) set VITE_API_URL to a full URL, so this strips the
// trailing /api to get the backend's origin.
export const apiOrigin = apiBase.replace(/\/api\/?$/, '');

export const resolveAsset = (path) => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiOrigin}${path}`;
};

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('jrv_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jrv_token');
      localStorage.removeItem('jrv_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default client;
