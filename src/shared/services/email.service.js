import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

// Cliente axios para envío de correos (timeout mayor por cold starts en Render)
const emailClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 60000,
});

// Adjuntar JWT si existe (por si el endpoint requiere autenticación)
emailClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const emailService = {
  // Enviar correo de bienvenida usando el endpoint del backend
  // Incluye campos opcionales usados por el template (apellido, username, password)
  sendWelcomeEmail: async ({ email, nombre, apellido, username, password }) => {
    try {
      await emailClient.post(API_CONFIG.ENDPOINTS.EMAIL_WELCOME, {
        email,
        nombre,
        apellido,
        username,
        password,
      });
      return { success: true };
    } catch (error) {
      // Log detallado y flag de timeout para diagnóstico
      const isTimeout = error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '');
      console.error('Error enviando correo de bienvenida:', error?.response?.data || error);
      return { success: false, timeout: !!isTimeout, error: error?.response?.data || error };
    }
  },
};

export default emailService;