const Profesor = require('../models/profesor');
const Usuario = require('../models/usuario');
const UsuarioHasRol = require('../models/UsuarioHasRol');
const Rol = require('../models/rol');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Función auxiliar para manejar errores
const handleValidationError = (error) => {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return { message: 'Error de validación', details: messages.join(', ') };
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return { message: 'Duplicado', details: `Ya existe un registro con ${field}: "${error.keyValue[field]}"` };
  }
  return { message: error.message || 'Error interno' };
};

// GET todos
exports.getProfesores = async (req, res) => {
  try {
    const { usuarioId } = req.query;
    const query = usuarioId ? { usuarioId: new mongoose.Types.ObjectId(usuarioId) } : {};
    const profesores = await Profesor.find(query).sort({ nombres: 1 });
    res.json(profesores);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener profesores', error: error.message });
  }
};

// GET por ID
exports.getProfesorById = async (req, res) => {
  try {
    const profesor = await Profesor.findById(req.params.id);
    if (!profesor) return res.status(404).json({ message: 'Profesor no encontrado' });
    res.json(profesor);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener profesor', error: error.message });
  }
};

// POST crear profesor + usuario + relación
exports.createProfesor = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      nombres,
      apellidos,
      tipoDocumento,
      identificacion,
      telefono,
      direccion,
      correo,
      especialidades,
      estado,
      contrasena
    } = req.body;

    if (!nombres || !apellidos || !tipoDocumento || !identificacion || !telefono || !correo || !especialidades || !contrasena) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    // Verificar duplicados
    const existeProfesor = await Profesor.findOne({ $or: [{ correo }, { identificacion }] }).session(session);
    const existeUsuario = await Usuario.findOne({ $or: [{ correo }, { documento: identificacion }] }).session(session);

    if (existeProfesor || existeUsuario) {
      return res.status(400).json({ message: 'Ya existe un profesor o usuario con este correo o documento' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(contrasena, salt);

    // Crear usuario
    const usuario = new Usuario({
      nombre: nombres.trim(),
      apellido: apellidos.trim(),
      correo: correo.toLowerCase().trim(),
      contrasena: hash,
      rol: 'profesor',
      estado: true,
      tipo_de_documento: tipoDocumento,
      documento: identificacion.toString().trim(),
      telefono: telefono.trim()
    });
    const nuevoUsuario = await usuario.save({ session });

    // Crear profesor
    const profesor = new Profesor({
      usuarioId: nuevoUsuario._id,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      tipoDocumento,
      identificacion: identificacion.toString().trim(),
      telefono: telefono.trim(),
      direccion: direccion?.trim(),
      correo: correo.toLowerCase().trim(),
      especialidades: especialidades.map(e => e.trim()),
      estado: estado || 'Activo'
    });
    const nuevoProfesor = await profesor.save({ session });

    // Crear relación usuario-rol
    const rolProfesor = await Rol.findOne({ nombre: 'Profesor' }).session(session);
    if (!rolProfesor) throw new Error('No se encontró el rol Profesor');

    const relacion = new UsuarioHasRol({
      usuarioId: nuevoUsuario._id,
      rolId: [rolProfesor._id],
      estado: true
    });
    await relacion.save({ session });

    await session.commitTransaction();
    res.status(201).json({
      message: 'Profesor, usuario y rol creados correctamente',
      profesor: nuevoProfesor,
      usuario: { ...nuevoUsuario.toObject(), contrasena: undefined }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error al crear profesor:', error);
    res.status(400).json(handleValidationError(error));
  } finally {
    session.endSession();
  }
};

// PUT actualizar profesor + usuario
exports.updateProfesor = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const profesor = await Profesor.findById(req.params.id).session(session);
    if (!profesor) {
      return res.status(404).json({ message: 'Profesor no encontrado' });
    }

    // Actualizar datos del profesor
    const {
      nombres,
      apellidos,
      tipoDocumento,
      identificacion,
      telefono,
      direccion,
      correo,
      especialidades,
      estado
    } = req.body;

    if (nombres !== undefined) profesor.nombres = nombres.trim();
    if (apellidos !== undefined) profesor.apellidos = apellidos.trim();
    if (tipoDocumento !== undefined) profesor.tipoDocumento = tipoDocumento;
    if (identificacion !== undefined) profesor.identificacion = identificacion.toString().trim();
    if (telefono !== undefined) profesor.telefono = telefono.trim();
    if (direccion !== undefined) profesor.direccion = direccion?.trim();
    if (correo !== undefined) profesor.correo = correo.toLowerCase().trim();
    if (especialidades !== undefined) profesor.especialidades = especialidades.map(e => e.trim());
    if (estado !== undefined) profesor.estado = estado;

    const profesorActualizado = await profesor.save({ session });

    // Actualizar usuario asociado si existe
    if (profesor.usuarioId) {
      const usuario = await Usuario.findById(profesor.usuarioId).session(session);
      if (usuario) {
        if (nombres !== undefined) usuario.nombre = nombres.trim();
        if (apellidos !== undefined) usuario.apellido = apellidos.trim();
        if (tipoDocumento !== undefined) usuario.tipo_de_documento = tipoDocumento;
        if (identificacion !== undefined) usuario.documento = identificacion.toString().trim();
        if (telefono !== undefined) usuario.telefono = telefono.trim();
        if (direccion !== undefined) usuario.direccion = direccion?.trim();
        if (correo !== undefined) usuario.correo = correo.toLowerCase().trim();
        if (estado !== undefined) usuario.estado = estado === 'Activo';

        await usuario.save({ session });
      }
    }

    await session.commitTransaction();
    res.json({ message: 'Profesor y usuario actualizados correctamente', profesor: profesorActualizado });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error al actualizar profesor:', error);
    res.status(400).json(handleValidationError(error));
  } finally {
    session.endSession();
  }
};

// DELETE eliminar profesor
exports.deleteProfesor = async (req, res) => {
  try {
    const profesor = await Profesor.findById(req.params.id);
    if (!profesor) return res.status(404).json({ message: 'Profesor no encontrado' });
    await profesor.deleteOne();
    res.json({ message: 'Profesor eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar profesor', error: error.message });
  }
};
