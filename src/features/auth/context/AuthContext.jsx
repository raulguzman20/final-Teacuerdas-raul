/*
  AuthContext.jsx
  - Provee un contexto de autenticación para toda la app.
  - Maneja: inicio/cierre de sesión, cambio de rol, persistencia en localStorage, navegación post login, y carga de permisos.
  - Almacena el usuario con shape: { id, name, email, documento, tipo_de_documento, role, currentRole, allRoles, permisos, permissions, token }.
  - Axios: El login no requiere Authorization. Luego de guardar el token, las peticiones usan interceptores globales para adjuntar Authorization Bearer automáticamente.
  - Permisos: Se obtienen desde /rol_permiso_privilegio y se mapean a claves de frontend. Existe un fallback por rol.
  - Rutas por defecto: según permisos/rol se redirige a Dashboard o a rutas específicas de módulos.
  Nota: Evitar mutar el estado directamente; usar setUser y sincronizar con localStorage sólo cuando sea necesario.
*/
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Recuperar el usuario de localStorage al cargar la aplicación
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const navigate = useNavigate();

  const login = async ({ email, password }) => {
    try {
      // 1) Autenticación: envía credenciales al backend
      const response = await axios.post('/login', { correo: email, contrasena: password });
      const data = response.data;
      
      if (data.success) {
        // 2) Persistencia: guarda usuario y token en estado y localStorage
        const rolNombre = (data?.usuario?.rol?.nombre || data?.usuario?.rolNombre || '').toLowerCase();
        const userData = {
          id: data.usuario.id,
          name: `${data.usuario.nombre} ${data.usuario.apellido}`,
          email: data.usuario.correo,
          documento: data.usuario.documento,
          tipo_de_documento: data.usuario.tipo_de_documento,
          role: rolNombre,
          currentRole: data.usuario.rol,
          allRoles: data.usuario.todosLosRoles || [data.usuario.rol],
          permissions: [],
          permisos: data.usuario.permisos,
          token: data.token,
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.token);
        
        // 3) Autorización: consulta permisos por rol y los mapea a claves de frontend
        const currentRol = data.usuario?.rol;
        const rolId = currentRol?._id || currentRol?.id;
        try {
          const rolPermisoResponse = await axios.get('/rol_permiso_privilegio', { params: { rolId } });
          const rolPermisoData = rolPermisoResponse.data;
          
          // Mapeo módulos->permisos del frontend
          const moduloToPermission = {
            'beneficiarios': 'venta-servicios-beneficiarios',
            'asistencia': 'venta-servicios-asistencia',
            'pagos': 'venta-servicios-pagos',
            'programacion_de_clases': 'servicios-musicales-programacion-clases',
            'profesores': 'servicios-musicales-profesores',
            'programacion_de_profesores': 'servicios-musicales-programacion-profesores',
            'cursos_matriculas': 'servicios-musicales-cursos-matriculas',
            'aulas': 'servicios-musicales-aulas',
            'clases': 'servicios-musicales-clases',
            'clientes': 'venta-servicios-clientes',
            'venta_matriculas': 'venta-servicios-venta-matriculas',
            'venta_cursos': 'venta-servicios-venta-cursos',
            'roles': 'configuracion-roles',
            'usuarios': 'configuracion-usuarios',
            'dashboard': 'dashboard'
          };
          const permissionsSet = new Set();
          if (rolPermisoData && Array.isArray(rolPermisoData)) {
            rolPermisoData.forEach(relacion => {
              const permisoNombre = relacion.permisoId?.nombre || relacion.permiso?.nombre;
              if (permisoNombre && moduloToPermission[permisoNombre]) {
                permissionsSet.add(moduloToPermission[permisoNombre]);
              }
            });
          }
          // Fallback de permisos si el backend no responde o está incompleto
          if (rolNombre === 'administrador') {
            permissionsSet.add('*');
            permissionsSet.add('dashboard');
          } else if (rolNombre === 'profesor') {
            permissionsSet.add('servicios-musicales-profesores');
            permissionsSet.add('servicios-musicales-programacion-profesores');
            permissionsSet.add('servicios-musicales-aulas');
            permissionsSet.add('servicios-musicales-clases');
            permissionsSet.add('venta-servicios-asistencia');
          } else if (rolNombre === 'beneficiario') {
            permissionsSet.add('servicios-musicales-programacion-clases');
          } else if (rolNombre === 'cliente') {
            permissionsSet.add('venta-servicios-pagos');
            permissionsSet.add('venta-servicios-beneficiarios');
          }
          const permissions = Array.from(permissionsSet);
          const updated = { ...userData, permissions };
          setUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
        } catch (error) {
          console.error('Error al obtener permisos desde API:', error);
          // Mantener permisos por fallback (definido arriba) para evitar bloquear navegación
        }
        
        // 4) Navegación: determina ruta por defecto según permisos/rol
        const getDefaultRoute = (permissions, role) => {
          if (role === 'cliente') return '/venta-servicios/beneficiarios';
          if (role === 'profesor') return '/servicios-musicales/programacion-profesores';
          if (role === 'beneficiario') return '/servicios-musicales/programacion-clases';
          if (permissions.includes('dashboard') || permissions.includes('*')) return '/dashboard';
          return '/servicios-musicales/programacion-clases';
        };
        const currentPermissions = JSON.parse(localStorage.getItem('user'))?.permissions || [];
        navigate(getDefaultRoute(currentPermissions, rolNombre));
      } else {
        // Credenciales inválidas o respuesta sin success
        alert(data.message || 'Credenciales incorrectas');
      }
    } catch (error) {
      // Errores de red o del servidor
      console.error('Error en login:', error);
      alert('Error de conexión. Verifique que el servidor esté funcionando.');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user'); // Eliminar el usuario de localStorage
    navigate('/'); // Redirigir al Home después del logout
  };

  const updateUser = (userData) => {
    try {
      // Mantener permisos/roles existentes si no se reciben nuevos
      const existingUser = JSON.parse(localStorage.getItem('user')) || user;
      const updatedData = {
        ...existingUser,
        ...userData,
        // No sobrescribir contraseña si el placeholder '****' está presente
        password: userData.password === '****' ? existingUser.password : userData.password,
        // Asegurar persistencia de permisos y rol
        permissions: userData.permissions || existingUser.permissions,
        role: userData.role || existingUser.role
      };

      // Actualiza estado y almacenamiento
      setUser(updatedData);
      localStorage.setItem('user', JSON.stringify(updatedData));
      alert('Datos guardados exitosamente');
      
      // Recalcula ruta por defecto post actualización
      const getDefaultRoute = (permissions, role) => {
        if (role === 'cliente') {
          return '/venta-servicios/beneficiarios';
        } else if (role === 'profesor') {
          return '/servicios-musicales/programacion-profesores';
        } else if (role === 'beneficiario') {
          return '/servicios-musicales/programacion-clases';
        } else if (permissions.includes('dashboard') || permissions.includes('*')) {
          return '/dashboard';
        } else {
          return '/servicios-musicales/programacion-clases';
        }
      };
      
      navigate(getDefaultRoute(updatedData.permissions, updatedData.role));
      return true;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw new Error('Error al actualizar los datos del usuario');
    }
  };

  const changeRole = async (newRoleId) => {
    try {
      // Envía solicitud para cambiar el rol actual del usuario
      const response = await axios.post('/login/cambiar-rol', {
        usuarioId: user.id,
        nuevoRolId: newRoleId,
      });
      const data = response.data;
      
      if (data.success) {
        // Reconsultar permisos por el nuevo rol
        const permissionsSet = new Set();
        try {
          const currentRol2 = data.usuario?.rol;
          const rolId2 = currentRol2?._id || currentRol2?.id;
          const rolPermisoResponse = await axios.get('/rol_permiso_privilegio', { params: { rolId: rolId2 } });
          const rolPermisoData = rolPermisoResponse.data;
          const moduloToPermission = {
            'beneficiarios': 'venta-servicios-beneficiarios',
            'asistencia': 'venta-servicios-asistencia',
            'pagos': 'venta-servicios-pagos',
            'programacion_de_clases': 'servicios-musicales-programacion-clases',
            'profesores': 'servicios-musicales-profesores',
            'programacion_de_profesores': 'servicios-musicales-programacion-profesores',
            'cursos_matriculas': 'servicios-musicales-cursos-matriculas',
            'aulas': 'servicios-musicales-aulas',
            'clases': 'servicios-musicales-clases',
            'clientes': 'venta-servicios-clientes',
            'venta_matriculas': 'venta-servicios-venta-matriculas',
            'venta_cursos': 'venta-servicios-venta-cursos',
            'roles': 'configuracion-roles',
            'usuarios': 'configuracion-usuarios',
            'dashboard': 'dashboard'
          };
          if (rolPermisoData && Array.isArray(rolPermisoData)) {
            rolPermisoData.forEach(relacion => {
              const permisoNombre = relacion.permisoId?.nombre || relacion.permiso?.nombre;
              if (permisoNombre && moduloToPermission[permisoNombre]) {
                permissionsSet.add(moduloToPermission[permisoNombre]);
              }
            });
          }
        } catch (error) {
          console.error('Error al obtener permisos desde API:', error);
        }
        
        // Fallback actualizado según el nuevo nombre de rol
        const rolNombre = (data?.usuario?.rol?.nombre || data?.usuario?.rolNombre || '').toLowerCase();
        if (rolNombre === 'administrador') {
          permissionsSet.add('*');
          permissionsSet.add('dashboard');
        } else if (rolNombre === 'profesor') {
          permissionsSet.add('servicios-musicales-profesores');
          permissionsSet.add('servicios-musicales-programacion-profesores');
          permissionsSet.add('servicios-musicales-aulas');
          permissionsSet.add('servicios-musicales-clases');
          permissionsSet.add('venta-servicios-asistencia');
        } else if (rolNombre === 'beneficiario') {
          permissionsSet.add('servicios-musicales-programacion-clases');
        } else if (rolNombre === 'cliente') {
          permissionsSet.add('venta-servicios-pagos');
          permissionsSet.add('venta-servicios-beneficiarios');
        }
        const permissions = Array.from(permissionsSet);
        const updated = { ...user, currentRole: data.usuario?.rol, role: rolNombre, permissions };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error al cambiar rol:', error);
    }
  };

  useEffect(() => {
    // Efecto de inicialización: sincroniza estado con localStorage una sola vez
    const storedUser = localStorage.getItem('user');
    if (storedUser && !user) {
      setUser(JSON.parse(storedUser));
    }
  }, []); // Evitar bucles: no incluir 'user' en dependencias

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, changeRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}