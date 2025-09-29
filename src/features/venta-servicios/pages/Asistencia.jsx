"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Box, 
  Paper, 
  Alert, 
  Snackbar, 
  Chip, 
  Tabs, 
  Tab, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  alpha,
  useTheme,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material"
import { 
  CalendarMonth as CalendarIcon,
  Assignment as AssignmentIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Today as TodayIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  CancelOutlined as CancelOutlinedIcon,
  HelpOutline as HelpOutlineIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  CalendarMonth as CalendarMonthIcon,
  EmojiEvents as EmojiEventsIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon
} from "@mui/icons-material"
import { GenericList } from "../../../shared/components/GenericList"
import { DetailModal } from "../../../shared/components/DetailModal"
import { StatusButton } from "../../../shared/components/StatusButton"
import axios from "axios"
import moment from "moment"
import "moment/locale/es"
import useAlert from "../../../shared/hooks/useAlert"

moment.locale("es")

// Función para convertir hora de 24h a 12h con AM/PM
const formatTo12Hour = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Horarios válidos (45 min) para filtrar clases/asistencias
const hourValues24 = [
  "08:00", "08:45", "09:30", "10:15", "11:00", "11:45", "12:30", "13:15",
  "14:00", "14:45", "15:30", "16:15", "17:00", "17:45", "18:30", "19:15", "20:00"
]

const isValidSlot45 = (inicio, fin) => {
  if (!inicio || !fin) return false
  const startIdx = hourValues24.indexOf(inicio)
  const endIdx = hourValues24.indexOf(fin)
  // Debe existir y ser consecutivo (duración 45 min)
  return startIdx !== -1 && endIdx !== -1 && endIdx - startIdx === 1
}


const ESTADOS_VALIDOS = {
  asistio: { label: "Asistió", color: "success", icon: CheckCircleIcon },
  no_asistio: { label: "No Asistió", color: "error", icon: CancelIcon },
  pendiente: { label: "Pendiente", color: "warning", icon: ScheduleIcon }
}

const Asistencia = () => {
  const theme = useTheme()
  const { showSuccess, showError, showInfo } = useAlert()
  const [activeTab, setActiveTab] = useState(0)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedAsistencia, setSelectedAsistencia] = useState(null)
  const [loading, setLoading] = useState(true)
  const [asistencias, setAsistencias] = useState([])
  const [clasesDelDia, setClasesDelDia] = useState([])
  
  // Estados para el registro de asistencias
  const [asistenciasData, setAsistenciasData] = useState({})
  const [guardandoAsistencias, setGuardandoAsistencias] = useState(false)
  
  // Estados adicionales
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstado, setFilterEstado] = useState("")
  const [selectedEstudiante, setSelectedEstudiante] = useState(null)
  const [estudianteDetailOpen, setEstudianteDetailOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    fetchData()
    fetchNotifications()
  }, [])

  useEffect(() => {
    fetchClasesDelDia()
    // Refrescar asistencias existentes para la fecha actual
    fetchData()
  }, [])

    const fetchData = async () => {
      try {
        setLoading(true)
        const asistenciasResponse = await axios.get("https://apiwebmga.onrender.com/api/asistencias")
        setAsistencias(asistenciasResponse.data)
      } catch (error) {
      console.error("Error al cargar los datos:", error)
      showError("Error al cargar los datos. Por favor, recarga la página.")
      } finally {
        setLoading(false)
      }
    }

  const fetchClasesDelDia = async () => {
    try {
      // Mapeo de días de la semana a códigos en español
      const diasSemana = {
        'Monday': 'L',
        'Tuesday': 'M', 
        'Wednesday': 'X',
        'Thursday': 'J',
        'Friday': 'V',
        'Saturday': 'S',
        'Sunday': 'D'
      }
      
      const diaActualIngles = moment().format('dddd') // Monday, Tuesday, etc.
      const diaActual = diasSemana[diaActualIngles] // L, M, X, J, V, S, D
      
      console.log('=== FETCH CLASES DEL DÍA ===')
      console.log('Día en inglés:', diaActualIngles)
      console.log('Día en español:', diaActual)
      
      // Cargar todas las clases igual que en ProgramacionClases.jsx
      const response = await axios.get('https://apiwebmga.onrender.com/api/programacion_de_clases')
      console.log('Todas las clases de la API:', response.data)
      
      // Procesar clases igual que en ProgramacionClases.jsx
      const clasesProcessed = response.data
        .filter((clase) => {
          const pasaFiltro = (
            clase.especialidad &&
            clase.especialidad.trim() !== "" &&
            clase.beneficiarios?.length > 0 &&
            clase.programacionProfesor?.profesor &&
            clase.estado !== "reprogramada" &&
            clase.estado !== "ejecutada"
          )
          return pasaFiltro
        })
        .map((clase) => {
          const profesor = clase.programacionProfesor?.profesor
          const aula = clase.aula

          // USAR DIRECTAMENTE LOS OBJETOS DE VENTA QUE YA VIENEN EN beneficiarios
          const todosLosEstudiantes = (clase.beneficiarios || []).map(venta => {
            if (!venta || !venta.beneficiarioId) {
              return {
                id: venta?._id || 'N/A',
                nombre: 'Sin beneficiario',
                tipo: 'Beneficiario',
                codigoVenta: venta?.codigoVenta || '-',
                curso: (typeof venta?.cursoId === 'object' ? venta?.cursoId?.nombre : venta?.cursoId) || '-'
              }
            }
            const b = venta.beneficiarioId
            return {
              id: venta._id,
              nombre: `${b.nombre || ''} ${b.apellido || ''}`.trim() || 'Sin nombre',
              numero_de_documento: b.numero_de_documento || b.documento || b.cedula || b.dni || b.numeroDocumento || b.cedula_identidad || b.cedula_ciudadania || b.cedula_extranjeria || b.pasaporte || b.tarjeta_identidad || "-",
              tipo: 'Beneficiario',
              codigoVenta: venta.codigoVenta || '-',
              curso: (typeof venta.cursoId === 'object' ? venta.cursoId?.nombre : venta.cursoId) || '-'
            }
          })

          return {
            id: clase._id,
            dia: clase.dia, // L, M, X, J, V, S, D
            horaInicio: clase.horaInicio,
            horaFin: clase.horaFin,
            especialidad: clase.especialidad,
            profesor: profesor || null,
            aula: aula?.numeroAula || "Sin aula",
            beneficiarios: todosLosEstudiantes,
            totalBeneficiarios: todosLosEstudiantes.length,
            estado: clase.estado,
            fecha: clase.fecha,
            observaciones: clase.observaciones,
            motivo: clase.motivo,
            original: clase,
          }
        })
      
      // Filtrar por día de la semana actual y horarios válidos de 45 minutos
      const clasesDelDiaSemana = clasesProcessed.filter(clase => {
        const esMismoDia = clase.dia === diaActual
        const esHorarioValido = isValidSlot45(clase.horaInicio, clase.horaFin)
        
        console.log(`Clase: ${clase.id} - Día: ${clase.dia} - Es ${diaActual}: ${esMismoDia} - Horario válido: ${esHorarioValido}`)
        if (esMismoDia) {
          console.log(`  → Hora inicio: ${clase.horaInicio}, Hora fin: ${clase.horaFin}`)
        }
        
        return esMismoDia && esHorarioValido
      })
      
      console.log('Clases del día de la semana:', clasesDelDiaSemana)
      setClasesDelDia(clasesDelDiaSemana)
    } catch (error) {
      console.error("Error al cargar clases del día:", error)
      showError("Error al cargar las clases del día.")
    }
  }

  const fetchNotifications = async () => {
    // Simular notificaciones
    setNotifications([
      { id: 1, message: "5 estudiantes faltaron a clases hoy", type: "warning", time: "10:30 AM" },
      { id: 2, message: "Nueva asistencia registrada", type: "info", time: "11:15 AM" },
      { id: 3, message: "Reporte mensual generado", type: "success", time: "12:00 PM" }
    ])
  }

  // Obtener asistencias de la fecha seleccionada
  const asistenciasDelDia = useMemo(() => {
    return asistencias.filter(a => {
      const fechaRef = a.programacionClaseId?.fecha || a.createdAt
      const horaInicio = a.programacionClaseId?.horaInicio
      const horaFin = a.programacionClaseId?.horaFin
      const sameDay = moment(fechaRef).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
      const validHour = isValidSlot45(horaInicio, horaFin)
      return sameDay && validHour
    })
  }, [asistencias])

  // Crear lista de estudiantes con clases para el GenericList
  const estudiantesConClases = useMemo(() => {
    const lista = [];
    
    clasesDelDia.forEach((clase) => {
      if (clase.beneficiarios) {
        clase.beneficiarios.forEach((estudiante) => {
          const rowId = `${estudiante.id}-${clase.id}`;
          
          // Verificar si ya existe asistencia registrada
          const asistenciaExistente = asistenciasDelDia.find(a => 
            a.ventaId?._id === estudiante.id && 
            a.programacionClaseId?._id === clase.id
          );

          // Solo agregar si NO tiene asistencia registrada Y NO está en asistenciasData
          if (!asistenciaExistente && !asistenciasData[rowId]?.guardado) {
            lista.push({
              id: rowId,
              estudiante: estudiante,
              ventaId: estudiante.id,
              clase: clase,
              asistencia: null,
              asistio: asistenciasData[rowId]?.asistio ?? false,
              estado: 'pendiente',
              yaRegistrado: false,
              motivo: asistenciasData[rowId]?.motivo ?? ""
            });
          }
        });
      }
    });
    
    return lista;
  }, [clasesDelDia, asistenciasDelDia, asistenciasData])

  // Estadísticas del día
  const estadisticasDelDia = useMemo(() => {
    const clasesHoy = clasesDelDia.length || 0
    
    // Total de estudiantes (pendientes + registrados)
    const totalEstudiantes = estudiantesConClases.length + asistenciasDelDia.length || 0
    
    // Asistencias registradas
    const asistieron = asistenciasDelDia.filter(a => a.estado === 'asistio').length || 0
    const faltaron = asistenciasDelDia.filter(a => a.estado === 'no_asistio').length || 0
    
    // Pendientes son los que están en estudiantesConClases
    const pendientes = estudiantesConClases.length || 0
    
    // Calcular porcentaje solo sobre asistencias registradas
    const registrados = asistieron + faltaron
    const porcentajeAsistencia = registrados > 0 
      ? Math.round((asistieron / registrados) * 100) 
      : 0

    return {
      clasesHoy,
      totalEstudiantes,
      asistieron,
      faltaron,
      pendientes,
      porcentajeAsistencia
    }
  }, [clasesDelDia, estudiantesConClases.length, asistenciasDelDia])

  // Agrupar asistencias por curso, profesor, beneficiario y horario para el historial
  const asistenciasAgrupadas = useMemo(() => {
    const grupos = {}
    asistencias.forEach(asistencia => {
      if (!asistencia.ventaId || !asistencia.programacionClaseId) return
      
      const horaInicio = asistencia.programacionClaseId.horaInicio
      const horaFin = asistencia.programacionClaseId.horaFin
      
      // Solo incluir asistencias de horarios de 45 minutos
      if (!isValidSlot45(horaInicio, horaFin)) return
      
      const ventaId = asistencia.ventaId._id
      const beneficiarioId = asistencia.ventaId.beneficiarioId?._id
      const cursoId = asistencia.ventaId.cursoId?._id || asistencia.ventaId.cursoId
      const profesorId = asistencia.programacionClaseId.programacionProfesor?.profesor?._id
      
      // Usar la misma lógica que en el registro del día
      const beneficiario = asistencia.ventaId?.beneficiarioId || asistencia.ventaId
      
      // Crear clave única para agrupar
      const clave = `${ventaId}-${beneficiarioId}-${cursoId}-${profesorId}-${horaInicio}-${horaFin}`
      if (!grupos[clave]) {
        grupos[clave] = {
          ventaId: asistencia.ventaId,
          beneficiario: beneficiario,
          curso: asistencia.ventaId.cursoId,
          profesor: asistencia.programacionClaseId.programacionProfesor?.profesor,
          horaInicio,
          horaFin,
          especialidad: asistencia.programacionClaseId.especialidad,
          fecha: asistencia.programacionClaseId.fecha,
          asistencias: []
        }
      }
      grupos[clave].asistencias.push(asistencia)
    })
    return Object.values(grupos)
  }, [asistencias])

  // Generar reporte mensual
  const reporteMensual = useMemo(() => {
    const mesActual = moment().format('YYYY-MM')
    const asistenciasDelMes = asistencias.filter(a => {
      const fecha = a.programacionClaseId?.fecha || a.createdAt
      const horaInicio = a.programacionClaseId?.horaInicio
      const horaFin = a.programacionClaseId?.horaFin
      const sameMonth = moment(fecha).format('YYYY-MM') === mesActual
      const validHour = isValidSlot45(horaInicio, horaFin)
      return sameMonth && validHour
    })

    const totalAsistencias = asistenciasDelMes.length
    const asistieron = asistenciasDelMes.filter(a => a.estado === 'asistio').length
    const faltaron = asistenciasDelMes.filter(a => a.estado === 'no_asistio').length

    // Calcular porcentaje solo sobre asistencias registradas
    const porcentajeAsistencia = totalAsistencias > 0 
      ? Math.round((asistieron / totalAsistencias) * 100) 
      : 0

    // Estudiantes únicos
    const estudiantesUnicos = new Set(
      asistenciasDelMes
        .filter(a => a.ventaId?.beneficiarioId?._id)
        .map(a => a.ventaId.beneficiarioId._id)
    )

    return {
      totalAsistencias,
      asistieron,
      faltaron,
      totalEstudiantes: estudiantesUnicos.size,
      porcentajeAsistencia,
      tendencia: 'neutral' // Puedes mantener la lógica de tendencia existente
    }
  }, [asistencias])

  const renderEstado = (value) => {
    const estado = ESTADOS_VALIDOS[value]
    if (!estado) return value
    
    const IconComponent = estado.icon
    return (
      <Chip
        icon={<IconComponent />}
        label={estado.label}
        color={estado.color}
        size="small"
        variant="outlined"
      />
    )
  }

  // Columnas para el GenericList del registro de asistencias
  const columnsRegistro = [
    {
      id: "estudiante",
      label: "Estudiante",
      render: (value, row) => {
        // Buscar documento en todos los campos posibles
        const doc = row.estudiante?.numero_de_documento || row.estudiante?.documento || row.estudiante?.cedula || row.estudiante?.dni || row.estudiante?.numeroDocumento || row.estudiante?.cedula_identidad || row.estudiante?.cedula_ciudadania || row.estudiante?.cedula_extranjeria || row.estudiante?.pasaporte || row.estudiante?.tarjeta_identidad || "-"
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {row.estudiante?.nombre || 'Sin nombre'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {doc}
            </Typography>
          </Box>
        )
      }
    },
    {
      id: "clase",
      label: "Clase",
      render: (value, row) => (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            {row.clase.especialidad}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTo12Hour(row.clase.horaInicio)} - {formatTo12Hour(row.clase.horaFin)}
          </Typography>
        </Box>
      )
    },
    {
      id: "profesor",
      label: "Profesor",
      render: (value, row) => {
        const prof = row.clase?.profesor
        const nombreProf = prof ? `${prof.nombres || ''} ${prof.apellidos || ''}`.trim() : "-"
        return (
          <Typography variant="body2">
            {nombreProf || "-"}
          </Typography>
        )
      }
    },
    {
      id: "asistenciaEstado",
      label: "Estado",
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {(() => { const checked = (asistenciasData[row.id]?.asistio ?? row.asistio) === true; return (
          <Switch
            checked={checked}
            onChange={(e) => {
              setAsistenciasData(prev => ({
                ...prev,
                [row.id]: {
                  asistio: e.target.checked,
                  ventaId: row.ventaId,
                  programacionClaseId: row.clase.id, // Asegurarse de incluir el ID de la clase
                  motivo: prev[row.id]?.motivo || ''
                }
              }))
            }}
            color="success"
          />
          )})()}
          <Typography variant="body2" sx={{ 
            fontWeight: 'bold',
            color: (asistenciasData[row.id]?.asistio ?? row.asistio) ? theme.palette.success.main : theme.palette.error.main
          }}>
            {(asistenciasData[row.id]?.asistio ?? row.asistio) ? 'Asistió' : 'No Asistió'}
          </Typography>
          {!(asistenciasData[row.id]?.asistio ?? row.asistio) && (
            <TextField
              placeholder="Motivo de inasistencia"
              size="small"
              value={asistenciasData[row.id]?.motivo || ''}
              onChange={(e) => {
                const val = e.target.value
                setAsistenciasData(prev => ({
                  ...prev,
                  [row.id]: {
                    ...prev[row.id],
                    ventaId: row.ventaId,
                    programacionClaseId: row.clase.id,
                    motivo: val,
                    asistio: false
                  }
                }))
              }}
              sx={{ ml: 1, minWidth: 220 }}
            />
          )}
        </Box>
      )
    }
  ]

  // Columnas para el historial
  const columnsHistorial = [
    {
      id: "beneficiario",
      label: "Beneficiario",
      render: (value, row) => {
        if (!row.beneficiario) return "Sin beneficiario"
        return (
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {`${row.beneficiario.nombre || ''} ${row.beneficiario.apellido || ''}`.trim() || "Sin nombre"}
          </Typography>
        )
      }
    },
    {
      id: "curso",
      label: "Curso",
      render: (value, row) => {
        if (!row.curso) return "-"
        return (
          <Chip 
            label={typeof row.curso === 'object' ? row.curso.nombre : row.curso}
            color="primary"
            variant="outlined"
            size="small"
          />
        )
      }
    },
    {
      id: "profesor",
      label: "Profesor",
      render: (value, row) => {
        if (!row.profesor) return "Sin profesor"
        return `${row.profesor.nombres || ''} ${row.profesor.apellidos || ''}`.trim() || "Sin nombre"
      }
    },
    {
      id: "horario",
      label: "Horario",
      render: (value, row) => (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {formatTo12Hour(row.horaInicio)} - {formatTo12Hour(row.horaFin)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {moment(row.fecha).format('DD/MM/YYYY')}
          </Typography>
        </Box>
      )
    },
    {
      id: "asistidas",
      label: "Asistidas",
      render: (value, row) => {
        const asistidas = row.asistencias.filter(a => a.estado === 'asistio').length
        return (
          <Badge badgeContent={asistidas} color="success">
            <CheckCircleIcon color="success" />
          </Badge>
        )
      }
    },
    {
      id: "faltas",
      label: "Faltas",
      render: (value, row) => {
        const faltas = row.asistencias.filter(a => a.estado === 'no_asistio').length
        return (
          <Badge badgeContent={faltas} color="error">
            <CancelIcon color="error" />
          </Badge>
        )
      }
    }
  ]

  const detailFields = [
    {
      id: "beneficiario",
      label: "Beneficiario",
      render: (value, row) => {
        if (!row.beneficiario) return "Sin beneficiario"
        return `${row.beneficiario.nombre || ''} ${row.beneficiario.apellido || ''}`.trim() || "Sin nombre"
      }
    },
    {
      id: "codigoVenta",
      label: "Código Venta",
      render: (value, row) => row.ventaId?.codigoVenta || "-"
    },
    {
      id: "curso",
      label: "Curso",
      render: (value, row) => {
        if (!row.curso) return "-"
        return typeof row.curso === 'object' ? row.curso.nombre : row.curso
      }
    },
    {
      id: "profesor",
      label: "Profesor",
      render: (value, row) => {
        if (!row.profesor) return "Sin profesor"
        return `${row.profesor.nombres || ''} ${row.profesor.apellidos || ''}`.trim() || "Sin nombre"
      }
    },
    {
      id: "horario",
      label: "Horario",
      render: (value, row) => `${formatTo12Hour(row.horaInicio)} - ${formatTo12Hour(row.horaFin)}`
    },
    {
      id: "especialidad",
      label: "Especialidad",
      render: (value, row) => row.especialidad || "-"
    },
    {
      id: "historial",
      label: "Historial de Asistencias",
      render: (value, row) => {
        if (row.asistencias.length === 0) return "Sin registros"
        const asistenciasOrdenadas = row.asistencias
          .sort((a, b) => new Date(b.programacionClaseId?.fecha || b.createdAt) - new Date(a.programacionClaseId?.fecha || a.createdAt))
        return (
          <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
            {asistenciasOrdenadas.map((asistencia, index) => {
              const fecha = asistencia.programacionClaseId?.fecha || asistencia.createdAt
              return (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1,
                  mb: 0.5,
                  border: 1,
                  borderRadius: 1,
                  bgcolor: asistencia.estado === 'asistio' ? '#f1f8e9' : '#ffebee'
                }}>
                  <span>{fecha ? moment(fecha).format("DD/MM/YYYY") : "-"}</span>
                  {renderEstado(asistencia.estado)}
                  {asistencia.motivo && (
                    <span style={{ fontSize: 12, color: '#888' }}>Motivo: {asistencia.motivo}</span>
                  )}
                </Box>
              )
            })}
          </Box>
        )
      }
    }
  ]

  const handleViewAsistencia = (grupo) => {
    setSelectedAsistencia(grupo)
    setDetailModalOpen(true)
  }

  const handleSaveAttendance = async () => {
    try {
      setGuardandoAsistencias(true);
      
      const asistenciasPorClase = {};
      
      Object.entries(asistenciasData).forEach(([key, data]) => {
        const [ventaId, claseId] = key.split('-');
        
        if (!asistenciasPorClase[claseId]) {
          asistenciasPorClase[claseId] = [];
        }

        asistenciasPorClase[claseId].push({
          ventaId: ventaId,
          estado: data.asistio ? 'asistio' : 'no_asistio',
          motivo: data.motivo || null,
          programacionClaseId: claseId
        });
      });

      if (Object.keys(asistenciasPorClase).length === 0) {
        throw new Error('No hay asistencias para guardar');
      }

      // Enviar asistencias y actualizar estado local
      await Promise.all(
        Object.entries(asistenciasPorClase).map(async ([claseId, asistencias]) => {
          if (!claseId) {
            console.error('ID de clase indefinido:', claseId);
            return;
          }

          const response = await axios.put(
            `https://apiwebmga.onrender.com/api/asistencias/programacion/${claseId}/bulk`,
            { asistencias }
          );

          // Marcar asistencias como guardadas en el estado local
          asistencias.forEach(asistencia => {
            const rowId = `${asistencia.ventaId}-${asistencia.programacionClaseId}`;
            setAsistenciasData(prev => ({
              ...prev,
              [rowId]: {
                ...prev[rowId],
                guardado: true
              }
            }));
          });

          return response;
        })
      );

      // Recargar datos inmediatamente
      await Promise.all([
        fetchData(),
        fetchClasesDelDia()
      ]);

      // Limpiar solo las asistencias guardadas
      setAsistenciasData(prev => {
        const newData = {};
        Object.entries(prev).forEach(([key, value]) => {
          if (!value.guardado) {
            newData[key] = value;
          }
        });
        return newData;
      });
      
      showSuccess("Asistencias registradas correctamente");

    } catch (error) {
      console.error("Error al guardar asistencias:", error);
      showError(error.message || "Error al registrar asistencias. Por favor, inténtalo de nuevo.");
    } finally {
      setGuardandoAsistencias(false);
    }
  }

  // Agregar useEffect para recargar datos periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (!guardandoAsistencias) {
        fetchData();
        fetchClasesDelDia();
      }
    }, 30000); // Recargar cada 30 segundos

    return () => clearInterval(interval);
  }, [guardandoAsistencias])

  const renderRegistroAsistencias = () => {
    return (
      <Box sx={{ p: 3 }}>
        {/* Header con estadísticas del día */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TodayIcon color="primary" />
            Registro de Asistencias - {moment().format('DD/MM/YYYY')}
          </Typography>
          

          {/* Estadísticas del día */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={2}>
              <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), textAlign: 'center' }}>
                <CardContent>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {estadisticasDelDia.clasesHoy}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clases Hoy
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), textAlign: 'center' }}>
                <CardContent>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                    {estadisticasDelDia.totalEstudiantes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Estudiantes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), textAlign: 'center' }}>
                <CardContent>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {estadisticasDelDia.asistieron}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Asistieron
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), textAlign: 'center' }}>
                <CardContent>
                  <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                    {estadisticasDelDia.faltaron}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Faltaron
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), textAlign: 'center' }}>
                <CardContent>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {estadisticasDelDia.pendientes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendientes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Card sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), textAlign: 'center' }}>
                <CardContent>
                  <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                    {estadisticasDelDia.porcentajeAsistencia}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    % Asistencia
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* GenericList para el registro de asistencias */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Estudiantes del Día ({estudiantesConClases.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveAttendance}
                disabled={guardandoAsistencias || Object.keys(asistenciasData).length === 0}
                sx={{ bgcolor: theme.palette.success.main }}
              >
                {guardandoAsistencias ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </Box>
          </Box>
          
          <GenericList
            data={estudiantesConClases}
            columns={columnsRegistro}
            title=""
            showActions={false}
            showViewButton={false}
            loading={loading}
            customSearch={(row, searchTerm) => {
              const estudiante = row.estudiante
              const clase = row.clase
              const profesor = clase.profesor
              
              const searchText = `${estudiante.nombre} ${estudiante.apellido} ${estudiante.numero_de_documento} ${clase.especialidad} ${profesor?.nombres} ${profesor?.apellidos}`.toLowerCase()
              return searchText.includes(searchTerm.toLowerCase())
            }}
          />
        </Paper>
      </Box>
    )
  }

  // Calcular estadísticas adicionales para el reporte mensual
  const estadisticasAdicionales = useMemo(() => {
    const asistenciasDelMes = asistencias.filter(a => {
      const fecha = a.programacionClaseId?.fecha || a.createdAt
      const horaInicio = a.programacionClaseId?.horaInicio
      const horaFin = a.programacionClaseId?.horaFin
      const sameMonth = moment(fecha).format('YYYY-MM') === moment().format('YYYY-MM')
      const validHour = isValidSlot45(horaInicio, horaFin)
      return sameMonth && validHour
    })

    // Estadísticas por día de la semana
    const porDiaSemana = {}
    asistenciasDelMes.forEach(a => {
      const fecha = a.programacionClaseId?.fecha || a.createdAt
      const dia = moment(fecha).format('dddd')
      if (!porDiaSemana[dia]) {
        porDiaSemana[dia] = { total: 0, asistieron: 0 }
      }
      porDiaSemana[dia].total++
      if (a.estado === 'asistio') porDiaSemana[dia].asistieron++
    })

    // Top 5 estudiantes con mejor asistencia
    const estudiantesStats = {}
    asistenciasDelMes.forEach(a => {
      const estudianteId = a.ventaId?._id
      // Usar la misma lógica que en el registro del día
      const beneficiario = a.ventaId?.beneficiarioId || a.ventaId
      
      if (!estudiantesStats[estudianteId]) {
        estudiantesStats[estudianteId] = {
          nombre: `${beneficiario?.nombre || ''} ${beneficiario?.apellido || ''}`.trim(),
          total: 0,
          asistieron: 0
        }
      }
      estudiantesStats[estudianteId].total++
      if (a.estado === 'asistio') estudiantesStats[estudianteId].asistieron++
    })

    const topEstudiantes = Object.values(estudiantesStats)
      .filter(e => e.total >= 3) // Solo estudiantes con al menos 3 clases
      .map(e => ({
        ...e,
        porcentaje: Math.round((e.asistieron / e.total) * 100)
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje)
      .slice(0, 5)

    // Debug: ver qué está pasando con el Top 5
    console.log('=== DEBUG TOP 5 ===')
    console.log('estudiantesStats:', estudiantesStats)
    console.log('topEstudiantes:', topEstudiantes)
    console.log('asistenciasDelMes length:', asistenciasDelMes.length)

    // Estadísticas por especialidad
    const porEspecialidad = {}
    asistenciasDelMes.forEach(a => {
      const especialidad = a.programacionClaseId?.especialidad || 'Sin especialidad'
      if (!porEspecialidad[especialidad]) {
        porEspecialidad[especialidad] = { total: 0, asistieron: 0 }
      }
      porEspecialidad[especialidad].total++
      if (a.estado === 'asistio') porEspecialidad[especialidad].asistieron++
    })

    return {
      porDiaSemana,
      topEstudiantes,
      porEspecialidad,
      totalClases: asistenciasDelMes.length
    }
  }, [asistencias])

  const renderReporteMensual = () => {

    return (
      <Box sx={{ p: 3 }}>
        {/* Header Principal */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <AssessmentIcon color="primary" sx={{ fontSize: 40 }} />
            Reporte Mensual Detallado
            <Chip 
              label={moment().format('MMMM YYYY')} 
              color="primary" 
              variant="outlined"
              icon={<CalendarMonthIcon />}
            />
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            {reporteMensual.tendencia === 'up' && (
              <Chip 
                icon={<TrendingUpIcon />} 
                label="Tendencia Positiva" 
                color="success" 
                variant="filled"
              />
            )}
            {reporteMensual.tendencia === 'down' && (
              <Chip 
                icon={<TrendingDownIcon />} 
                label="Tendencia Negativa" 
                color="error" 
                variant="filled"
              />
            )}
            <Chip 
              icon={<EmojiEventsIcon />} 
              label={`${reporteMensual.porcentajeAsistencia}% Asistencia`} 
              color={reporteMensual.porcentajeAsistencia >= 80 ? "success" : reporteMensual.porcentajeAsistencia >= 60 ? "warning" : "error"}
              variant="filled"
            />
          </Box>
        </Box>

        {/* Estadísticas Principales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' },
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <BarChartIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {reporteMensual.totalAsistencias}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Total Registros
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {estadisticasAdicionales.totalClases} clases programadas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: alpha(theme.palette.success.main, 0.1),
              border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' },
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {reporteMensual.porcentajeAsistencia}%
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Asistencia Promedio
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={reporteMensual.porcentajeAsistencia} 
                  sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.2) }}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: alpha(theme.palette.error.main, 0.1),
              border: `2px solid ${alpha(theme.palette.error.main, 0.3)}`,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' },
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <CancelIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h3" color="error.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {reporteMensual.faltaron}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Total Faltas
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {reporteMensual.totalAsistencias > 0 ? 
                    Math.round((reporteMensual.faltaron / reporteMensual.totalAsistencias) * 100) : 0}% del total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: alpha(theme.palette.info.main, 0.1),
              border: `2px solid ${alpha(theme.palette.info.main, 0.3)}`,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' },
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <GroupIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h3" color="info.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {reporteMensual.totalEstudiantes}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Estudiantes Activos
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Promedio {reporteMensual.totalEstudiantes > 0 ? 
                    Math.round(reporteMensual.totalAsistencias / reporteMensual.totalEstudiantes) : 0} clases/estudiante
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Gráficos y Análisis Detallados */}
        <Grid container spacing={3}>
          {/* Asistencia por Día de la Semana */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShowChartIcon color="primary" />
                  Asistencia por Día de la Semana
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {Object.entries(estadisticasAdicionales.porDiaSemana).map(([dia, stats]) => {
                    const porcentaje = Math.round((stats.asistieron / stats.total) * 100)
                    return (
                      <Box key={dia} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {dia}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {stats.asistieron}/{stats.total} ({porcentaje}%)
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={porcentaje} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.primary.main, 0.1)
                          }}
                        />
                      </Box>
                    )
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Top 5 Estudiantes */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEventsIcon color="warning" />
                  Top 5 Estudiantes
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {estadisticasAdicionales.topEstudiantes.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No hay suficientes datos para mostrar el Top 5
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Se necesitan al menos 3 clases por estudiante
                      </Typography>
                    </Box>
                  ) : (
                    estadisticasAdicionales.topEstudiantes.map((estudiante, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 2, 
                      mb: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}>
                      <Box sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        bgcolor: index === 0 ? theme.palette.warning.main : 
                                index === 1 ? theme.palette.grey[400] : 
                                index === 2 ? theme.palette.error.main : theme.palette.primary.main,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {index + 1}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {estudiante.nombre || 'Sin nombre'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {estudiante.asistieron}/{estudiante.total} clases
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                          {estudiante.porcentaje}%
                        </Typography>
                        {estudiante.porcentaje === 100 && <StarIcon color="warning" sx={{ fontSize: 16 }} />}
                      </Box>
                    </Box>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Asistencia por Especialidad */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="secondary" />
                  Asistencia por Especialidad
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {Object.entries(estadisticasAdicionales.porEspecialidad).map(([especialidad, stats]) => {
                    const porcentaje = Math.round((stats.asistieron / stats.total) * 100)
  return (
                      <Box key={especialidad} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {especialidad}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {porcentaje}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={porcentaje} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.secondary.main, 0.1)
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {stats.asistieron} de {stats.total} clases
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Resumen y Recomendaciones */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="info" />
                  Análisis y Recomendaciones
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {reporteMensual.porcentajeAsistencia >= 90 && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>¡Excelente!</strong> La asistencia está por encima del 90%. 
                        Mantén las buenas prácticas actuales.
                      </Typography>
                    </Alert>
                  )}
                  
                  {reporteMensual.porcentajeAsistencia >= 70 && reporteMensual.porcentajeAsistencia < 90 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Buen nivel</strong> de asistencia. Considera implementar 
                        recordatorios para mejorar aún más.
                      </Typography>
                    </Alert>
                  )}
                  
                  {reporteMensual.porcentajeAsistencia < 70 && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Necesita atención</strong>. La asistencia está por debajo del 70%. 
                        Revisa las estrategias de retención.
                      </Typography>
                    </Alert>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Estadísticas del mes:</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • {reporteMensual.totalAsistencias} registros de asistencia
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • {reporteMensual.totalEstudiantes} estudiantes activos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • {Object.keys(estadisticasAdicionales.porEspecialidad).length} especialidades
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Promedio de {Math.round(reporteMensual.totalAsistencias / Math.max(1, reporteMensual.totalEstudiantes))} clases por estudiante
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    )
  }

  const renderListaMejorada = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon color="primary" />
          Historial de Asistencias
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          variant="outlined"
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>
      
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <GenericList
          data={asistenciasAgrupadas}
          columns={columnsHistorial}
          onView={handleViewAsistencia}
          title=""
          showActions={false}
          showViewButton={true}
          loading={loading}
        />
      </Paper>
    </Box>
  )

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  return (
    <Box sx={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="tabs de asistencia">
          <Tab 
            icon={<TodayIcon />} 
            label="Registro del Día" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          />
          <Tab 
            icon={<BarChartIcon />} 
            label="Reporte Mensual" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          />
          <Tab 
            icon={<AssignmentIcon />} 
            label="Historial Completo" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && renderRegistroAsistencias()}
        {activeTab === 1 && renderReporteMensual()}
        {activeTab === 2 && renderListaMejorada()}
      </Box>

      <DetailModal
        title="Detalle de Asistencia"
        data={selectedAsistencia}
        fields={detailFields}
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
      />

    </Box>
  )
}

export default Asistencia

