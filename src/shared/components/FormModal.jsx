"use client"


import {
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  IconButton,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  Checkbox,
  Radio,
  RadioGroup,
  ListItemText,
  Paper,
  CircularProgress,
} from "@mui/material"
import { useState, useEffect } from "react"
import { Close as CloseIcon } from "@mui/icons-material"
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import { green } from "@mui/material/colors"


export const FormModal = ({
  title,
  subtitle,
  fields = [],
  initialData,
  open,
  onClose,
  onSubmit,
  onClearForm,
  disableBackdropClick = true,
  disableEscapeKeyDown = true,
  submitButtonText = "Guardar Cambios",
}) => {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)


  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({ ...initialData })
      } else if (fields?.length > 0) {
        const defaultData = {}
        fields.forEach((field) => {
          if (field?.id) {
            defaultData[field.id] = field.defaultValue || ""
          }
        })
        setFormData(defaultData)
      } else {
        setFormData({})
      }
      setErrors({})
    }
  }, [initialData, fields, open])


  // New function to validate a single field
  const validateField = (field, value) => {
    if (!field) return null;


    // Check required fields
    if (
      field.required &&
      (value === undefined || value === null || value === "")
    ) {
      return `${field.label || 'Campo'} es requerido`
    }


    // Check custom validation
    if (field.validate && value !== undefined && value !== null) {
      try {
        const validationError = field.validate(value, formData)
        if (validationError) {
          return validationError
        }
      } catch (error) {
        console.error('Error in field validation:', error)
        return 'Error en la validación'
      }
    }


    // Check validator (for backward compatibility)
    if (field.validator && value !== undefined && value !== null) {
      try {
        const validationError = field.validator(value)
        if (validationError) {
          return validationError
        }
      } catch (error) {
        console.error('Error in field validation:', error)
        return 'Error en la validación'
      }
    }


    return null
  }


  const handleChange = (field, value) => {
    if (!field) return;


    // First update the form data
    const updatedFormData = {
      ...formData,
      [field]: value,
    }

    setFormData(updatedFormData)


    // Find the field config from fields array
    const fieldConfig = fields?.find(f => f?.id === field)

    // If field has validateOnChange, validate it immediately
    if (fieldConfig?.validateOnChange) {
      const error = validateField(fieldConfig, value)
      setErrors(prev => ({
        ...prev,
        [field]: error
      }))
    } else if (errors[field]) {
      // Otherwise just clear any existing error
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }))
    }

    // Handle any custom onChange logic for the field
    if (fieldConfig?.onChange) {
      try {
        fieldConfig.onChange(value, updatedFormData, (fieldId, fieldValue) => {
          if (fieldId) {
            setFormData(prev => ({
              ...prev,
              [fieldId]: fieldValue
            }))
          }
        })
      } catch (error) {
        console.error('Error in onChange handler:', error)
      }
    }
  }


  const validateForm = () => {
    const newErrors = {}
    let isValid = true


    if (!fields?.length) {
      return true
    }


    fields.forEach((field) => {
      if (field?.id) {
        const error = validateField(field, formData[field.id])
        if (error) {
          newErrors[field.id] = error
          isValid = false
        }
      }
    })


    setErrors(newErrors)
    return isValid
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    try {
      if (validateForm()) {
        setLoading(true)
        if (typeof onSubmit === 'function') {
          const maybePromise = onSubmit(formData)
          if (maybePromise && typeof maybePromise.then === 'function') {
            await maybePromise
          }
        } else {
          console.error('onSubmit is not a function')
        }
      }
    } catch (error) {
      console.error('Error in form submission:', error)
    } finally {
      setLoading(false)
    }
  }


  const renderField = (field) => {
    if (!field || !field.id || !field.type) return null;
    switch (field.type) {
      case "switch":
        return (
          <Box key={field.id} sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!formData[field.id]}
                  onChange={(e) => handleChange(field.id, e.target.checked)}
                  color="primary"
                />
              }
              label={field.label}
              sx={{
                width: "100%",
                ml: 0,
                "& .MuiFormControlLabel-label": {
                  flex: 1,
                  fontWeight: 500,
                },
              }}
            />
            {errors[field.id] && <FormHelperText error>{errors[field.id]}</FormHelperText>}
          </Box>
        )


      case "select":
        return (
          <Box key={field.id} sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
              {field.label}
            </Typography>
            <FormControl fullWidth variant="outlined" error={!!errors[field.id]}>
              <Select
                value={formData[field.id] || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                displayEmpty
                disabled={field.disabled}
                sx={{
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: errors[field.id] ? "error.main" : "rgba(0, 0, 0, 0.23)",
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <Typography color="text.secondary">Seleccionar {field.label}</Typography>
                </MenuItem>
                {field.options?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors[field.id] && <FormHelperText>{errors[field.id]}</FormHelperText>}
            </FormControl>
          </Box>
        )


      case "multiSelect":
        return (
          <Box key={field.id} sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
              {field.label}
            </Typography>
            <FormControl fullWidth variant="outlined" error={!!errors[field.id]}>
              <Select
                multiple
                value={Array.isArray(formData[field.id]) ? formData[field.id] : []}
                onChange={(e) => handleChange(field.id, e.target.value)}
                renderValue={(selected) => selected.join(", ")}
                disabled={field.disabled}
              >
                {field.options?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Checkbox
                      checked={Array.isArray(formData[field.id]) && formData[field.id].indexOf(option.value) > -1}
                    />
                    <ListItemText primary={option.label} />
                  </MenuItem>
                ))}
              </Select>
              {errors[field.id] && <FormHelperText>{errors[field.id]}</FormHelperText>}
            </FormControl>
          </Box>
        )


      case "checkbox":
        return (
          <Box key={field.id} sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!formData[field.id]}
                  onChange={(e) => handleChange(field.id, e.target.checked)}
                  color="primary"
                  disabled={field.disabled}
                />
              }
              label={field.label}
              sx={{
                width: "100%",
                ml: 0,
                "& .MuiFormControlLabel-label": {
                  flex: 1,
                  fontWeight: 500,
                },
              }}
            />
            {errors[field.id] && <FormHelperText error>{errors[field.id]}</FormHelperText>}
          </Box>
        )


      case "radio":
        return (
          <Box key={field.id} sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
              {field.label}
            </Typography>
            <FormControl fullWidth error={!!errors[field.id]}>
              <RadioGroup value={formData[field.id] || ""} onChange={(e) => handleChange(field.id, e.target.value)}>
                {field.options?.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio color="primary" disabled={field.disabled} />}
                    label={option.label}
                  />
                ))}
              </RadioGroup>
              {errors[field.id] && <FormHelperText>{errors[field.id]}</FormHelperText>}
            </FormControl>
          </Box>
        )


      case "password":
        return (
          <Box key={field.id} sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
              {field.label}
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="password"
              value={formData[field.id] || ""}
              onChange={(e) => handleChange(field.id, e.target.value)}
              variant="outlined"
              placeholder={field.placeholder || ""}
              error={!!errors[field.id]}
              helperText={errors[field.id] || (typeof field.helperText === 'function' ? field.helperText(formData) : field.helperText)}
              disabled={field.disabled}
              InputProps={{
                inputProps: {
                  maxLength: field.maxLength || undefined,
                },
                sx: {
                  borderRadius: "8px",
                },
              }}
            />
          </Box>
        )


      case "permissionsTable":
        return (
          <Box key={field.id}>
            <Typography sx={{
              mb: 0.5,
              color: '#666',
              fontSize: '0.75rem',
              textDecoration: 'none'
            }}>
              {field.section}
            </Typography>
            <TableContainer
              component={Paper}
              sx={{
                mt: 0.5,
                '& .MuiTableCell-root': {
                  padding: '1px 2px',
                  fontSize: '0.75rem',
                  height: '24px',
                  lineHeight: '1'
                },
                '& .MuiCheckbox-root': {
                  padding: '1px',
                  '& .MuiSvgIcon-root': {
                    fontSize: '18px'
                  }
                }
              }}
            >
              <Table size="small" sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Módulo</TableCell>
                    <TableCell align="center" sx={{ width: '60px' }}>Visualizar</TableCell>
                    <TableCell align="center" sx={{ width: '60px' }}>Crear</TableCell>
                    <TableCell align="center" sx={{ width: '60px' }}>Editar</TableCell>
                    <TableCell align="center" sx={{ width: '60px' }}>Eliminar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {field.modules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{module.label}</TableCell>
                      {['visualizar', 'crear', 'editar', 'eliminar'].map((action) => (
                        <TableCell key={`${module.id}-${action}`} align="center">
                          <Checkbox
                            size="small"
                            checked={formData[`${module.id}-${action}`] || false}
                            onChange={(e) => handleChange(`${module.id}-${action}`, e.target.checked)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )


      case "custom":
        return (
          <Box key={field.id} sx={{ mb: 2 }}>
            {field.render ? field.render(formData[field.id], (value) => handleChange(field.id, value), formData) : null}
            {errors[field.id] && <FormHelperText error>{errors[field.id]}</FormHelperText>}
          </Box>
        )


      default:
        return (
          <Box key={field.id} sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
              {field.label}
            </Typography>
            <TextField
              fullWidth
              size="small"
              type={field.type || "text"}
              value={formData[field.id] || ""}
              onChange={(e) => handleChange(field.id, e.target.value)}
              variant="outlined"
              placeholder={field.placeholder || ""}
              error={!!errors[field.id]}
              helperText={errors[field.id] || (typeof field.helperText === 'function' ? field.helperText(formData) : field.helperText)}
              multiline={field.multiline}
              rows={field.rows || 1}
              disabled={field.disabled}
              sx={{
                ...(field.sx || {}),
                '& .MuiInputBase-root': field.multiline ? {
                  height: 'auto !important',
                  '& textarea': {
                    whiteSpace: 'normal',
                    height: 'auto !important',
                    minHeight: `${field.rows * 24}px !important`
                  },
                  '& .MuiInputBase-input::placeholder': {
                    whiteSpace: 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                } : {}
              }}
              InputProps={{
                inputProps: {
                  min: field.min,
                  max: field.max,
                  maxLength: field.maxLength || undefined,
                  style: {}
                },
                sx: {
                  borderRadius: "8px",
                },
              }}
            />
          </Box>
        )
    }
  }


  // Agrupar campos por secciones si están definidas
  const groupedFields = fields?.reduce((acc, field) => {
    const section = field?.section || "default"
    if (!acc[section]) {
      acc[section] = []
    }
    acc[section].push(field)
    return acc
  }, {}) || { default: [] }


  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (disableBackdropClick && reason === 'backdropClick') {
          return
        }
        if (disableEscapeKeyDown && reason === 'escapeKeyDown') {
          return
        }
        if (typeof onClose === 'function') {
          onClose()
        }
      }}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={disableEscapeKeyDown}
      PaperProps={{
        sx: {
          borderRadius: "8px",
          maxHeight: '90vh',
          '& .MuiDialogContent-root': {
            overflowX: 'hidden'
          }
        },
      }}
    >
      <Box
        sx={{
          bgcolor: "#0455a2",
          color: "white",
          p: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "white", p: 0.5 }}>
          <CloseIcon />
        </IconButton>
      </Box>


      <form onSubmit={handleSubmit}>
        <DialogContent
          sx={{
            p: 1,
            '& .MuiBox-root': { mb: 0.75 },
            '& .MuiTypography-root': {
              fontSize: '0.75rem',
              color: '#555',
              mb: 0.25,
              fontWeight: 500
            },
            '& .MuiFormControl-root': {
              mb: 0.5,
              '& .MuiInputBase-root': {
                minHeight: '30px',
                fontSize: '0.75rem'
              }
            },
            '& .MuiTextField-root': {
              '& .MuiInputBase-root': {
                height: '30px',
                fontSize: '0.75rem',
                '&.MuiInputBase-multiline': {
                  height: 'auto !important'
                }
              }
            },
            '& .MuiSelect-select': {
              height: '30px !important',
              minHeight: '30px !important',
              fontSize: '0.75rem',
              padding: '2px 8px'
            },
            '& .MuiFormControlLabel-root': {
              marginLeft: 0,
              marginRight: 0,
              minHeight: '30px'
            },
            '& .MuiFormControlLabel-label': {
              fontSize: '0.75rem'
            },
            '& .MuiFormHelperText-root': {
              marginTop: 0,
              fontSize: '0.7rem'
            }
          }}
        >
          <Grid container spacing={1}>
            {fields
              ?.filter(field => field?.id !== 'programacion')
              .map((field) => (
                <Grid item xs={12} sm={field?.fullWidth ? 12 : 6} key={field?.id}>
                  {renderField(field)}
                </Grid>
              ))}
          </Grid>
        </DialogContent>


        <DialogActions sx={{ p: 1, bgcolor: "#f5f5f5", gap: 1 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: "4px",
              px: 2,
              py: 0.5,
              fontSize: '0.875rem',
              minHeight: '30px'
            }}
          >
            Cancelar
          </Button>
          {onClearForm && (
            <Button
              onClick={onClearForm}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: "4px",
                px: 2,
                py: 0.5,
                fontSize: '0.875rem',
                minHeight: '30px',
                color: '#f44336',
                borderColor: '#f44336',
                '&:hover': {
                  borderColor: '#d32f2f',
                  backgroundColor: 'rgba(244, 67, 54, 0.04)'
                }
              }}
            >
              Limpiar
            </Button>
          )}
          {initialData && initialData._id && title && title.includes('Usuario') && (
            <Button
              onClick={() => onClose('assignRoles')}
              variant="contained"
              size="small"
              sx={{
                borderRadius: "4px",
                px: 2,
                py: 0.5,
                fontSize: '0.875rem',
                bgcolor: "#0455a2",
                minHeight: '30px'
              }}
            >
              Asignar Roles
            </Button>
          )}
          <Box sx={{ m: 0.5, position: 'relative' }}>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={loading}
              sx={{
                borderRadius: "4px",
                px: 2,
                py: 0.5,
                fontSize: '0.875rem',
                bgcolor: "#0455a2",
                minHeight: '30px'
              }}
            >
              {submitButtonText}
            </Button>
            {loading && (
              <CircularProgress
                size={24}
                sx={{
                  color: green[500],
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                  zIndex: 1,
                }}
              />
            )}
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}