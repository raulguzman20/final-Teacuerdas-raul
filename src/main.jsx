import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './shared/contexts/store';
import { router } from './routes';
import { AuthProvider } from './features/auth/context/AuthContext';
import axios from 'axios';
import { API_CONFIG } from './shared/config/api.config';

// Configuración global de Axios: baseURL y encabezado Authorization con JWT
axios.defaults.baseURL = API_CONFIG.BASE_URL;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router}>
        <AuthProvider>
          {/* Aquí puedes agregar otros contextos si es necesario */}
        </AuthProvider>
      </RouterProvider>
    </Provider>
  </React.StrictMode>
);
