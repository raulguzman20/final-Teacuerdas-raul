"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Chip,
  InputAdornment,
  Alert,
  Divider,
  Snackbar,
  CircularProgress,
} from "@mui/material"
import { 
  Close as CloseIcon, 
  AccessTime as TimeIcon, 
  CalendarMonth as CalendarIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from "@mui/icons-material"

// Función para convertir hora de 24h a 12h con AM/PM
const formatTo12Hour = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Función para convertir hora de 12h a 24h
const formatTo24Hour = (time12) => {
  const [time, period] = time12.split(' ')
  const [hours, minutes] = time.split(':').map(Number)
  let hours24 = hours
  if (period === 'AM' && hours === 12) hours24 = 0
  if (period === 'PM' && hours !== 12) hours24 = hours + 12
  return `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export const ScheduleModal = ({
  isOpen,
  onClose,
  onSubmit,
  profesores = [],
  defaultProfesorId = "",
  defaultHorariosPorDia = [],
  defaultEstado = "activo",
  defaultMotivo = "",
  isEditing = false,
}) => {
  const [formData, setFormData] = useState({
    profesorId: "",
    estado: "activo",
    motivo: "",
    horariosPorDia: [],
  })

  const [errors, setErrors] = useState({})
  const [selectedDays, setSelectedDays] = useState([])
  const [defaultTime, setDefaultTime] = useState({ horaInicio: "08:00", horaFin: "20:00" })
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" })

  const dayNames = {
    L: "Lunes",
    M: "Martes", 
    X: "Miércoles",
    J: "Jueves",
    V: "Viernes",
    S: "Sábado",
    D: "Domingo",
  }

  const validDays = ["L", "M", "X", "J", "V", "S", "D"]
  
  // Horarios disponibles actualizados (8:00 AM a 8:00 PM con intervalos de 45 minutos) - Formato 24h para lógica interna
  const hourValues24 = [
    "08:00", "08:45", "09:30", "10:15", "11:00", "11:45", "12:30", "13:15", 
    "14:00", "14:45", "15:30", "16:15", "17:00", "17:45", "18:30", "19:15", "20:00"
  ]
  // Horarios en formato 12h para mostrar al usuario
  const hourValues = hourValues24.map(hour => formatTo12Hour(hour))

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialProfesorId = defaultProfesorId || formData.profesorId || "";
      setFormData({
        profesorId: initialProfesorId,
        estado: isEditing ? defaultEstado : "activo",
        motivo: defaultMotivo || "",
        horariosPorDia: defaultHorariosPorDia.length > 0 ? [...defaultHorariosPorDia] : [],
      })
      setErrors({})
      setSelectedDays([])
      setDefaultTime({ horaInicio: "08:00", horaFin: "20:00" })
    }
  }, [isOpen, defaultProfesorId, defaultHorariosPorDia, defaultEstado, defaultMotivo, isEditing])

  const handleInputChange = (field, value) => {
    console.log(`Cambiando ${field} a:`, value); // Log temporal para debug
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleDaySelection = (day) => {
    const isSelected = selectedDays.includes(day)
    if (isSelected) {
      setSelectedDays(prev => prev.filter(d => d !== day))
    } else {
      setSelectedDays(prev => [...prev, day])
    }
  }

  const addSelectedDays = () => {
    if (selectedDays.length === 0) return

    // Validar rango del horario por defecto 08:00 - 20:00
    const minHora = "08:00"
    const maxHora = "20:00"
    if (defaultTime.horaInicio < minHora || defaultTime.horaInicio > maxHora) {
      setSnackbar({ open: true, message: "La hora de inicio debe ser entre 08:00 y 20:00", severity: "warning" })
      return
    }
    if (defaultTime.horaFin < minHora || defaultTime.horaFin > maxHora) {
      setSnackbar({ open: true, message: "La hora de fin debe ser entre 08:00 y 20:00", severity: "warning" })
      return
    }

    // Validar que sean horas válidas del horario establecido
    const horasValidas = hourValues24
    if (!horasValidas.includes(defaultTime.horaInicio)) {
      setSnackbar({ open: true, message: "La hora de inicio debe ser una hora válida del horario establecido", severity: "warning" })
      return
    }
    if (!horasValidas.includes(defaultTime.horaFin)) {
      setSnackbar({ open: true, message: "La hora de fin debe ser una hora válida del horario establecido", severity: "warning" })
      return
    }

    const newHorarios = selectedDays.map(dia => ({
      dia,
      horaInicio: defaultTime.horaInicio,
      horaFin: defaultTime.horaFin
    }))

    setFormData((prev) => ({
      ...prev,
      horariosPorDia: [...prev.horariosPorDia, ...newHorarios]
    }))

    setSelectedDays([])
    setSnackbar({ open: true, message: newHorarios.length > 1 ? "Horarios agregados" : "Horario agregado", severity: "success" })
  }

  const handleHorarioChange = (index, field, value) => {
    const newHorarios = [...formData.horariosPorDia]
    newHorarios[index] = { ...newHorarios[index], [field]: value }
    
    setFormData((prev) => ({
      ...prev,
      horariosPorDia: newHorarios,
    }))

    if (errors[`horario_${index}_${field}`]) {
      setErrors((prev) => ({ ...prev, [`horario_${index}_${field}`]: "" }))
    }
  }

  const removeHorario = (index) => {
    setFormData((prev) => ({
      ...prev,
      horariosPorDia: prev.horariosPorDia.filter((_, i) => i !== index),
    }))
    setSnackbar({ open: true, message: "Horario eliminado", severity: "success" })
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.profesorId) {
      newErrors.profesorId = "Debe seleccionar un profesor"
    }

    if (formData.horariosPorDia.length === 0) {
      newErrors.horariosPorDia = "Debe configurar al menos un horario por día"
    } else {
      const diasUsados = new Set()
      
      const minHora = "08:00"
      const maxHora = "20:00"
      const horasValidas = hourValues24
      
      formData.horariosPorDia.forEach((horario, index) => {
        if (!horario.dia) {
          newErrors[`horario_${index}_dia`] = "Debe seleccionar un día"
        } else if (diasUsados.has(horario.dia)) {
          newErrors[`horario_${index}_dia`] = "Este día ya está configurado"
        } else {
          diasUsados.add(horario.dia)
        }

        if (!horario.horaInicio) {
          newErrors[`horario_${index}_horaInicio`] = "Debe especificar hora de inicio"
        }

        if (!horario.horaFin) {
          newErrors[`horario_${index}_horaFin`] = "Debe especificar hora de fin"
        }

        if (horario.horaInicio && horario.horaFin) {
          // Validar que las horas sean válidas del horario establecido
          if (!horasValidas.includes(horario.horaInicio)) {
            newErrors[`horario_${index}_horaInicio`] = "La hora de inicio debe ser una hora válida del horario establecido"
          }
          if (!horasValidas.includes(horario.horaFin)) {
            newErrors[`horario_${index}_horaFin`] = "La hora de fin debe ser una hora válida del horario establecido"
          }

          const [inicioHora, inicioMin] = horario.horaInicio.split(":").map(Number)
          const [finHora, finMin] = horario.horaFin.split(":").map(Number)
          const inicioTotal = inicioHora * 60 + inicioMin
          const finTotal = finHora * 60 + finMin

          if (finTotal <= inicioTotal) {
            newErrors[`horario_${index}_horaFin`] = "La hora de fin debe ser posterior a la hora de inicio"
          }

          // Validar rango permitido 08:00 - 20:00
          if (horario.horaInicio < minHora) {
            newErrors[`horario_${index}_horaInicio`] = "La hora de inicio no puede ser antes de 08:00"
          }
          if (horario.horaFin > maxHora) {
            newErrors[`horario_${index}_horaFin`] = "La hora de fin no puede ser después de 20:00"
          }
        }
      })
    }

    if (formData.estado === "cancelado" && !formData.motivo.trim()) {
      newErrors.motivo = "Debe especificar un motivo para la cancelación"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        profesorId: formData.profesorId,
        horariosPorDia: formData.horariosPorDia,
        estado: formData.estado,
        motivo: formData.estado === "cancelado" ? formData.motivo : "",
      })
      onClose()
    }
  }

  const handleClose = () => {
    setFormData({
      profesorId: "",
      estado: "activo",
      motivo: "",
      horariosPorDia: [],
    })
    setErrors({})
    setSelectedDays([])
    setDefaultTime({ horaInicio: "08:00", horaFin: "20:00" })
    onClose()
  }

  const isFormValid = formData.profesorId && formData.horariosPorDia.length > 0 && formData.horariosPorDia.every(h => h.dia && h.horaInicio && h.horaFin)

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      disableEscapeKeyDown
      closeAfterTransition
      slotProps={{
        backdrop: {
          onClick: () => {}
        }
      }}
      sx={{
        "& .MuiDialog-paper": {
          marginTop: "4rem",
          marginBottom: "2rem",
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: "12px",
          boxShadow: "0 4px 30px rgba(0,0,0,0.2)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "#0455a2",
          color: "white",
          fontWeight: 600,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarIcon />
          {isEditing ? "Editar Programación" : "Agregar Programación"}
        </Box>
        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, mt: 3 }}>
        <Grid container spacing={3}>
          {/* Selector de Profesor */}
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.profesorId}>
              <InputLabel>Profesor</InputLabel>
              <Select
                value={formData.profesorId}
                onChange={(e) => handleInputChange("profesorId", e.target.value)}
                label="Profesor"
                required
                disabled={isEditing}
              >
                <MenuItem value="">
                  <em>Seleccionar Profesor</em>
                </MenuItem>
                {profesores.map((profesor) => (
                  <MenuItem key={profesor.id} value={profesor.id}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: profesor.color || "#ccc",
                          mr: 1,
                        }}
                      />
                      {profesor.nombre}
                      {profesor.especialidad && ` - ${profesor.especialidad}`}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.profesorId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.profesorId}
                </Typography>
              )}
              {isEditing && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  No se puede cambiar el profesor en una programación existente
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Estado (solo en edición) */}
          {isEditing && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.estado}
                  onChange={(e) => handleInputChange("estado", e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="cancelado">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Motivo de cancelación */}
          {isEditing && formData.estado === "cancelado" && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motivo de cancelación"
                value={formData.motivo}
                onChange={(e) => handleInputChange("motivo", e.target.value)}
                multiline
                rows={2}
                error={!!errors.motivo}
                helperText={errors.motivo}
                required
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Configuración de Horarios
              </Typography>
            </Divider>
          </Grid>

          {/* Selección de Días */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "#0455a2" }}>
              Seleccionar Días
            </Typography>
            <Paper sx={{ 
              p: 2, 
              bgcolor: "#f8f9fa",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              minHeight: "200px"
            }}>
              <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                Haga clic en los días que desea agregar:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                {validDays.map((day) => {
                  const isSelected = selectedDays.includes(day)
                  const isExisting = formData.horariosPorDia.some(d => d.dia === day)
                  
                  return (
                    <Chip
                      key={day}
                      label={dayNames[day]}
                      onClick={() => {
                        if (isExisting) return
                        handleDaySelection(day)
                      }}
                      color={isSelected ? "primary" : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                      disabled={isExisting}
                      sx={{
                        cursor: isExisting ? "not-allowed" : "pointer",
                        opacity: isExisting ? 0.5 : 1,
                        "&:hover": {
                          backgroundColor: isSelected ? undefined : "rgba(4, 85, 162, 0.08)"
                        }
                      }}
                    />
                  )
                })}
              </Box>

              {selectedDays.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Días seleccionados: {selectedDays.map(d => dayNames[d]).join(", ")}
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addSelectedDays}
                    variant="contained"
                    size="small"
                    sx={{ textTransform: "none" }}
                  >
                    Agregar con horario por defecto
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Configuración de Horario por Defecto */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "#0455a2" }}>
              Horario por Defecto
            </Typography>
            <Paper sx={{ 
              p: 2, 
              bgcolor: "#f8f9fa",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              minHeight: "200px"
            }}>
              <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                Configure el horario que se aplicará a los días seleccionados:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Hora de Inicio</InputLabel>
                    <Select
                      label="Hora de Inicio"
                      value={defaultTime.horaInicio ? formatTo12Hour(defaultTime.horaInicio) : ''}
                      onChange={(e) => setDefaultTime(prev => ({ ...prev, horaInicio: formatTo24Hour(e.target.value) }))}
                    >
                      {hourValues.map(h => (
                        <MenuItem key={`inicio-${h}`} value={h}>{h}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Hora de Fin</InputLabel>
                    <Select
                      label="Hora de Fin"
                      value={defaultTime.horaFin ? formatTo12Hour(defaultTime.horaFin) : ''}
                      onChange={(e) => setDefaultTime(prev => ({ ...prev, horaFin: formatTo24Hour(e.target.value) }))}
                    >
                      {hourValues.map(h => (
                        <MenuItem key={`fin-${h}`} value={h}>{h}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Horarios Configurados */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "#0455a2" }}>
              Horarios Configurados
            </Typography>
            
            {errors.horariosPorDia && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.horariosPorDia}
              </Alert>
            )}

            {formData.horariosPorDia.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#f8f9fa" }}>
                <Typography color="text.secondary">
                  No hay horarios configurados. Seleccione días arriba para comenzar.
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {formData.horariosPorDia.map((horario, index) => (
                  <Paper key={index} sx={{ 
                    p: 2, 
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    bgcolor: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                  }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip 
                          label={dayNames[horario.dia]} 
                          size="small" 
                          color="primary" 
                          sx={{ fontWeight: 500, minWidth: "80px" }}
                        />
                      </Box>
                      <IconButton
                        onClick={() => removeHorario(index)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth error={!!errors[`horario_${index}_horaInicio`]}>
                          <InputLabel>Hora de Inicio</InputLabel>
                          <Select
                            label="Hora de Inicio"
                            value={horario.horaInicio ? formatTo12Hour(horario.horaInicio) : ''}
                            onChange={(e) => handleHorarioChange(index, "horaInicio", formatTo24Hour(e.target.value))}
                            required
                            startAdornment={
                              <InputAdornment position="start">
                                <TimeIcon fontSize="small" />
                              </InputAdornment>
                            }
                          >
                            {hourValues.map(h => (
                              <MenuItem key={`inicio-${h}`} value={h}>{h}</MenuItem>
                            ))}
                          </Select>
                          {errors[`horario_${index}_horaInicio`] && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                              {errors[`horario_${index}_horaInicio`]}
                            </Typography>
                          )}
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth error={!!errors[`horario_${index}_horaFin`]}>
                          <InputLabel>Hora de Fin</InputLabel>
                          <Select
                            label="Hora de Fin"
                            value={horario.horaFin ? formatTo12Hour(horario.horaFin) : ''}
                            onChange={(e) => handleHorarioChange(index, "horaFin", formatTo24Hour(e.target.value))}
                            required
                            startAdornment={
                              <InputAdornment position="start">
                                <TimeIcon fontSize="small" />
                              </InputAdornment>
                            }
                          >
                            {hourValues.map(h => (
                              <MenuItem key={`fin-${h}`} value={h}>{h}</MenuItem>
                            ))}
                          </Select>
                          {errors[`horario_${index}_horaFin`] && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                              {errors[`horario_${index}_horaFin`]}
                            </Typography>
                          )}
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: "#f9f9f9", justifyContent: "flex-end", gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 500,
            px: 3,
            borderColor: "rgba(0, 0, 0, 0.12)",
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disableElevation
          disabled={!isFormValid}
          sx={{
            backgroundColor: "#0455a2",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 500,
            px: 3,
            "&:hover": {
              backgroundColor: "#033b70",
            },
          }}
        >
          {isEditing ? "Guardar Cambios" : "Agregar Programación"}
        </Button>
      </DialogActions>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  )
}