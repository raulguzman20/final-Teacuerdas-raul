require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importar middleware de autenticación
const auth = require('./middleware/auth');

// Importar rutas
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const aulaRoutes = require('./routes/aulaRoutes');
const beneficiarioRoutes = require('./routes/beneficiarioRoutes');
const claseRoutes = require('./routes/claseRoutes');
const cursoHasNumeroDeClasesRoutes = require('./routes/cursoHasNumeroDeClasesRoutes');
const cursoRoutes = require('./routes/cursoRoutes');
const especialidadProfesorRoutes = require('./routes/especialidadProfesorRoutes');
const grupoRoutes = require('./routes/grupoRoutes');
const matriculaRoutes = require('./routes/matriculaRoutes');
const numeroDeClasesRoutes = require('./routes/numeroDeClasesRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const permisoRoutes = require('./routes/permisoRoutes');
const privilegioRoutes = require('./routes/privilegioRoutes');
const profesorRoutes = require('./routes/profesorRoutes');
const rolPermisoPrivilegioRoutes = require('./routes/rolPermisoPrivilegioRoutes');
const rolRoutes = require('./routes/rolRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const usuarioHasRolRoutes = require('./routes/usuarioHasRolRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const programacionClaseRoutes = require('./routes/programacionClaseRoutes');
const programacionProfesorRoutes = require('./routes/programacionProfesorRoutes');
const profesorHasCursoRoutes = require('./routes/profesorHasCursoRoutes');
const contadorRoutes = require('./routes/contadorRoutes');
const loginRoutes = require('./routes/loginRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const emailRoutes = require('./routes/emailRoutes');

const app = express();

// Middleware global
app.use(cors());
app.use(express.json());

// Conexión MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://raul321:pass123@cluster0.xjeaj.mongodb.net/MGA';

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ Error connecting to MongoDB:', err));

// Ruta pública de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to MGA API' });
});

// 🔹 Rutas públicas (no requieren token)
app.use('/api/login', loginRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/email', emailRoutes);

// 🔹 Middleware global para proteger rutas privadas
// Todo lo que esté después de aquí requiere JWT válido
app.use(auth.verifyToken);

// 🔹 Rutas protegidas con JWT
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/aulas', aulaRoutes);
app.use('/api/beneficiarios', beneficiarioRoutes);
app.use('/api/clases', claseRoutes);
app.use('/api/curso_has_numero_de_clases', cursoHasNumeroDeClasesRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/especialidades_de_profesores', especialidadProfesorRoutes);
app.use('/api/grupos', grupoRoutes);
app.use('/api/matriculas', matriculaRoutes);
app.use('/api/numero_de_clases', numeroDeClasesRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/permisos', permisoRoutes);
app.use('/api/privilegios', privilegioRoutes);
app.use('/api/profesores', profesorRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/rol_permiso_privilegio', rolPermisoPrivilegioRoutes);
app.use('/api/usuarios_has_rol', usuarioHasRolRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/programacion_de_clases', programacionClaseRoutes);
app.use('/api/programacion_de_profesores', programacionProfesorRoutes);
app.use('/api/profesor_has_curso', profesorHasCursoRoutes);
app.use('/api/contador', contadorRoutes);

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
