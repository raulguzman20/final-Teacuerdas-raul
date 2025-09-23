


import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogActions, 
  Button, 
  Typography, 
  Box,
  IconButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Checkbox,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export const UserRoleAssignment = ({ 
  open, 
  onClose, 
  usuario,
  roles,
  onSave
}) => {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [primaryRole, setPrimaryRole] = useState('');

  // Inicializar estados con props recibidas

  useEffect(() => {
    if (usuario && usuario.roles) {
      setSelectedRoles(usuario.roles.map(role => role._id));
      
      // Si hay un rol primario, seleccionarlo
      if (usuario.primaryRoleId) {
        setPrimaryRole(usuario.primaryRoleId);
      } else if (usuario.roles.length > 0) {
        setPrimaryRole(usuario.roles[0]._id);
      }
    } else {
      setSelectedRoles([]);
      setPrimaryRole('');
    }
  }, [usuario, open]);

  const handleToggleRole = (roleId) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        // Si estamos quitando el rol primario, resetear el rol primario
        if (primaryRole === roleId) {
          setPrimaryRole('');
        }
        return prev.filter(id => id !== roleId);
      } else {
        // Si es el primer rol que se agrega, hacerlo primario
        if (prev.length === 0) {
          setPrimaryRole(roleId);
        }
        return [...prev, roleId];
      }
    });
  };

  const handlePrimaryRoleChange = (event) => {
    setPrimaryRole(event.target.value);
  };

  const handleSave = () => {
    onSave({
      userId: usuario._id,
      roleIds: selectedRoles,
      primaryRoleId: primaryRole
    });
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={true}
      onBackdropClick={() => {}} // Prevenir cierre al hacer clic fuera
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          p: 2
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
          Asignar Roles a {usuario?.nombre}
        </Typography>
        <IconButton 
          onClick={onClose} 
          aria-label="close"
          sx={{ 
            color: 'text.secondary',
            p: 0.5,
            '&:hover': { 
              backgroundColor: 'rgba(0, 0, 0, 0.04)' 
            } 
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Seleccione los roles que desea asignar al usuario y establezca un rol primario.
      </Typography>
      
      <Table size="small" sx={{ mb: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Asignar</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Nombre del Rol</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {roles && roles.length > 0 ? roles
            .map((role) => (
                <TableRow key={role._id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRoles.includes(role._id)}
                      onChange={() => handleToggleRole(role._id)}
                    />
                  </TableCell>
                  <TableCell>{role.nombre}</TableCell>
                  <TableCell>{role.descripcion}</TableCell>
                </TableRow>
            )) : (
            <TableRow>
              <TableCell colSpan={3} align="center">
                {roles ? 'No hay roles disponibles' : 'Cargando roles...'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {selectedRoles.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="primary-role-label">Rol Principal</InputLabel>
            <Select
              labelId="primary-role-label"
              value={primaryRole}
              label="Rol Principal"
              onChange={handlePrimaryRoleChange}
            >
              {roles
                .filter(role => selectedRoles.includes(role._id))
                .map(role => (
                  <MenuItem key={role._id} value={role._id}>
                    {role.nombre}
                  </MenuItem>
                ))
              }
            </Select>
          </FormControl>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ 
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            px: 3,
            borderColor: 'rgba(0, 0, 0, 0.12)'
          }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disableElevation
          disabled={selectedRoles.length === 0 || (selectedRoles.length > 0 && !primaryRole)}
          sx={{ 
            backgroundColor: '#4f46e5',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            px: 3,
            '&:hover': {
              backgroundColor: '#4338ca',
            }
          }}
        >
          Guardar
        </Button>
      </Box>
    </Dialog>
  );
};