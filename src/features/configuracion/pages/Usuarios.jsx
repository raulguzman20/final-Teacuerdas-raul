'use client'

import { useState, useEffect, useMemo } from "react"
import { GenericList } from "../../../shared/components/GenericList"
import { DetailModal } from "../../../shared/components/DetailModal"
import { FormModal } from "../../../shared/components/FormModal"
import { StatusButton } from "../../../shared/components/StatusButton"
import { UserRoleAssignment } from "../../../shared/components/UserRoleAssignment"
import { ConfirmationDialog } from '../../../shared/components/ConfirmationDialog'
import axios from 'axios'
import { Button, Box, Typography, Chip, Alert, Snackbar } from "@mui/material"
import { PersonAdd as PersonAddIcon } from "@mui/icons-material"
import { usuariosService, rolesService, usuariosHasRolService } from "../../../shared/services/api"

const Usuarios = () => {
  const [roles, setRoles] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [selectedUsuario, setSelectedUsuario] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [roleAssignmentOpen, setRoleAssignmentOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  })
  const [confirmationDialog, setConfirmationDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  })
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success'
  })

  const fetchData = async () => {
    try {
      const [usuariosResp, rolesResp, usuariosHasRolResp] = await Promise.all([
        usuariosService.getAll(),
        rolesService.getAll(),
        usuariosHasRolService.getAll()
      ]);

      // Normalizar respuestas Axios (usar response.data) y soportar objetos tipo { roles }, { usuarios }
      const usuariosRaw = usuariosResp?.data ?? usuariosResp;
      const rolesRaw = rolesResp?.data ?? rolesResp;
      const usuariosHasRolRaw = usuariosHasRolResp?.data ?? usuariosHasRolResp;

      const usuariosData = Array.isArray(usuariosRaw)
        ? usuariosRaw
        : (Array.isArray(usuariosRaw?.usuarios) ? usuariosRaw.usuarios : []);

      const rolesData = Array.isArray(rolesRaw)
        ? rolesRaw
        : (Array.isArray(rolesRaw?.roles) ? rolesRaw.roles : []);

      const usuariosHasRolData = Array.isArray(usuariosHasRolRaw)
        ? usuariosHasRolRaw
        : (Array.isArray(usuariosHasRolRaw?.asignaciones) ? usuariosHasRolRaw.asignaciones : []);

      // Asignar roles a cada usuario a partir de usuarios_has_rol
      const usuariosConRoles = usuariosData.map(usuario => {
        const asignacionesUsuario = usuariosHasRolData.filter(asignacion => {
          if (!asignacion.usuarioId) return false;
          const usuarioIdEnAsignacion = typeof asignacion.usuarioId === 'string'
            ? asignacion.usuarioId
            : asignacion.usuarioId._id || asignacion.usuarioId.id;
          return usuarioIdEnAsignacion === usuario._id;
        });

        const rolesUsuario = asignacionesUsuario
          .filter(asignacion => asignacion.estado !== false && asignacion.rolId)
          .flatMap(asignacion => Array.isArray(asignacion.rolId) ? asignacion.rolId : [asignacion.rolId])
          .filter(Boolean);

        return { ...usuario, roles: rolesUsuario };
      });

      console.log('Usuarios procesados con roles activos:', usuariosConRoles);

      setUsuarios(usuariosConRoles);
      setRoles(rolesData);
      return usuariosConRoles;
    } catch (error) {
      console.error('Error al cargar datos:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setIsEditing(false);
    setSelectedUsuario(null);
    setPasswordError('');
    setConfirmPassword('');
    setPasswordRequirements({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false
    });
    setFormModalOpen(true);
  }

  const handleEdit = async (usuario) => {
    try {
      // Obtener las asignaciones actuales del usuario
      const allAssignmentsResp = await usuariosHasRolService.getAll();
      const allAssignments = Array.isArray(allAssignmentsResp?.data) ? allAssignmentsResp.data : allAssignmentsResp;
      const userAssignments = allAssignments.filter(assignment =>
        assignment.usuarioId && (typeof assignment.usuarioId === 'string'
          ? assignment.usuarioId === usuario._id
          : assignment.usuarioId._id === usuario._id)
      );

      // Aplanar y obtener los roles completos para cada asignación
      const rolesAsignados = userAssignments
        .flatMap(assignment => {
          const r = assignment.rolId;
          if (!r) return [];
          if (Array.isArray(r)) return r; // ya vienen poblados desde el backend
          if (typeof r === 'object') return [r];
          const encontrado = roles.find(rol => rol._id === r);
          return encontrado ? [encontrado] : [];
        })
        .filter(Boolean); // Eliminar posibles valores null/undefined

      const usuarioConRoles = {
        ...usuario,
        roles: rolesAsignados,
        rolId: rolesAsignados.length > 0 ? rolesAsignados[0]._id : ''
      };

      // Editar información del usuario directamente
      setIsEditing(true);
      setSelectedUsuario(usuarioConRoles);
      setFormModalOpen(true);
    } catch (error) {
      console.error('Error al cargar los roles del usuario:', error);
      alert('Error al cargar los roles del usuario');
    }
  }

  const handleDelete = async (usuario) => {
    setConfirmationDialog({
      open: true,
      title: 'Confirmar Eliminación',
      message: `¿Está seguro que desea eliminar al usuario ${usuario.nombre} ${usuario.apellido}?`,
      onConfirm: async () => {
        try {
          await usuariosService.delete(usuario._id);
          // Refrescar la lista completa desde el servidor
          await fetchData();
          setAlert({
            open: true,
            message: 'Usuario eliminado correctamente',
            severity: 'success'
          });
        } catch (error) {
          console.error('Error al eliminar usuario:', error);
          setAlert({
            open: true,
            message: 'Error al eliminar usuario',
            severity: 'error'
          });
        }
        setConfirmationDialog({ open: false, title: '', message: '', onConfirm: null });
      }
    });
  }

  const handleView = (usuario) => {
    console.log('Usuario seleccionado para ver detalles:', usuario);
    // Asegurarse de que el usuario tenga la propiedad roles
    let usuarioConRoles = usuario;

    if (!usuario.roles || !Array.isArray(usuario.roles)) {
      // Buscar el usuario en el estado actual para obtener sus roles
      const usuarioCompleto = usuarios.find(u => u._id === usuario._id);
      if (usuarioCompleto && Array.isArray(usuarioCompleto.roles)) {
        usuarioConRoles = usuarioCompleto;
      } else {
        usuarioConRoles = { ...usuario, roles: [] };
      }
    }

    console.log('Usuario con roles:', usuarioConRoles);
    setSelectedUsuario(usuarioConRoles);
    setDetailModalOpen(true);
  }

  const handlePasswordChange = (value, formData, setFieldValue) => {
    setFieldValue("contrasena", value);

    // Use setTimeout to avoid blocking input
    setTimeout(() => {
      validatePassword(value, formData?.confirmacionContrasena);

      // Sincronizar confirmación en estado si existe
      if (formData?.confirmacionContrasena) {
        setConfirmPassword(formData.confirmacionContrasena);
      }
    }, 0);
  };

  const handleConfirmPasswordChange = (value, formData, setFieldValue) => {
    setFieldValue("confirmacionContrasena", value);

    // Use setTimeout to avoid blocking input
    setTimeout(() => {
      setConfirmPassword(value);
      if (formData?.contrasena) {
        validatePassword(formData.contrasena, value);
      }
    }, 0);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setSelectedUsuario(null)
  }

  // Validación en tiempo real de la contraseña
  const validatePassword = (password, confirmation) => {
    const requirements = {
      length: password?.length >= 8,
      uppercase: /[A-Z]/.test(password || ''),
      lowercase: /[a-z]/.test(password || ''),
      number: /[0-9]/.test(password || '')
    };

    // Mantenemos el estado para otros usos, pero no lo usamos en formFields
    setPasswordRequirements(requirements);

    if (!password) {
      setPasswordError('La contraseña es requerida');
      return false;
    }

    if (!requirements.length) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    if (!requirements.uppercase || !requirements.lowercase || !requirements.number) {
      setPasswordError('La contraseña debe contener al menos una letra mayúscula, una minúscula y un número');
      return false;
    }

    const confirmToUse = typeof confirmation !== 'undefined' ? confirmation : confirmPassword;
    if (confirmToUse && password !== confirmToUse) {
      setPasswordError('Las contraseñas no coinciden');
      return false;
    }

    setPasswordError('');
    return true;
  };

  const handleCloseForm = (action) => {
    if (action === 'assignRoles' && selectedUsuario) {
      // Si se cerró el formulario con la acción de asignar roles, abrir el diálogo de asignación
      setRoleAssignmentOpen(true);
    } else {
      setFormModalOpen(false);
      setSelectedUsuario(null);
      setIsEditing(false);
      setPasswordError('');
      setConfirmPassword('');
      setPasswordRequirements({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false
      });
    }
  }

  // Función para normalizar el rol antes de enviarlo
const normalizarRol = (rolId) => {
  const rolSeleccionado = roles.find(r => r._id === rolId);
  // Si no hay un rol seleccionado válido, no enviar el campo 'rol'
  if (!rolSeleccionado) return undefined;

  const nombre = rolSeleccionado.nombre.toLowerCase();
  // Enviar en minúsculas para que el backend cree correctamente el Profesor
  if (nombre === 'administrador') return 'administrador';
  if (nombre === 'profesor') return 'profesor';
  // Para cualquier otro nombre de rol, no enviar el campo 'rol'
  return undefined;
};

  const handleSubmit = async (formData) => {
    try {
      // Validar campos requeridos
      if (!formData.nombre || !formData.apellido || !formData.correo || !formData.tipo_de_documento || !formData.documento) {
        setAlert({
          open: true,
          message: 'Por favor complete todos los campos obligatorios',
          severity: 'error'
        });
        return;
      }

      // Validar formato de correo
      const emailRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9._%+-]+@[A-Za-zÁÉÍÓÚáéíóúÑñ0-9.-]+\.[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,}$/;
      if (!emailRegex.test(formData.correo)) {
        setAlert({ open: true, message: 'El formato del correo electrónico no es válido', severity: 'error' });
        return;
      }

      // Validar contraseña solo al crear
      if (!isEditing) {
        if (!formData.contrasena) {
          setAlert({ open: true, message: 'La contraseña es requerida', severity: 'error' });
          return;
        }
        if (formData.contrasena.length < 8) {
          setAlert({ open: true, message: 'La contraseña debe tener al menos 8 caracteres', severity: 'error' });
          return;
        }
        const hasUpperCase = /[A-Z]/.test(formData.contrasena);
        const hasLowerCase = /[a-z]/.test(formData.contrasena);
        const hasNumber = /[0-9]/.test(formData.contrasena);

        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
          setAlert({
            open: true,
            message: 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número',
            severity: 'error'
          });
          return;
        }
        if (formData.contrasena !== formData.confirmacionContrasena) {
          setAlert({ open: true, message: 'Las contraseñas no coinciden', severity: 'error' });
          return;
        }
      }

      // Detectar si el rol seleccionado es profesor
      const profesorRol = roles.find(rol => rol.nombre.toLowerCase() === 'profesor');
      const isProfesorRole = !isEditing && profesorRol && formData.rolId === profesorRol._id;

      // Armar datos a enviar
      const datos = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        correo: formData.correo,
        contrasena: formData.contrasena,
        telefono: formData.telefono,
        documento: formData.documento,
        tipo_de_documento: formData.tipo_de_documento,
        direccion: formData.direccion,
        estado: true,
        rol: normalizarRol(formData.rolId), // 👈 aquí aplicamos normalización
        especialidades: isProfesorRole ? (formData.especialidades || []) : []
      };

      // Eliminar campos undefined y que no correspondan al schema de usuario
      Object.keys(datos).forEach(key => {
        if (datos[key] === undefined || (key === 'especialidades' && datos[key].length === 0)) {
          delete datos[key];
        }
      });


      console.log("📤 Datos que se enviarán al backend:", datos);

      if (isEditing) {
        await usuariosService.update(selectedUsuario._id, datos);
        setAlert({
          open: true,
          message: 'Usuario actualizado correctamente',
          severity: 'success'
        });
      } else {
        await axios.post("http://localhost:3000/api/usuarios", datos);
        setAlert({
          open: true,
          message: 'Usuario creado correctamente',
          severity: 'success'
        });
      }

      // Refrescar la lista de usuarios
      await fetchData();
      
      // Cerrar el modal
      setFormModalOpen(false);

    } catch (error) {
      console.error("❌ Error al guardar usuario:", error);
      setAlert({
        open: true,
        message: error.message || 'Error al guardar usuario',
        severity: 'error'
      });
    }
  };


  // Estado para controlar los campos adicionales del profesor
  const [showProfesorFields, setShowProfesorFields] = useState(false);

  // Cursos (usados como especialidades en el formulario de usuarios/profesores)
  const [cursosOptions, setCursosOptions] = useState([]);

  // Lista por defecto (fallback) en caso de que la API no responda
  const defaultCursos = [
    { value: "Piano", label: "Piano" },
    { value: "Guitarra", label: "Guitarra" },
    { value: "Violín", label: "Violín" },
    { value: "Batería", label: "Batería" },
    { value: "Canto", label: "Canto" },
    { value: "Flauta", label: "Flauta" },
    { value: "Saxofón", label: "Saxofón" },
    { value: "Trompeta", label: "Trompeta" },
    { value: "Bajo", label: "Bajo" },
    { value: "Teoría Musical", label: "Teoría Musical" }
  ];

  const fetchCursos = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/cursos');
      if (!Array.isArray(response.data)) {
        setCursosOptions(defaultCursos);
        return;
      }

      const nombresUnicos = [...new Set(
        response.data
          .filter(c => c && c.estado === true && c.nombre)
          .map(c => c.nombre.toString())
      )].sort();

      const options = nombresUnicos.map(n => ({ value: n, label: n }));
      setCursosOptions(options.length > 0 ? options : defaultCursos);
    } catch (error) {
      console.error('Error al cargar cursos (para especialidades):', error);
      setCursosOptions(defaultCursos);
    }
  };

  // Cuando se abre el formulario para editar, verificar si el usuario ya tiene rol de profesor
  useEffect(() => {
    if (isEditing && selectedUsuario && selectedUsuario.roles) {
      console.log('Usuario seleccionado para editar:', selectedUsuario);

      // Buscar el rol de profesor
      const profesorRol = roles.find(rol => rol.nombre.toLowerCase().includes('profesor'));

      // Verificar si el usuario tiene rol de profesor
      if (roles.length > 0) {
        const tieneRolProfesor = selectedUsuario.roles.some(rol =>
          (typeof rol === 'string' && rol === profesorRol?._id) ||
          (typeof rol === 'object' && rol._id === profesorRol?._id)
        );

        if (tieneRolProfesor) {
          setShowProfesorFields(true);

          // Cargar información adicional del profesor si existe
          const cargarDatosProfesor = async () => {
            try {
              const response = await axios.get(`http://localhost:3000/api/profesores?usuarioId=${selectedUsuario._id}`);
              if (response.data && response.data.length > 0) {
                const profesorData = response.data[0];
                // Actualizar el usuario seleccionado con los datos del profesor
                setSelectedUsuario(prev => ({
                  ...prev,
                  telefono: profesorData.telefono || '',
                  direccion: profesorData.direccion || '',
                  especialidades: profesorData.especialidades || []
                }));
              }
            } catch (error) {
              console.error('Error al cargar datos del profesor:', error);
            }
          };

          cargarDatosProfesor();
        } else {
          setShowProfesorFields(false);
        }
      }
    } else if (!isEditing) {
      setShowProfesorFields(false);
    }
  }, [isEditing, selectedUsuario?._id, roles]);

  // Cargar cursos al montar el componente
  useEffect(() => {
    fetchCursos();
  }, []);

  // Definir los campos del formulario según el modo (crear o editar)


  const formFields = useMemo(() => [
    // Solo mostrar campo de rol al crear nuevo usuario, no al editar
    ...(!isEditing ? [{
      id: "rolId",
      label: "Rol",
      type: "select",
      required: true,
      validation: (value) => !value ? "Debe seleccionar un rol" : null,
      options: roles
        .filter(role => role.nombre === 'Administrador' || role.nombre === 'Profesor')
        .map(role => ({
          value: role._id,
          label: role.nombre
        })),
      onChange: (value) => {
        // Verificar si es rol de profesor para mostrar campos adicionales
        const profesorRol = roles.find(rol => rol.nombre.toLowerCase().includes('profesor'));
        setShowProfesorFields(value === profesorRol?._id);
      }
    }] : [
      // Campo especial para mostrar y editar roles en modo edición
      {
        id: "rolesAsignados",
        label: "Roles Asignados",
        type: "custom",
        render: (value, onChange, formData) => {
          const userRoles = selectedUsuario?.roles || [];
          return (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Roles actuales:
              </Typography>
              {userRoles.length > 0 ? (
                <Box sx={{ mb: 2 }}>
                  {userRoles.map((rol, index) => (
                    <Chip
                      key={index}
                      label={rol.nombre || 'Rol sin nombre'}
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Sin roles asignados
                </Typography>
              )}

            </Box>
          );
        }
      }
    ]),
    // Campos adicionales para profesor
    ...(showProfesorFields ? [
      {
        id: "telefono",
        label: "Teléfono",
        type: "text",
        required: true,
        maxLength: 10,
        validation: (value) => {
          if (!value) return "El teléfono es requerido";
          if (!/^\d{10}$/.test(value)) return "El teléfono debe tener exactamente 10 dígitos";
          return null;
        }
      },

      {
        id: "direccion",
        label: "Dirección",
        type: "text",
        required: false
      },
      {
        id: "especialidades",
        label: "Especialidades",
        type: "multiSelect",
        required: true,
        validation: (value) => {
          if (!value || !Array.isArray(value) || value.length === 0) return "Debe seleccionar al menos una especialidad";
          return null;
        },
        options: cursosOptions
      }
    ] : []),
    {
      id: "nombre",
      label: "Nombre",
      type: "text",
      required: true,
      validation: (value) => !value ? "El nombre es requerido" : null
    },
    {
      id: "apellido",
      label: "Apellido",
      type: "text",
      required: true,
      validation: (value) => !value ? "El apellido es requerido" : null
    },
    {
      id: "tipo_de_documento",
      label: "Tipo de Documento",
      type: "select",
      required: true,
      validation: (value) => !value ? "El tipo de documento es requerido" : null,
      options: [
        { value: "TI", label: "Tarjeta de Identidad" },
        { value: "CC", label: "Cédula de Ciudadanía" },
        { value: "CE", label: "Cédula de Extranjería" },
        { value: "PP", label: "Pasaporte" },
        { value: "NIT", label: "NIT" }
      ]
    },
    {
      id: "documento",
      label: "N° Documento",
      type: "text",
      required: true,
      maxLength: 11,
      validation: (value) => {
        if (!value) return "El número de documento es requerido";
        if (!/^\d+$/.test(value)) return "El documento debe contener solo números";
        if (value.length > 11) return "El documento no puede tener más de 11 caracteres";
        return null;
      }
    },
    {
      id: "correo",
      label: "Correo",
      // Usamos text en lugar de email para evitar la validación HTML5 del navegador
      // (que puede rechazar caracteres Unicode en la parte del dominio). Validamos manualmente
      // con una expresión que acepta letras Unicode (incluida la 'ñ').
      type: "text",
      required: true,
      validation: (value) => {
        if (!value) return "El correo es requerido";
        // Permitir letras latinas (incluye ñ y vocales acentuadas) en local y dominio
        const emailRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9._%+-]+@[A-Za-zÁÉÍÓÚáéíóúÑñ0-9.-]+\.[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,}$/;
        if (!emailRegex.test(value)) return "El correo no es válido";
        return null;
      }
    },
    // Mostrar campos de contraseña solo al crear nuevo usuario
    ...(!isEditing ? [
      {
        id: "contrasena",
        label: "Contraseña",
        type: "password",
        required: true,
        maxLength: 15,
        validation: (value) => {
          if (!value) return "La contraseña es requerida";
          if (value.length < 8) return "La contraseña debe tener al menos 8 caracteres";

          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumber = /[0-9]/.test(value);

          if (!hasUpperCase || !hasLowerCase || !hasNumber) {
            return "La contraseña debe contener al menos una letra mayúscula, una minúscula y un número";
          }
          return null;
        },
        validateOnChange: true,
        helperText: (value) => {
          const reqs = {
            length: value?.length >= 8,
            uppercase: /[A-Z]/.test(value || ''),
            lowercase: /[a-z]/.test(value || ''),
            number: /[0-9]/.test(value || '')
          };

          const messages = [];
          messages.push((reqs.length ? '✓' : '•') + ' Mínimo 8 caracteres');
          messages.push((reqs.uppercase ? '✓' : '•') + ' Al menos una mayúscula');
          messages.push((reqs.lowercase ? '✓' : '•') + ' Al menos una minúscula');
          messages.push((reqs.number ? '✓' : '•') + ' Al menos un número');

          return messages.join(' | ');
        },
        onChange: (value, formData, setFieldValue) => handlePasswordChange(value, formData, setFieldValue)
      },
      {
        id: "confirmacionContrasena",
        label: "Confirmar Contraseña",
        type: "password",
        required: true,
        maxLength: 15,
        validation: (value, formData) => {
          if (!value) return "La confirmación de contraseña es requerida";
          if (formData && value !== formData.contrasena) return "La contraseña coincide";
          return null;
        },
        validateOnChange: true,
        helperText: (value, formData) => {
          if (!value) return '';
          return value === formData?.contrasena
            ? ''
            : 'la contraseña';
        },
        onChange: (value, formData, setFieldValue) => handleConfirmPasswordChange(value, formData, setFieldValue)
      }
    ] : []),
    { id: "estado", label: "Estado", type: "switch", defaultValue: true },
  ], [roles, isEditing, showProfesorFields]);

  const handleToggleStatus = async (usuarioId) => {
    try {
      const usuario = usuarios.find(u => u._id === usuarioId);
      const updatedUserResp = await usuariosService.update(usuarioId, {
        ...usuario,
        estado: !usuario.estado
      });
      const updatedUser = updatedUserResp?.data ?? updatedUserResp;
      setUsuarios((prev) => prev.map((item) => (item._id === usuarioId ? updatedUser : item)));
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  }

  const handleSaveRoleAssignment = async (data) => {
    try {
      const { userId, roleIds, primaryRoleId } = data;
      console.log('Guardando asignación de roles:', { userId, roleIds, primaryRoleId });

      // Normalizar a strings para evitar enviar objetos completos
      const normalizedUserId = typeof userId === 'object' ? (userId._id || userId.id || String(userId)) : String(userId);
      const normalizedRoleIds = roleIds.map(r => typeof r === 'object' ? (r._id || r.id || String(r)) : String(r));

      // Primero eliminar todas las asignaciones existentes del usuario (si las hay)
      try {
        await usuariosHasRolService.deleteByUsuarioId(normalizedUserId);
        console.log('Asignaciones anteriores eliminadas');
      } catch (error) {
        console.log('No había asignaciones anteriores o error al eliminar:', error);
      }

      // Crear una única relación con el array completo de roles
      const newAssignment = {
        usuarioId: normalizedUserId,
        rolId: normalizedRoleIds,
        estado: true
        // Nota: el rol primario aún no se persiste en backend
      };
      console.log('Creando/actualizando relación usuario-rol con roles:', newAssignment);

      await usuariosHasRolService.create(newAssignment);

      // Recargar todos los datos usando la función fetchData
      const usuariosConRoles = await fetchData();

      // Actualizar el usuario seleccionado si está siendo mostrado
      if (selectedUsuario && selectedUsuario._id === userId) {
        const usuarioActualizado = usuariosConRoles.find(u => u._id === normalizedUserId);
        setSelectedUsuario(usuarioActualizado);
      }

      // Cerrar el modal de asignación de roles
      setRoleAssignmentOpen(false);

      // Mostrar mensaje de éxito
      setAlert({
         open: true,
         message: 'Roles asignados correctamente',
         severity: 'success'
       });

    } catch (error) {
      console.error('Error al asignar roles:', error);
      setAlert({
        open: true,
        message: 'Error al asignar roles: ' + (error?.message || 'Intenta nuevamente'),
        severity: 'error'
      });
    }
  }

  const columns = [
    { id: "nombre", label: "Nombre" },
    { id: "apellido", label: "Apellido" },
    { id: "tipo_de_documento", label: "Tipo de Documento" },
    { id: "documento", label: "N° Documento" },
    { id: "correo", label: "Correo" },
    {
      id: "roles",
      label: "Roles Actuales",
      render: (_, row) => {
        if (row.roles && Array.isArray(row.roles) && row.roles.length > 0) {
          return row.roles.map(rol => {
            if (typeof rol === 'object' && rol !== null) {
              return rol.nombre || rol.name || 'Rol sin nombre';
            }
            return 'Rol sin nombre';
          }).join(", ");
        }
        return "Sin roles asignados";
      }
    },
    {
      id: "estado",
      label: "Estado",
      render: (value, row) => <StatusButton active={value} onClick={() => handleToggleStatus(row._id)} />,
    }
  ]

  const detailFields = [
    { id: "nombre", label: "Nombre" },
    { id: "apellido", label: "Apellido" },
    { id: "tipo_de_documento", label: "Tipo de Documento" },
    { id: "documento", label: "Número de Documento" },
    { id: "correo", label: "Correo" },
    {
      id: "roles",
      label: "Roles Asignados",
      render: (value, row) => {
        // Usar selectedUsuario si está disponible, sino usar la fila
        const usuario = selectedUsuario || row;
        const userRoles = usuario?.roles;

        if (userRoles && Array.isArray(userRoles) && userRoles.length > 0) {
          return userRoles.map(rol => {
            if (typeof rol === 'object' && rol !== null) {
              return rol.nombre || rol.name || 'Rol sin nombre';
            }
            return 'Rol sin nombre';
          }).join(", ");
        }
        return "Sin roles asignados";
      },
    },
    { id: "estado", label: "Estado", render: (value) => <StatusButton active={value} /> },
  ]

  // Función para cerrar la alerta
  const handleCloseAlert = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlert({
      ...alert,
      open: false
    });
  };

  // Efecto para cerrar automáticamente la alerta después de mostrarla
  useEffect(() => {
    if (alert.open) {
      const timer = setTimeout(() => {
        setAlert({
          ...alert,
          open: false
        });
      }, 1000); // 1 segundo

      return () => clearTimeout(timer);
    }
  }, [alert.open, alert.message]);

  return (
    <div className="usuarios-container">
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '60px' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          variant="filled"
          sx={{ width: '100%', fontSize: '1rem', padding: '10px 16px' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>

      <GenericList
        data={usuarios}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onCreate={handleCreate}
        title="Gestión de Usuarios"
      />

      <DetailModal
        title={`Detalle del Usuario: ${selectedUsuario?.nombre}`}
        data={selectedUsuario}
        fields={detailFields}
        open={detailModalOpen}
        onClose={handleCloseDetail}
      />

      <FormModal
        title={isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
        fields={formFields}
        initialData={selectedUsuario}
        open={formModalOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      />

      <UserRoleAssignment
        open={roleAssignmentOpen}
        onClose={() => setRoleAssignmentOpen(false)}
        usuario={selectedUsuario}
        roles={roles}
        onSave={handleSaveRoleAssignment}
      />

      <ConfirmationDialog
        open={confirmationDialog.open}
        title={confirmationDialog.title}
        content={confirmationDialog.message}
        onConfirm={confirmationDialog.onConfirm}
        onClose={() => setConfirmationDialog({ open: false, title: '', message: '', onConfirm: null })}
        confirmButtonText="Eliminar"
        cancelButtonText="Cancelar"
      />

      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setAlert({ ...alert, open: false })} 
          severity={alert.severity} 
          variant="filled"
          sx={{ width: '100%', fontWeight: 'bold' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default Usuarios