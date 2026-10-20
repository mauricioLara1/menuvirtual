import axios from 'axios';

// baseURL relativa: en desarrollo Vite la manda a la API (proxy).
// withCredentials: el navegador envía la cookie de sesión.
export const cliente = axios.defaults;
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});
