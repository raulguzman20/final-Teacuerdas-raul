const Usuario = require('../models/usuario');
const Profesor = require('../models/profesor');
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
exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().sort({ nombre: 1 });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

// GET por ID
exports.getUsuarioById = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
};

// POST crear usuario (+ profesor si aplica)
exports.createUsuario = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    console.log("Datos recibidos en createUsuario:", req.body);

    const {
      nombre,
      apellido,
      correo,
      contrasena,
      rol,
      estado,
      tipo_de_documento,
      documento,
      telefono,
      direccion,
      especialidades // solo si es profesor
    } = req.body;

    // General
    if (!nombre || !apellido || !correo || !contrasena || !tipo_de_documento || !documento) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    // Asignar rol solo si llega (profesor, admin), y si no llega, dejar que el flujo siga igual.
// Nota: La relación usuario-rol se crea más abajo, después de guardar el usuario (solo si llega "rol").

    // Validación extra solo si es profesor
    if (rol === 'profesor' && (!especialidades || especialidades.length === 0)) {
      return res.status(400).json({ message: 'Un profesor debe tener al menos una especialidad' });
    }

    // Validar duplicados
    const existeUsuario = await Usuario.findOne({ $or: [{ correo }, { documento }] }).session(session);
    if (existeUsuario) {
      return res.status(400).json({ message: 'Ya existe un usuario con este correo o documento' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(contrasena, salt);


    const usuario = new Usuario({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      correo: correo.toLowerCase().trim(),
      contrasena: hash,
      rol,
      estado: estado !== undefined ? estado : true,
      tipo_de_documento,
      documento: documento.toString().trim(),
      telefono: telefono ? telefono.trim() : undefined,   // ✅ no rompe si no viene
      direccion: direccion ? direccion.trim() : undefined // ✅ no rompe si no viene
    });
    const nuevoUsuario = await usuario.save({ session });


    let nuevoProfesor = null;

    // Si el rol es profesor, crear también Profesor
    if (rol === 'profesor') {
      const existeProfesor = await Profesor.findOne({ $or: [{ correo }, { identificacion: documento }] }).session(session);
      if (existeProfesor) {
        throw new Error('Ya existe un profesor con este correo o documento');
      }

      nuevoProfesor = new Profesor({
        usuarioId: nuevoUsuario._id,
        nombres: nombre.trim(),
        apellidos: apellido.trim(),
        tipoDocumento: tipo_de_documento,
        identificacion: documento.toString().trim(),
        telefono: telefono.trim(),
        direccion: direccion?.trim(),
        correo: correo.toLowerCase().trim(),
        especialidades: especialidades.map(e => e.trim()),
        estado: estado ? 'Activo' : 'Inactivo'
      });
      await nuevoProfesor.save({ session });
    }

    // Crear relación usuario-rol solo si llega 'rol' en la petición
    if (rol) {
      const rolDoc = await Rol.findOne({ nombre: rol.charAt(0).toUpperCase() + rol.slice(1) }).session(session);
      if (!rolDoc) throw new Error(`No se encontró el rol ${rol}`);

      const relacion = new UsuarioHasRol({
        usuarioId: nuevoUsuario._id,
        rolId: [rolDoc._id],
        estado: true
      });
      await relacion.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json({
      message: 'Usuario creado correctamente',
      usuario: { ...nuevoUsuario.toObject(), contrasena: undefined },
      profesor: nuevoProfesor
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error al crear usuario:', error);
    res.status(400).json(handleValidationError(error));
  } finally {
    session.endSession();
  }
};

// PUT actualizar usuario
exports.updateUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(400).json(handleValidationError(error));
  }
};

// DELETE eliminar usuario
exports.deleteUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    await usuario.deleteOne();
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};
