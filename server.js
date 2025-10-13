const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const schoolRoutes = require('./routes/schools');
const studentRoutes = require('./routes/students');
const gradeRoutes = require('./routes/grades');
const reportRoutes = require('./routes/reports');
const importRoutes = require('./routes/import');

// Importar middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // límite por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuración de Handlebars
const hbs = exphbs.create({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    // Helper para formatear fechas
    formatDate: (date) => {
      return new Date(date).toLocaleDateString('es-AR');
    },
    // Helper para formatear números
    formatNumber: (num) => {
      return parseFloat(num).toFixed(2);
    },
    // Helper para comparar valores
    eq: (a, b) => a === b,
    // Helper para verificar si un valor existe
    exists: (value) => value !== null && value !== undefined && value !== '',
    // Helper para capitalizar
    capitalize: (str) => {
      if (typeof str !== 'string') return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
  }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware para variables globales
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.school = req.session.school || null;
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// Rutas principales
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', { 
    title: 'Iniciar Sesión',
    error: req.query.error 
  });
});

// Rutas de autenticación
app.use('/auth', authRoutes);

// Rutas protegidas
app.use('/dashboard', authMiddleware, dashboardRoutes);
app.use('/schools', authMiddleware, schoolRoutes);
app.use('/students', authMiddleware, studentRoutes);
app.use('/grades', authMiddleware, gradeRoutes);
app.use('/reports', authMiddleware, reportRoutes);
app.use('/import', authMiddleware, importRoutes);

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).render('error', {
    title: 'Página no encontrada',
    message: 'La página que buscas no existe',
    error: { status: 404 }
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Sistema de Gestión de Notas Escolares`);
});

module.exports = app;