const UsuarioHasRol = require('../models/UsuarioHasRol');

// GET - Obtener todas las relaciones usuario-rol
exports.getUsuariosHasRoles = async (req, res) => {
  try {
    const relaciones = await UsuarioHasRol.find()
      .populate('usuarioId')
      .populate('rolId');
    res.json(relaciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET - Obtener una relación por ID
exports.getUsuarioHasRolById = async (req, res) => {
  try {
    const relacion = await UsuarioHasRol.findById(req.params.id)
      .populate('usuarioId')
      .populate('rolId');
    if (relacion) {
      res.json(relacion);
    } else {
      res.status(404).json({ message: 'Relación usuario-rol no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET - Obtener roles por ID de usuario
exports.getUsuarioHasRolesByUsuarioId = async (req, res) => {
  try {
    const relaciones = await UsuarioHasRol.find({ usuarioId: req.params.usuarioId })
      .populate('usuarioId')
      .populate('rolId');
    res.json(relaciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST - Crear o actualizar relación usuario-rol (agregar rol al array)
exports.createUsuarioHasRol = async (req, res) => {
  try {
    const { usuarioId, rolId } = req.body;
    if (!usuarioId || !rolId) {
      return res.status(400).json({ message: 'usuarioId y rolId son requeridos' });
    }

    const rolIds = Array.isArray(rolId) ? rolId : [rolId];

    const actualizada = await UsuarioHasRol.findOneAndUpdate(
      { usuarioId },
      {
        $setOnInsert: { usuarioId, estado: true },
        $addToSet: { rolId: { $each: rolIds } }
      },
      { new: true, upsert: true }
    );

    // Devolver como array para compatibilidad con el frontend existente
    const relaciones = await UsuarioHasRol.find({ usuarioId })
      .populate('usuarioId')
      .populate('rolId');

    return res.status(201).json(relaciones);
  } catch (error) {
    if (!res.headersSent) {
      res.status(400).json({ message: error.message });
    }
  }
};

// PUT - Actualizar relación usuario-rol
exports.updateUsuarioHasRol = async (req, res) => {
  try {
    const relacion = await UsuarioHasRol.findById(req.params.id);
    if (relacion) {
      // Permitir reemplazar completamente el array de roles si se envía como array
      if (Array.isArray(req.body.rolId)) {
        relacion.rolId = req.body.rolId;
        if (typeof req.body.estado === 'boolean') relacion.estado = req.body.estado;
      } else {
        Object.assign(relacion, req.body);
      }
      const actualizada = await relacion.save();
      const poblada = await UsuarioHasRol.findById(actualizada._id)
        .populate('usuarioId')
        .populate('rolId');
      res.json(poblada);
    } else {
      res.status(404).json({ message: 'Relación usuario-rol no encontrada' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE - Eliminar relación usuario-rol
exports.deleteUsuarioHasRol = async (req, res) => {
  try {
    const relacion = await UsuarioHasRol.findById(req.params.id);
    if (relacion) {
      await relacion.deleteOne();
      res.json({ message: 'Relación eliminada' });
    } else {
      res.status(404).json({ message: 'Relación no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE - Eliminar todas las relaciones de un usuario
exports.deleteUsuarioHasRolesByUsuarioId = async (req, res) => {
  try {
    const resultado = await UsuarioHasRol.deleteMany({ usuarioId: req.params.usuarioId });
    if (resultado.deletedCount > 0) {
      res.json({ message: `Se eliminaron ${resultado.deletedCount} relaciones del usuario` });
    } else {
      res.status(404).json({ message: 'No se encontraron relaciones para este usuario' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};