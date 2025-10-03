"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import emailService from "../../../shared/services/email.service"
import { GenericList } from "../../../shared/components/GenericList"
import { DetailModal } from "../../../shared/components/DetailModal"
import { VentaMatriculasForm } from "../components/VentaMatriculasForm"
import { Box, Chip, TextField } from "@mui/material"
import { ConfirmationDialog } from "../../../shared/components/ConfirmationDialog"
import { useAlertVentas } from "../context/AlertVentasContext"

const API_BASE_URL = "https://apiwebmga.onrender.com/api"

const VentaMatriculas = () => {
  const { showSuccess, showError } = useAlertVentas()
  const [ventas, setVentas] = useState([])
  const [ventasOriginales, setVentasOriginales] = useState([])
  const [clientes, setClientes] = useState([])
  const [beneficiarios, setBeneficiarios] = useState([])
  const [matriculas, setMatriculas] = useState([])
  const [cursosDisponibles, setCursosDisponibles] = useState([])
  const [selectedVenta, setSelectedVenta] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  // Estados para modales de confirmación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [anularModalOpen, setAnularModalOpen] = useState(false)
  const [ventaToDelete, setVentaToDelete] = useState(null)
  const [ventaToAnular, setVentaToAnular] = useState(null)
  const [motivoAnulacion, setMotivoAnulacion] = useState("")

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      await fetchBeneficiarios()
      await fetchMatriculasData()
      await fetchCursos()
    }
    loadData()
  }, [])

  // Filtrar ventas por estado
  useEffect(() => {
    setVentas(ventasOriginales)
  }, [ventasOriginales])

  // Traer beneficiarios y clientes
  const fetchBeneficiarios = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/beneficiarios`)
      const beneficiariosData = response.data
      setBeneficiarios(beneficiariosData)

      const clientesFiltrados = beneficiariosData.filter(
        (b) =>
          (typeof b.clienteId === "string" && b.clienteId.toLowerCase().includes("cliente")) ||
          String(b.clienteId) === String(b._id),
      )
      setClientes(clientesFiltrados)

      await fetchMatriculas(beneficiariosData)
    } catch (error) {
      console.error("Error al cargar los beneficiarios:", error)
    }
  }

  // Traer datos de matrículas disponibles
  const fetchMatriculasData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/matriculas`)
      setMatriculas(response.data)
    } catch (error) {
      console.error("Error al cargar las matrículas:", error)
    }
  }

  // Traer solo ventas tipo matricula
  const fetchMatriculas = async (beneficiariosData = null) => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/ventas`)

      const soloMatriculas = response.data.filter((v) => v.tipo === "matricula")

      const beneficiariosParaUsar = beneficiariosData || beneficiarios

      const matriculasFormateadas = soloMatriculas.map((venta) => {
        const beneficiario = venta.beneficiarioId

        let clienteNombre = "No especificado"
        let beneficiarioNombre = "No especificado"

        if (beneficiario) {
          beneficiarioNombre = `${beneficiario.nombre || ""} ${beneficiario.apellido || ""}`.trim()

          const clienteId = beneficiario.clienteId
          const beneficiarioId = beneficiario._id

          if (String(clienteId) === String(beneficiarioId)) {
            clienteNombre = beneficiarioNombre
          } else {
            const clienteObj = beneficiariosParaUsar.find((b) => String(b._id) === String(clienteId))
            if (clienteObj) {
              clienteNombre = `${clienteObj.nombre || ""} ${clienteObj.apellido || ""}`.trim()
            } else {
              clienteNombre = `Cliente ID: ${clienteId}`
            }
          }
        }

        return {
          id: venta.codigoVenta || venta._id,
          codigoVenta: venta.codigoVenta || "",
          beneficiario: beneficiarioNombre,
          cliente: clienteNombre,
          fechaInicio: new Date(venta.fechaInicio).toLocaleDateString(),
          fechaFin: new Date(venta.fechaFin).toLocaleDateString(),
          valorTotal: venta.valor_total || 0,
          estado: venta.estado,
          motivoAnulacion: venta.motivoAnulacion,
          fechaCreacion: venta.createdAt ? new Date(venta.createdAt).toLocaleDateString() : "",
          _original: venta,
          beneficiarioObj: beneficiario,
        }
      })

      setVentasOriginales(matriculasFormateadas)
      setVentas(matriculasFormateadas)
    } catch (error) {
      console.error("Error al cargar las matrículas:", error)
    } finally {
      setLoading(false)
    }
  }

  // Traer cursos
  const fetchCursos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cursos`)
      setCursosDisponibles(response.data)
    } catch (error) {
      console.error("Error al cargar los cursos:", error)
    }
  }

  // Columnas para la tabla
  const columns = [
    { id: "codigoVenta", label: "Código Venta" },
    { id: "beneficiario", label: "Beneficiario" },
    { id: "cliente", label: "Cliente" },
    { id: "fechaInicio", label: "Fecha Inicio" },
    { id: "fechaFin", label: "Fecha Fin" },
    {
      id: "valorTotal",
      label: "Valor Total",
      render: (value) => `$${value?.toLocaleString() || 0}`,
    },
    {
      id: "estado",
      label: "Estado",
      filterOptions: [
        { value: "vigente", label: "Vigente" },
        { value: "anulada", label: "Anulada" },
      ],
      render: (value, row) => (
        <Chip
          label={value === "vigente" ? "Vigente" : "Anulada"}
          color={value === "vigente" ? "success" : "error"}
          variant="outlined"
          size="small"
        />
      ),
    },
  ]

  // Campos para el modal de detalle
  const detailFields = [
    { id: "cliente", label: "Cliente" },
    { id: "beneficiario", label: "Beneficiario" },
    { id: "fechaInicio", label: "Fecha Inicio" },
    { id: "fechaFin", label: "Fecha Fin" },
    {
      id: "valorTotal",
      label: "Valor Total",
      render: (value) => `$${value?.toLocaleString() || 0}`,
    },
    {
      id: "estado",
      label: "Estado",
      render: (value) => (
        <Chip
          label={value === "vigente" ? "Vigente" : "Anulada"}
          color={value === "vigente" ? "success" : "error"}
          variant="filled"
          size="small"
        />
      ),
    },
    { id: "codigoVenta", label: "Código Venta" },
    { id: "motivoAnulacion", label: "Motivo Anulación" },
    { id: "fechaCreacion", label: "Fecha Creación" },
  ]

  // Handlers
  const handleCreate = () => {
    setIsEditing(false)
    setSelectedVenta(null)
    setFormModalOpen(true)
  }

  const handleEdit = async (venta) => {
    try {
      const ventaOriginal = ventasOriginales.find((v) => v.id === venta.id)

      if (!ventaOriginal) {
        console.error("No se encontró la venta original")
        return
      }

      const response = await axios.get(`${API_BASE_URL}/ventas/${ventaOriginal._original._id}`)
      const ventaData = response.data

      const beneficiarioCompleto = beneficiarios.find((b) => String(b._id) === String(ventaData.beneficiarioId))

      const beneficiarioFallback =
        ventaOriginal.beneficiarioObj ||
        (ventaData.beneficiarioId
          ? {
              _id: ventaData.beneficiarioId,
              nombre: ventaOriginal.beneficiario.split(" ")[0] || "",
              apellido: ventaOriginal.beneficiario.split(" ").slice(1).join(" ") || "",
            }
          : null)

      const beneficiarioParaEditar = beneficiarioCompleto || beneficiarioFallback

      const matriculaAsociada = matriculas.find((m) => String(m._id) === String(ventaData.matriculaId))

      const ventaParaEditar = {
        ...ventaOriginal,
        _original: ventaData,
        beneficiarioObj: beneficiarioParaEditar,
        matriculaObj: matriculaAsociada,
        fechaInicio: ventaData.fechaInicio,
        fechaFin: ventaData.fechaFin,
        valorTotal: ventaData.valor_total,
        descuento: ventaData.descuento || 0,
      }

      setIsEditing(true)
      setSelectedVenta(ventaParaEditar)
      setFormModalOpen(true)
    } catch (error) {
      console.error("Error al cargar datos para editar:", error)
      showError("Error al cargar los datos para editar")
    }
  }

  const handleDelete = (venta) => {
    const ventaOriginal = ventasOriginales.find((v) => v.id === venta.id)
    setVentaToDelete(ventaOriginal)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (ventaToDelete) {
      try {
        await axios.delete(`${API_BASE_URL}/ventas/${ventaToDelete._original._id}`)
        fetchMatriculas()
        setDeleteModalOpen(false)
        setVentaToDelete(null)
        showSuccess("Matrícula eliminada exitosamente")
      } catch (error) {
        console.error("Error al eliminar la matrícula:", error)
        showError("Error al eliminar la matrícula")
      }
    }
  }

  const handleView = (venta) => {
    const ventaOriginal = ventasOriginales.find((v) => v.id === venta.id)
    setSelectedVenta(ventaOriginal)
    setDetailModalOpen(true)
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setSelectedVenta(null)
  }

  const handleCloseForm = () => {
    setFormModalOpen(false)
    setSelectedVenta(null)
    setIsEditing(false)
  }

  // ✅ FUNCIÓN PRINCIPAL - AHORA USA EL MIDDLEWARE PARA PAGOS
  const handleSubmit = async (formData) => {
    try {
      const { matricula, beneficiario, usuarioBeneficiario, cliente, clienteEsBeneficiario, curso, pago, isEditing } =
        formData

      console.log("=== INICIANDO PROCESO DE VENTA ===")
      console.log("Matricula:", JSON.stringify(matricula, null, 2))
      console.log("Pago:", JSON.stringify(pago, null, 2))
      console.log("Curso:", JSON.stringify(curso, null, 2))
      console.log("Cliente es beneficiario:", clienteEsBeneficiario)
      console.log("=====================================")

      let beneficiarioId = null
      let clienteId = null

      // 1. Manejo de beneficiarios y clientes
      if (isEditing && selectedVenta?.beneficiarioObj?._id) {
        beneficiarioId = selectedVenta.beneficiarioObj._id

        await axios.put(`${API_BASE_URL}/beneficiarios/${beneficiarioId}`, {
          nombre: beneficiario.nombre,
          apellido: beneficiario.apellido,
          tipo_de_documento: beneficiario.tipoDocumento,
          numero_de_documento: beneficiario.numeroDocumento,
          telefono: beneficiario.telefono,
          direccion: beneficiario.direccion,
          fechaDeNacimiento: beneficiario.fechaNacimiento,
          correo: beneficiario.correo,
          estado: beneficiario.estado,
        })
      } else {
        // Step 1: Handle CLIENT creation (when client is not the beneficiary)
        if (!clienteEsBeneficiario) {
          // Check if client already exists
          const clienteExistente = clientes.find(
            (c) =>
              c.numero_de_documento === cliente.numeroDocumento &&
              !ventasOriginales.some((venta) => {
                if (venta._original.tipo !== "matricula" || venta._original.estado !== "vigente") return false
                const beneficiarioVenta = beneficiarios.find(
                  (b) => String(b._id) === String(venta._original.beneficiarioId),
                )
                if (!beneficiarioVenta) return false
                const clienteIdStr = String(beneficiarioVenta.clienteId)
                return clienteIdStr === String(c._id)
              }),
          )

          if (clienteExistente) {
            clienteId = clienteExistente._id
          } else {
            // Create USER for CLIENT
            const usuarioClienteResponse = await axios.post(`${API_BASE_URL}/usuarios`, {
              nombre: cliente.nombre,
              apellido: cliente.apellido,
              correo: cliente.correo || `${cliente.numeroDocumento}@cliente.com`, // Default email if not provided
              contrasena: cliente.contrasena || "123456", // Default password if not provided
              documento: cliente.numeroDocumento,
              tipo_de_documento: cliente.tipoDocumento,
              telefono: cliente.telefono,
              estado: true,
            })
            const usuarioClienteData = usuarioClienteResponse?.data || {}
            const usuarioClienteId = (usuarioClienteData.usuario && usuarioClienteData.usuario._id) || usuarioClienteData._id
            if (!usuarioClienteId) {
              console.error("No se pudo obtener el ID del usuario cliente desde la respuesta:", usuarioClienteData)
              throw new Error("No se pudo obtener el ID del usuario cliente")
            }
            // Enviar correo de bienvenida al CLIENTE recién creado
            try {
              await emailService.sendWelcomeEmail({
                email: cliente.correo || `${cliente.numeroDocumento}@cliente.com`,
                nombre: cliente.nombre,
                apellido: cliente.apellido,
                username: cliente.correo || `${cliente.numeroDocumento}@cliente.com`,
                password: cliente.contrasena || "123456",
              })
              console.log("Correo de bienvenida enviado al cliente correctamente")
            } catch (emailError) {
              console.error("Error al enviar correo de bienvenida al cliente:", emailError)
              // Continuar el flujo incluso si falla el correo
            }
            // Create USUARIO_HAS_ROL for CLIENT
            const rolesResponse = await axios.get(`${API_BASE_URL}/roles`)
            const roles = Array.isArray(rolesResponse.data.roles) ? rolesResponse.data.roles : rolesResponse.data
            const clienteRol = roles.find((rol) => rol.nombre.toLowerCase() === "cliente")
            if (!clienteRol) throw new Error('Rol "Cliente" no encontrado')

            const usuarioHasRolClienteResponse = await axios.post(`${API_BASE_URL}/usuarios_has_rol`, {
              usuarioId: usuarioClienteId,
              rolId: [clienteRol._id],
            })
            const usuarioHasRolClienteId = Array.isArray(usuarioHasRolClienteResponse.data)
              ? usuarioHasRolClienteResponse.data[0]._id
              : usuarioHasRolClienteResponse.data._id

            // Create BENEFICIARIO record for CLIENT
            const clienteResponse = await axios.post(`${API_BASE_URL}/beneficiarios`, {
              nombre: cliente.nombre,
              apellido: cliente.apellido,
              tipo_de_documento: cliente.tipoDocumento,
              numero_de_documento: cliente.numeroDocumento,
              telefono: cliente.telefono,
              direccion: cliente.direccion,
              fechaDeNacimiento: cliente.fechaNacimiento,
              correo: cliente.correo || `${cliente.numeroDocumento}@cliente.com`,
              estado: cliente.estado,
              usuario_has_rolId: usuarioHasRolClienteId,
              clienteId: "cliente",
            })
            clienteId = clienteResponse.data._id
          }
        }

        // Step 2: Handle BENEFICIARY creation
        const beneficiarioExistente = beneficiarios.find(
          (b) =>
            b.numero_de_documento === beneficiario.numeroDocumento &&
            !ventasOriginales.some((venta) => {
              return (
                venta._original.tipo === "matricula" &&
                venta._original.estado === "vigente" &&
                String(venta._original.beneficiarioId) === String(b._id)
              )
            }),
        )

        if (beneficiarioExistente) {
          beneficiarioId = beneficiarioExistente._id

          // Update existing beneficiary with correct clienteId
          const updateClienteId = clienteEsBeneficiario ? beneficiarioId : clienteId
          await axios.put(`${API_BASE_URL}/beneficiarios/${beneficiarioId}`, {
            ...beneficiarioExistente,
            clienteId: updateClienteId,
          })
        } else {
          // Normalizar datos del usuario beneficiario cuando el cliente es beneficiario
          const usuarioBenefDatos = clienteEsBeneficiario
            ? {
                nombre: cliente.nombre,
                apellido: cliente.apellido,
                email: cliente.correo || `${cliente.numeroDocumento}@cliente.com`,
                contrasena: cliente.contrasena || "123456",
                documento: cliente.numeroDocumento,
                telefono: cliente.telefono,
              }
            : usuarioBeneficiario

          // Create USER for BENEFICIARY
          const usuarioBeneficiarioResponse = await axios.post(`${API_BASE_URL}/usuarios`, {
            nombre: usuarioBenefDatos.nombre,
            apellido: usuarioBenefDatos.apellido,
            correo: usuarioBenefDatos.email,
            contrasena: usuarioBenefDatos.contrasena,
            documento: usuarioBenefDatos.documento,
            tipo_de_documento: beneficiario.tipoDocumento,
            telefono: beneficiario.telefono || usuarioBenefDatos.telefono,
            estado: true,
          })
          const usuarioBeneficiarioData = usuarioBeneficiarioResponse?.data || {}
          const usuarioBeneficiarioId = (usuarioBeneficiarioData.usuario && usuarioBeneficiarioData.usuario._id) || usuarioBeneficiarioData._id
          if (!usuarioBeneficiarioId) {
            console.error("No se pudo obtener el ID del usuario beneficiario desde la respuesta:", usuarioBeneficiarioData)
            throw new Error("No se pudo obtener el ID del usuario beneficiario")
          }
          // Create USUARIO_HAS_ROL for BENEFICIARY
          const rolesResponse = await axios.get(`${API_BASE_URL}/roles`)
          const roles = Array.isArray(rolesResponse.data.roles) ? rolesResponse.data.roles : rolesResponse.data
          const beneficiarioRol = roles.find((rol) => rol.nombre.toLowerCase() === "beneficiario")
          const clienteRolParaBenef = roles.find((rol) => rol.nombre.toLowerCase() === "cliente")
          if (!beneficiarioRol) throw new Error('Rol "Beneficiario" no encontrado')
          
          let rolIds = [beneficiarioRol._id]
          if (clienteEsBeneficiario) {
            if (!clienteRolParaBenef) throw new Error('Rol "Cliente" no encontrado')
            rolIds = [clienteRolParaBenef._id, beneficiarioRol._id]
          }
          
          const usuarioHasRolBeneficiarioResponse = await axios.post(`${API_BASE_URL}/usuarios_has_rol`, {
            usuarioId: usuarioBeneficiarioId,
            rolId: rolIds,
          })
          const usuarioHasRolBeneficiarioId = Array.isArray(usuarioHasRolBeneficiarioResponse.data)
            ? usuarioHasRolBeneficiarioResponse.data[0]._id
            : usuarioHasRolBeneficiarioResponse.data._id

          // Create BENEFICIARIO record
          const beneficiarioPayload = {
            nombre: beneficiario.nombre,
            apellido: beneficiario.apellido,
            tipo_de_documento: beneficiario.tipoDocumento,
            numero_de_documento: beneficiario.numeroDocumento,
            telefono: beneficiario.telefono,
            direccion: beneficiario.direccion,
            fechaDeNacimiento: beneficiario.fechaNacimiento,
            correo: beneficiario.correo,
            estado: beneficiario.estado,
            usuario_has_rolId: usuarioHasRolBeneficiarioId,
            clienteId: clienteEsBeneficiario ? "cliente" : clienteId,
          }

          const beneficiarioResponse = await axios.post(`${API_BASE_URL}/beneficiarios`, beneficiarioPayload)
          beneficiarioId = beneficiarioResponse.data._id

          // Enviar correo de bienvenida SOLO al crear beneficiario desde el formulario
          try {
            await emailService.sendWelcomeEmail({
              email: usuarioBenefDatos.email,
              nombre: usuarioBenefDatos.nombre,
              apellido: usuarioBenefDatos.apellido,
              username: usuarioBenefDatos.email,
              password: usuarioBenefDatos.contrasena,
            })
            console.log("Correo de bienvenida enviado correctamente")
          } catch (emailError) {
            console.error("Error al enviar correo de bienvenida:", emailError)
            // Continuar el flujo incluso si falla el correo
          }

          // Update clienteId if cliente es beneficiario
          if (clienteEsBeneficiario) {
            await axios.put(`${API_BASE_URL}/beneficiarios/${beneficiarioId}`, {
              clienteId: beneficiarioId,
            })
          }
        }
      }

      // 2. ✅ CREAR VENTA DE MATRÍCULA - CONTADOR MANUAL
      const matriculaSeleccionada = matriculas.find((m) => m._id === matricula.matriculaId)
      if (!matriculaSeleccionada) {
        throw new Error("No se encontró la matrícula seleccionada")
      }

      const fechaInicio = new Date()
      const fechaFin = new Date()
      fechaFin.setFullYear(fechaFin.getFullYear() + 1)

      let ventaMatriculaId = null
      let codigoMatricula = null

      if (isEditing && selectedVenta?._original?._id) {
        const ventaMatricula = {
          tipo: "matricula",
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
          estado: matricula.estado || "vigente",
          valor_total: Number.parseFloat(matriculaSeleccionada.valorMatricula || matricula.valorFinal || 0),
          beneficiarioId: beneficiarioId,
          matriculaId: matriculaSeleccionada._id,
          observaciones: matricula.observaciones,
          descuento: Number.parseFloat(matricula.descuento || 0),
        }

        await axios.put(`${API_BASE_URL}/ventas/${selectedVenta._original._id}`, ventaMatricula)
        ventaMatriculaId = selectedVenta._original._id
        codigoMatricula = selectedVenta._original.codigoVenta
      } else {
        // ✅ INCREMENTAR CONTADOR DE MATRÍCULA UNA SOLA VEZ
        const consecutivoMatricula = await incrementarContador("matricula")
        codigoMatricula = `MA-${consecutivoMatricula.toString().padStart(4, "0")}`

        const ventaMatricula = {
          tipo: "matricula",
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
          estado: matricula.estado || "vigente",
          valor_total: Number.parseFloat(matriculaSeleccionada.valorMatricula || matricula.valorFinal || 0),
          beneficiarioId: beneficiarioId,
          matriculaId: matriculaSeleccionada._id,
          observaciones: matricula.observaciones,
          descuento: Number.parseFloat(matricula.descuento || 0),
          consecutivo: consecutivoMatricula,
          codigoVenta: codigoMatricula,
          // ✅ DATOS DE PAGO PARA EL MIDDLEWARE
          metodoPago: pago?.metodoPago || "Efectivo",
          numeroTransaccion: pago?.numeroTransaccion || null,
          fechaPago: pago?.fechaPago || new Date().toISOString(),
        }

        console.log("✅ Enviando venta de matrícula al middleware:")
        console.log("  - Tipo:", ventaMatricula.tipo)
        console.log("  - Método de pago:", ventaMatricula.metodoPago)

        // ✅ HEADERS PARA PERMITIR QUE EL MIDDLEWARE MANEJE PAGO
        // ✅ HEADERS PARA MATRÍCULA: Contador manual, pago automático
        const headersPermitirMiddleware = {
          "Content-Type": "application/json",
          "x-skip-auto-payment": "false", // ✅ Permitir que el middleware cree el pago
          "x-skip-auto-counter": "true", // 🚫 Ya incrementamos el contador manualmente
          "x-source-module": "VentaMatriculas",
        }

        const matriculaVentaResponse = await axios.post(`${API_BASE_URL}/ventas`, ventaMatricula, {
          headers: headersPermitirMiddleware,
          timeout: 10000,
        })
        ventaMatriculaId = matriculaVentaResponse.data._id

        console.log("✅ Venta de matrícula creada:", ventaMatriculaId)
      }

      // 3. ✅ CREAR VENTA DE CURSO - EXACTAMENTE COMO VentaCursos.jsx
      if (curso && curso.curso && !isEditing) {
        console.log("=== CREANDO VENTA DE CURSO (COMPLETAMENTE AUTOMÁTICO) ===")
        const cursoObj = cursosDisponibles.find((c) => c.nombre === curso.curso)

        if (!cursoObj) {
          throw new Error("No se encontró el curso seleccionado")
        }

        const siguienteConsecutivoResponse = await axios.get(`${API_BASE_URL}/ventas/next-consecutivo`)
        console.log("📊 Respuesta del consecutivo:", siguienteConsecutivoResponse.data)

        const nextConsecutivo = siguienteConsecutivoResponse.data?.nextConsecutivo
        if (nextConsecutivo === undefined || nextConsecutivo === null || isNaN(nextConsecutivo)) {
          throw new Error(`Error al obtener el consecutivo: ${JSON.stringify(siguienteConsecutivoResponse.data)}`)
        }

        const ventaCurso = {
          tipo: "curso",
          fechaInicio: matricula.fechaInicio,
          fechaFin: matricula.fechaFin,
          beneficiarioId: beneficiarioId,
          cursoId: cursoObj._id,
          ciclo: curso.ciclo || null,
          matriculaId: matriculaSeleccionada._id,
          numero_de_clases: Number.parseInt(curso.clases),
          valor_total: Number.parseFloat(curso.valorTotal),
          estado: "vigente",
          consecutivo: nextConsecutivo,
          codigoVenta: `CU-${String(nextConsecutivo).padStart(4, "0")}`,
          // ✅ DATOS DE PAGO PARA EL MIDDLEWARE
          metodoPago: pago?.metodoPago || "Efectivo",
          numeroTransaccion: pago?.numeroTransaccion || null,
          fechaPago: pago?.fechaPago || new Date().toISOString(),
        }

        console.log("✅ Enviando venta de curso:")
        console.log("  - Consecutivo:", ventaCurso.consecutivo)
        console.log("  - Código:", ventaCurso.codigoVenta)

        const cursoVentaResponse = await axios.post(`${API_BASE_URL}/ventas`, ventaCurso, {
          timeout: 10000,
        })
        console.log("✅ Venta de curso creada:", cursoVentaResponse.data._id)
      }

      // Dentro de handleSubmit, al finalizar el flujo (cerca de tu bloque 600-650)
      await fetchBeneficiarios()
      await fetchMatriculas()
      handleCloseForm()
      showSuccess("Matrícula y pago(s) guardados exitosamente")
    } catch (error) {
      console.error("❌ ERROR GENERAL en handleSubmit:")
      console.error("  - Mensaje:", error.message)
      console.error("  - Stack completo:", error.stack)

      if (error.response) {
        console.error("  - Response status:", error.response.status)
        console.error("  - Response data:", JSON.stringify(error.response.data, null, 2))
        console.error("  - Response headers:", error.response.headers)
      }

      if (error.config) {
        console.error("  - Request URL:", error.config.url)
        console.error("  - Request method:", error.config.method)
        console.error("  - Request data:", error.config.data)
        console.error("  - Request headers:", error.config.headers)
      }

      let errorMessage = "Error desconocido"
      if (error.message) {
        errorMessage = error.message
      }
      if (error.response?.status === 400) {
        console.error("❌ Error 400 - Bad Request:")
        console.error("  - Status:", error.response.status)
        console.error("  - Data:", error.response.data)
        console.error("  - Request data:", error.config?.data)
        errorMessage = `Error 400: ${error.response.data?.message || "Solicitud inválida"}`
      }

      showError("Error al guardar la matrícula: " + errorMessage)
    }
  }

  const handleAnular = (venta) => {
    const ventaOriginal = ventasOriginales.find((v) => v.id === venta.id)
    if (ventaOriginal?.estado?.toLowerCase() === "anulada") {
      showError("La matrícula ya está anulada")
      return
    }
    setVentaToAnular(ventaOriginal)
    setMotivoAnulacion("")
    setAnularModalOpen(true)
  }

  const confirmAnular = async () => {
    if (!motivoAnulacion.trim()) {
      showError("Se requiere un motivo para anular la matrícula")
      return
    }

    if (ventaToAnular) {
      try {
        const datosActualizacion = {
          motivoAnulacion: motivoAnulacion.trim(),
        }

        const response = await axios.patch(
          `${API_BASE_URL}/ventas/${ventaToAnular._original._id}/anular`,
          datosActualizacion,
        )

        await fetchMatriculas()

        setAnularModalOpen(false)
        setVentaToAnular(null)
        setMotivoAnulacion("")

        showSuccess("Matrícula anulada exitosamente")
      } catch (error) {
        console.error("Error al anular matrícula:", error)

        let errorMessage = "Error desconocido al anular la matrícula"

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }

        showError(`Error al anular la matrícula: ${errorMessage}`)
      }
    }
  }

  // ✅ FUNCIÓN PARA INCREMENTAR EL CONTADOR DE MATRÍCULA
  const incrementarContador = async (tipo) => {
    try {
      console.log(`=== INCREMENTANDO CONTADOR DE ${tipo.toUpperCase()} ===`)
      const response = await axios.patch(`${API_BASE_URL}/contador/${tipo}/incrementar`)
      const nuevoConsecutivo = response.data.contador.seq
      console.log(`✅ Contador de ${tipo.toUpperCase()} actualizado:`, nuevoConsecutivo)
      return nuevoConsecutivo
    } catch (error) {
      console.error(`❌ Error al incrementar contador de ${tipo.toUpperCase()}:`, error)
      throw error
    }
  }

  return (
    <>
      <GenericList
        data={ventas}
        columns={columns}
        onDelete={handleDelete}
        onCreate={handleCreate}
        onView={handleView}
        title="Gestión de Matrículas"
        loading={loading}
        onCancel={handleAnular}
      />

      <DetailModal
        title={`Detalle de Matrícula: ${selectedVenta?.beneficiario}`}
        data={selectedVenta}
        fields={detailFields}
        open={detailModalOpen}
        onClose={handleCloseDetail}
        extraContent={
          selectedVenta?.beneficiarioObj && (
            <Box sx={{ mt: 2 }}>
              <strong>Datos del Beneficiario:</strong>
              <div>
                Nombre: {selectedVenta.beneficiarioObj.nombre} {selectedVenta.beneficiarioObj.apellido}
              </div>
              <div>
                Documento: {selectedVenta.beneficiarioObj.tipo_de_documento}{" "}
                {selectedVenta.beneficiarioObj.numero_de_documento}
              </div>
              <div>Teléfono: {selectedVenta.beneficiarioObj.telefono}</div>
              <div>Dirección: {selectedVenta.beneficiarioObj.direccion}</div>
              <div>
                Fecha de Nacimiento: {new Date(selectedVenta.beneficiarioObj.fechaDeNacimiento).toLocaleDateString()}
              </div>
            </Box>
          )
        }
      />

      <VentaMatriculasForm
        open={formModalOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        isEditing={isEditing}
        clientes={clientes}
        beneficiarios={beneficiarios}
        matriculas={matriculas}
        cursosDisponibles={cursosDisponibles}
        setClientes={setClientes}
        setBeneficiarios={setBeneficiarios}
        initialData={selectedVenta}
        ventasOriginales={ventasOriginales}
      />

      {/* Modal de confirmación para eliminar */}
      <ConfirmationDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        content={`¿Está seguro de que desea eliminar la matrícula de ${ventaToDelete?.beneficiario}? Esta acción no se puede deshacer.`}
        confirmButtonText="Eliminar"
        confirmButtonColor="#f44336"
        cancelButtonText="Cancelar"
      />

      {/* Modal de confirmación para anular */}
      <ConfirmationDialog
        open={anularModalOpen}
        onClose={() => setAnularModalOpen(false)}
        onConfirm={confirmAnular}
        title="Confirmar Anulación"
        content={
          <>
            <div style={{ marginBottom: 12 }}>
              ¿Está seguro de que desea anular la matrícula de <b>{ventaToAnular?.beneficiario}</b>?
            </div>
            <TextField
              fullWidth
              label="Motivo de anulación"
              multiline
              rows={3}
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              placeholder="Ingrese el motivo por el cual se anula esta matrícula..."
              required
              error={motivoAnulacion.trim() === "" && motivoAnulacion !== ""}
              helperText={motivoAnulacion.trim() === "" && motivoAnulacion !== "" ? "El motivo es requerido" : ""}
              sx={{ mt: 2 }}
            />
          </>
        }
        confirmButtonText="Anular Matrícula"
        confirmButtonColor="#ff9800"
        cancelButtonText="Cancelar"
        confirmButtonDisabled={!motivoAnulacion.trim()}
      />
    </>
  )
}

export default VentaMatriculas
