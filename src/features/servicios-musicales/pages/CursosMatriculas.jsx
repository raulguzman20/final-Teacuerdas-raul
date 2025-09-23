import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Paper,
  Button,
  TextField,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { GenericList } from '../../../shared/components/GenericList';
import { DetailModal } from '../../../shared/components/DetailModal';
import { FormModal } from '../../../shared/components/FormModal';
import { StatusButton } from '../../../shared/components/StatusButton';
import AlertComponent from '../components/AlertComponent';
import useAlert from '../../../shared/hooks/useAlert';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ height: 'calc(100% - 48px)' }}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const API_URL = 'http://localhost:3000/api';

const CursosMatriculas = () => {
  const [tabValue, setTabValue] = useState(0);
  const { showSuccess, showError } = useAlert();

  // Cursos state
  const [cursos, setCursos] = useState([]);
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [cursoDetailOpen, setCursoDetailOpen] = useState(false);
  const [cursoFormOpen, setCursoFormOpen] = useState(false);
  const [isEditingCurso, setIsEditingCurso] = useState(false);

  // Matriculas state
  const [matriculas, setMatriculas] = useState([]);
  const [selectedMatricula, setSelectedMatricula] = useState(null);
  const [matriculaDetailOpen, setMatriculaDetailOpen] = useState(false);
  const [matriculaFormOpen, setMatriculaFormOpen] = useState(false);
  const [isEditingMatricula, setIsEditingMatricula] = useState(false);

  // Tab handling
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Efecto para cargar cursos al montar el componente
  useEffect(() => {
    fetchCursos();
    fetchMatriculas();
  }, []);

  // Función para obtener todos los cursos
  const fetchCursos = async () => {
    try {
      const response = await axios.get(`${API_URL}/cursos`);
      setCursos(response.data);
    } catch (error) {
      showError('Error al cargar los cursos');
      console.error('Error:', error);
    }
  };

  // Función para obtener todas las matrículas
  const fetchMatriculas = async () => {
    try {
      const response = await axios.get(`${API_URL}/matriculas`);
      setMatriculas(response.data);
    } catch (error) {
      showError('Error al cargar las matrículas');
      console.error('Error:', error);
    }
  };

  // Cursos columns and fields
  const cursosColumns = [
    { id: 'nombre', label: 'Nombre Curso' },
    { 
      id: 'valor_por_hora', 
      label: 'Valor por hora', 
      render: (value) => `$${value.toLocaleString()}`
    },
    { 
      id: 'estado', 
      label: 'Estado',
      render: (value, row) => (
        <StatusButton 
          active={value} 
          onClick={() => handleToggleCursoStatus(row._id)}
        />
      )
    }
  ];

  const cursosDetailFields = [
    { id: '_id', label: 'Código' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'descripcion', label: 'Descripción' },
    { 
      id: 'valor_por_hora', 
      label: 'Valor por hora',
      render: (value) => `$${value.toLocaleString()}`
    },
    { id: 'estado', label: 'Estado', render: (value) => <StatusButton active={value} /> }
  ];

  const cursosFormFields = [
    { 
      id: 'nombre', 
      label: 'Nombre Curso', 
      type: 'text',
      required: true,
      fullWidth: true,
      placeholder: 'Ej: Guitarra Clásica Nivel 1'
    },
    { 
      id: 'descripcion', 
      label: 'Descripción', 
      type: 'text',
      required: true,
      fullWidth: true,
      multiline: true,
      rows: 3,
      placeholder: 'Descripción detallada del curso',
      helperText: 'Ingrese una descripción detallada del curso'
    },
    { 
      id: 'valor_por_hora', 
      label: 'Valor por hora', 
      type: 'number',
      required: true,
      fullWidth: true,
      InputProps: { 
        startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>,
        inputProps: { min: 0 }
      },
      placeholder: 'Ej: 50000'
    },
    { 
      id: 'estado', 
      label: 'Estado', 
      type: 'switch',
      defaultValue: true
    }
  ];

  // Cursos handlers
  const handleCreateCurso = () => {
    setIsEditingCurso(false);
    setSelectedCurso(null);
    setCursoFormOpen(true);
  };

  const handleEditCurso = (curso) => {
    setIsEditingCurso(true);
    setSelectedCurso(curso);
    setCursoFormOpen(true);
  };

  const handleDeleteCurso = async (curso) => {
    const confirmDelete = window.confirm(`¿Está seguro de eliminar el curso ${curso.nombre}?`);
    if (confirmDelete) {
      try {
        const response = await axios.delete(`${API_URL}/cursos/${curso._id}`);
        
        // Verificar si el curso fue eliminado o solo cambiado a inactivo
        if (response.data.curso) {
          // El curso estaba asociado a una venta y se cambió a inactivo
          showSuccess(response.data.message || `El curso ${curso.nombre} ha sido cambiado a inactivo`);
        } else {
          // El curso fue eliminado completamente
          showSuccess(`El curso ${curso.nombre} ha sido eliminado exitosamente`);
        }
        
        fetchCursos(); // Recargar la lista de cursos
      } catch (error) {
        console.error('Error al eliminar curso:', error);
        
        // Intentar manejar el error de manera más específica
        if (error.response) {
          if (error.response.status === 500) {
            // Si es un error 500, podría ser un problema con la asociación a ventas
            // Intentamos cambiar solo el estado a inactivo
            try {
              await axios.put(`${API_URL}/cursos/${curso._id}`, { estado: false });
              showSuccess(`Se ha cambiado el estado del curso ${curso.nombre} a inactivo`);
              fetchCursos(); // Recargar la lista de cursos
              return;
            } catch (stateError) {
              console.error('Error al cambiar estado después de error 500:', stateError);
            }
          }
          showError(`Error al eliminar el curso ${curso.nombre}: ${error.response.data?.message || error.message}`);
        } else {
          showError(`Error al eliminar el curso ${curso.nombre}`);
        }
      }
    }
  };

  const handleViewCurso = (curso) => {
    setSelectedCurso(curso);
    setCursoDetailOpen(true);
  };

  const handleCloseCursoDetail = () => {
    setCursoDetailOpen(false);
    setSelectedCurso(null);
  };

  const handleCloseCursoForm = () => {
    setCursoFormOpen(false);
    setSelectedCurso(null);
    setIsEditingCurso(false);
  };

  const handleSubmitCurso = async (formData) => {
    try {
      const cursoData = {
        ...formData,
        valor_por_hora: Number(formData.valor_por_hora)
      };

      if (isEditingCurso) {
        // Asegurarse de que el estado sea un booleano
        if (cursoData.hasOwnProperty('estado')) {
          cursoData.estado = Boolean(cursoData.estado);
        }
        
        try {
          // Intentar actualizar todos los campos primero
          await axios.put(`${API_URL}/cursos/${selectedCurso._id}`, cursoData);
          showSuccess(`El curso ${selectedCurso.nombre} ha sido actualizado exitosamente`);
        } catch (error) {
          console.error('Error al actualizar curso:', error);
          
          // Si hay un error 400 y el mensaje indica que está asociado a una venta
           if (error.response && error.response.status === 400 && 
               error.response.data.message && 
               (error.response.data.message.includes('asociada a una venta') || 
                error.response.data.message.includes('asociado a una venta'))) {
            
            // Verificar si solo se está intentando cambiar el estado
            const onlyStateChange = Object.keys(cursoData).length === 1 && cursoData.hasOwnProperty('estado');
            
            if (onlyStateChange || cursoData.hasOwnProperty('estado')) {
              try {
                // Solo actualizar el estado
                await axios.put(`${API_URL}/cursos/${selectedCurso._id}`, { 
                  estado: Boolean(cursoData.estado) 
                });
                showSuccess(`Estado del curso ${selectedCurso.nombre} ${cursoData.estado ? 'activado' : 'desactivado'} exitosamente`);
              } catch (stateUpdateError) {
                console.error('Error al actualizar solo el estado:', stateUpdateError);
                showError(`No se pudo actualizar el estado del curso`);
                return;
              }
            } else {
              // Si se están intentando cambiar otros campos además del estado
              showError(`No se puede modificar el curso porque está asociado a una venta. Solo se permite modificar el estado.`);
              return;
            }
          } else {
            // Si es otro tipo de error, lo mostramos
            showError(`Error al actualizar el curso: ${error.response?.data?.message || error.message}`);
            return;
          }
        }
      } else {
        await axios.post(`${API_URL}/cursos`, cursoData);
        showSuccess(`El curso ha sido creado exitosamente`);
      }
      
      fetchCursos(); // Recargar la lista de cursos
      handleCloseCursoForm();
    } catch (error) {
      showError('Error al procesar el formulario del curso');
      console.error('Error:', error);
    }
  };

  const handleToggleCursoStatus = async (cursoId) => {
    try {
      const curso = cursos.find(item => item._id === cursoId);
      const nuevoEstado = !curso.estado;
      
      // Solo enviar el campo estado para permitir la actualización cuando hay una venta asociada
      // Asegurarse de que el estado sea un booleano
      await axios.put(`${API_URL}/cursos/${cursoId}`, { estado: Boolean(nuevoEstado) });
      
      showSuccess(`Estado del curso ${curso.nombre} ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`);
      fetchCursos(); // Recargar la lista de cursos
    } catch (error) {
      console.error('Error al cambiar el estado del curso:', error);
      if (error.response) {
        showError(`Error al cambiar el estado del curso: ${error.response.data?.message || error.message}`);
      } else {
        showError('Error al cambiar el estado del curso');
      }
    }
  };

  // Matriculas columns and fields
  const matriculasColumns = [
    { id: 'nombre', label: 'Nombre Matrícula' },
    { 
      id: 'valorMatricula', 
      label: 'Valor Matrícula', 
      render: (value) => `$${value.toLocaleString()}`
    },
    { 
      id: 'estado', 
      label: 'Estado',
      render: (value, row) => (
        <StatusButton 
          active={value} 
          onClick={() => handleToggleMatriculaStatus(row._id)}
        />
      )
    }
  ];

  const matriculasDetailFields = [
    { id: '_id', label: 'Código' },
    { id: 'nombre', label: 'Nombre' },
    { 
      id: 'valorMatricula', 
      label: 'Valor Matrícula',
      render: (value) => `$${value.toLocaleString()}`
    },
    { id: 'estado', label: 'Estado', render: (value) => <StatusButton active={value} /> }
  ];

  const matriculasFormFields = [
    { 
      id: 'nombre', 
      label: 'Nombre Matrícula', 
      type: 'text',
      required: true,
      fullWidth: true,
      placeholder: 'Ej: Matrícula Básica'
    },
    { 
      id: 'valorMatricula', 
      label: 'Valor Matrícula', 
      type: 'number',
      required: true,
      fullWidth: true,
      InputProps: { 
        startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>,
        inputProps: { min: 0 }
      },
      placeholder: 'Ej: 50000'
    },
    { 
      id: 'estado', 
      label: 'Estado', 
      type: 'switch',
      defaultValue: true
    }
  ];

  // Matriculas handlers
  const handleCreateMatricula = () => {
    setIsEditingMatricula(false);
    setSelectedMatricula(null);
    setMatriculaFormOpen(true);
  };

  const handleEditMatricula = (matricula) => {
    setIsEditingMatricula(true);
    setSelectedMatricula(matricula);
    setMatriculaFormOpen(true);
  };

  const handleDeleteMatricula = async (matricula) => {
    const confirmDelete = window.confirm(`¿Está seguro de eliminar la matrícula ${matricula.nombre}?`);
    if (confirmDelete) {
      try {
        const response = await axios.delete(`${API_URL}/matriculas/${matricula._id}`);
        
        // Verificar si la matrícula fue eliminada o solo cambiada a inactivo
        if (response.data.matricula) {
          // La matrícula estaba asociada a una venta y se cambió a inactivo
          showSuccess(response.data.message || `La matrícula ${matricula.nombre} ha sido cambiada a inactivo`);
        } else {
          // La matrícula fue eliminada completamente
          showSuccess(`La matrícula ${matricula.nombre} ha sido eliminada exitosamente`);
        }
        
        fetchMatriculas(); // Recargar la lista de matrículas
      } catch (error) {
        console.error('Error al eliminar matrícula:', error);
        
        // Intentar manejar el error de manera más específica
        if (error.response) {
          if (error.response.status === 500) {
            // Si es un error 500, podría ser un problema con la asociación a ventas
            // Intentamos cambiar solo el estado a inactivo
            try {
              await axios.put(`${API_URL}/matriculas/${matricula._id}`, { estado: false });
              showSuccess(`Se ha cambiado el estado de la matrícula ${matricula.nombre} a inactivo`);
              fetchMatriculas(); // Recargar la lista de matrículas
              return;
            } catch (stateError) {
              console.error('Error al cambiar estado después de error 500:', stateError);
            }
          }
          showError(`Error al eliminar la matrícula ${matricula.nombre}: ${error.response.data?.message || error.message}`);
        } else {
          showError(`Error al eliminar la matrícula ${matricula.nombre}`);
        }
      }
    }
  };

  const handleViewMatricula = (matricula) => {
    setSelectedMatricula(matricula);
    setMatriculaDetailOpen(true);
  };

  const handleCloseMatriculaDetail = () => {
    setMatriculaDetailOpen(false);
    setSelectedMatricula(null);
  };

  const handleCloseMatriculaForm = () => {
    setMatriculaFormOpen(false);
    setSelectedMatricula(null);
    setIsEditingMatricula(false);
  };

  const handleSubmitMatricula = async (formData) => {
    try {
      // Filtrar solo los campos válidos para evitar enviar campos de fecha
      const allowedFields = ['nombre', 'valorMatricula', 'estado'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (formData.hasOwnProperty(field)) {
          filteredData[field] = formData[field];
        }
      });
      
      const matriculaData = {
        ...filteredData,
        valorMatricula: Number(filteredData.valorMatricula)
      };

      if (isEditingMatricula) {
        // Asegurarse de que el estado sea un booleano
        if (matriculaData.hasOwnProperty('estado')) {
          matriculaData.estado = Boolean(matriculaData.estado);
        }
        
        try {
          // Intentar actualizar todos los campos primero
          await axios.put(`${API_URL}/matriculas/${selectedMatricula._id}`, matriculaData);
          showSuccess(`La matrícula ha sido actualizada exitosamente`);
        } catch (error) {
          console.error('Error al actualizar matrícula:', error);
          console.error('Error response:', error.response?.data);
          console.error('Error status:', error.response?.status);
          console.error('Datos enviados:', matriculaData);
          
          // Si hay un error 400 y el mensaje indica que está asociada a una venta
          if (error.response && error.response.status === 400 && 
              error.response.data.message && 
              (error.response.data.message.includes('asociada a una venta') || 
               error.response.data.message.includes('asociado a una venta'))) {
            
            // Verificar si solo se está intentando cambiar el estado
            const onlyStateChange = Object.keys(matriculaData).length === 1 && matriculaData.hasOwnProperty('estado');
            
            if (onlyStateChange || matriculaData.hasOwnProperty('estado')) {
              try {
                // Solo actualizar el estado
                await axios.put(`${API_URL}/matriculas/${selectedMatricula._id}`, { 
                  estado: Boolean(matriculaData.estado) 
                });
                showSuccess(`Estado de la matrícula ${matriculaData.estado ? 'activada' : 'desactivada'} exitosamente`);
              } catch (stateUpdateError) {
                console.error('Error al actualizar solo el estado:', stateUpdateError);
                showError(`No se pudo actualizar el estado de la matrícula`);
                return;
              }
            } else {
              // Si se están intentando cambiar otros campos además del estado
              showError(`No se puede modificar la matrícula porque está asociada a una venta. Solo se permite modificar el estado.`);
              return;
            }
          } else {
            // Si es otro tipo de error, lo mostramos
            showError(`Error al actualizar la matrícula: ${error.response?.data?.message || error.message}`);
            return;
          }
        }
      } else {
        await axios.post(`${API_URL}/matriculas`, matriculaData);
        showSuccess(`La matrícula ha sido creada exitosamente`);
      }
      
      fetchMatriculas(); // Recargar la lista de matrículas
      handleCloseMatriculaForm();
    } catch (error) {
      showError('Error al procesar el formulario de matrícula');
      console.error('Error:', error);
    }
  };

  const handleToggleMatriculaStatus = async (matriculaId) => {
    try {
      const matricula = matriculas.find(item => item._id === matriculaId);
      const nuevoEstado = !matricula.estado;
      
      // Solo enviar el campo estado para permitir la actualización cuando hay una venta asociada
      // Asegurarse de que el estado sea un booleano
      await axios.put(`${API_URL}/matriculas/${matriculaId}`, { estado: Boolean(nuevoEstado) });
      
      showSuccess(`Estado de la matrícula ${matricula.nombre} ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`);
      fetchMatriculas(); // Recargar la lista de matrículas
    } catch (error) {
      console.error('Error al cambiar el estado de la matrícula:', error);
      if (error.response) {
        showError(`Error al cambiar el estado de la matrícula: ${error.response.data?.message || error.message}`);
      } else {
        showError('Error al cambiar el estado de la matrícula');
      }
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <AlertComponent />
      <Paper sx={{ borderBottom: 0, borderColor: 'transparent', mb: 2, boxShadow: 'none', backgroundColor: 'transparent' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="standard"
            sx={{ 
              '& .MuiTab-root': { 
                fontWeight: 'bold',
                fontSize: '0.9rem',
                color: '#555',
                textTransform: 'uppercase',
                minWidth: '120px',
                minHeight: '36px',
                padding: '6px 12px',
                marginRight: '8px',
                marginTop: '8px',
                marginBottom: '8px',
                borderRadius: '4px',
                transition: 'all 0.3s ease',
                border: '1px solid #ddd',
                backgroundColor: 'transparent'
              },
              '& .Mui-selected': {
                color: '#fff !important',
                backgroundColor: '#0455a2',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            <Tab 
              label="Cursos" 
              id="tab-0" 
              aria-controls="tabpanel-0" 
              sx={{ 
                '&:hover': {
                  backgroundColor: 'rgba(4, 85, 162, 0.05)'
                }
              }}
            />
            <Tab 
              label="Matrículas" 
              id="tab-1" 
              aria-controls="tabpanel-1" 
              sx={{ 
                '&:hover': {
                  backgroundColor: 'rgba(4, 85, 162, 0.05)'
                }
              }}
            />
          </Tabs>
        </Paper>

      <TabPanel value={tabValue} index={0}>
        <GenericList
          data={cursos}
          columns={cursosColumns}
          onEdit={handleEditCurso}
          onDelete={handleDeleteCurso}
          onCreate={handleCreateCurso}
          onView={handleViewCurso}
          title="Gestión de Cursos"
        />
        
        <DetailModal
          title={`Detalle del Curso: ${selectedCurso?.nombre}`}
          data={selectedCurso}
          fields={cursosDetailFields}
          open={cursoDetailOpen}
          onClose={handleCloseCursoDetail}
        />

        <FormModal
          title={isEditingCurso ? 'Editar Curso' : 'Crear Nuevo Curso'}
          fields={cursosFormFields}
          initialData={selectedCurso}
          open={cursoFormOpen}
          onClose={handleCloseCursoForm}
          onSubmit={handleSubmitCurso}
          maxWidth="md"
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <GenericList
          data={matriculas}
          columns={matriculasColumns}
          onEdit={handleEditMatricula}
          onDelete={handleDeleteMatricula}
          onCreate={handleCreateMatricula}
          onView={handleViewMatricula}
          title="Gestión de Matrículas"
        />
        
        <DetailModal
          title={`Detalle de Matrícula: ${selectedMatricula?.nombre}`}
          data={selectedMatricula}
          fields={matriculasDetailFields}
          open={matriculaDetailOpen}
          onClose={handleCloseMatriculaDetail}
        />

        <FormModal
          title={isEditingMatricula ? 'Editar Matrícula' : 'Crear Nueva Matrícula'}
          fields={matriculasFormFields}
          initialData={selectedMatricula}
          open={matriculaFormOpen}
          onClose={handleCloseMatriculaForm}
          onSubmit={handleSubmitMatricula}
        />
      </TabPanel>
    </Box>
  );
};

export default CursosMatriculas;