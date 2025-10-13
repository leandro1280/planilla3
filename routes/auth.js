const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const School = require('../models/School');
const { supabase } = require('../config/database');

const router = express.Router();

// Middleware para validar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: errors.array()
    });
  }
  next();
};

// POST /auth/register - Registro de usuario
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('first_name').notEmpty().trim().withMessage('El nombre es requerido'),
  body('last_name').notEmpty().trim().withMessage('El apellido es requerido'),
  body('role').isIn(['admin', 'director', 'teacher', 'secretary']).withMessage('Rol inválido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password, first_name, last_name, role, school_code } = req.body;

    // Crear usuario
    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      role
    });

    // Si se proporciona código de escuela, asignar usuario a la escuela
    if (school_code) {
      const school = await School.findByCode(school_code);
      if (school) {
        await user.assignToSchool(school.id, role);
      }
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: user.toPublicJSON(),
      token
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(400).json({
      error: 'Error al registrar usuario',
      details: error.message
    });
  }
});

// POST /auth/login - Inicio de sesión
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Verificar que el usuario esté activo
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Usuario inactivo'
      });
    }

    // Actualizar último login
    await user.updateLastLogin();

    // Obtener escuelas del usuario
    const schools = await user.getSchools();

    // Crear sesión
    req.session.user = user.toPublicJSON();
    if (schools.length > 0) {
      req.session.school = schools[0];
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Inicio de sesión exitoso',
      user: user.toPublicJSON(),
      schools,
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// POST /auth/logout - Cerrar sesión
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: 'Error al cerrar sesión'
      });
    }
    res.clearCookie('connect.sid');
    res.json({
      message: 'Sesión cerrada exitosamente'
    });
  });
});

// GET /auth/me - Obtener información del usuario actual
router.get('/me', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'No autenticado'
      });
    }

    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    const schools = await user.getSchools();

    res.json({
      user: user.toPublicJSON(),
      schools
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// POST /auth/change-password - Cambiar contraseña
router.post('/change-password', [
  body('current_password').notEmpty().withMessage('La contraseña actual es requerida'),
  body('new_password').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
  handleValidationErrors
], async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'No autenticado'
      });
    }

    const { current_password, new_password } = req.body;

    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isValidPassword = await user.verifyPassword(current_password);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Contraseña actual incorrecta'
      });
    }

    // Cambiar contraseña
    await user.changePassword(new_password);

    res.json({
      message: 'Contraseña cambiada exitosamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// POST /auth/switch-school - Cambiar escuela activa
router.post('/switch-school', [
  body('school_id').isUUID().withMessage('ID de escuela inválido'),
  handleValidationErrors
], async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'No autenticado'
      });
    }

    const { school_id } = req.body;

    // Verificar que el usuario tenga acceso a la escuela
    const { data: userSchool, error } = await supabase
      .from('user_schools')
      .select(`
        *,
        schools (*)
      `)
      .eq('user_id', req.session.user.id)
      .eq('school_id', school_id)
      .eq('is_active', true)
      .single();

    if (error || !userSchool) {
      return res.status(403).json({
        error: 'No tienes acceso a esta escuela'
      });
    }

    // Actualizar sesión
    req.session.school = {
      ...userSchool.schools,
      role_in_school: userSchool.role_in_school
    };

    res.json({
      message: 'Escuela cambiada exitosamente',
      school: userSchool.schools
    });
  } catch (error) {
    console.error('Error al cambiar escuela:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// GET /auth/schools - Obtener escuelas del usuario
router.get('/schools', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'No autenticado'
      });
    }

    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    const schools = await user.getSchools();

    res.json({
      schools
    });
  } catch (error) {
    console.error('Error al obtener escuelas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Páginas de autenticación
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', {
    title: 'Iniciar Sesión',
    error: req.query.error
  });
});

router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/register', {
    title: 'Registrarse'
  });
});

module.exports = router;