const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  correo: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/, 'Debe ser un correo electrónico válido (solo ASCII)']
  },
  contrasena: {
    type: String,
    required: true,
    minlength: 8
  },
  estado: {
    type: Boolean,
    default: true
  },
  tipo_de_documento: {
    type: String,
    required: true,
    enum: ['TI', 'CC', 'CE', 'PP', 'NIT'],
    trim: true
  },
  documento: {
    type: String,
    required: true,
    match: [/^[0-9]{6,15}$/, 'Debe contener solo números, entre 6 y 15 dígitos']
  },
}, {
  timestamps: true,
  collection: 'usuarios' 
});

module.exports = mongoose.model('Usuario', usuarioSchema);
