const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

// Middleware para verificar autenticación
const authMiddleware = async (req, res, next) => {
  try {
    // Verificar si hay sesión activa
    if (req.session.user) {
      return next();
    }

    // Verificar token JWT en header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        // Verificar que el usuario existe en la base de datos
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single();

        if (error || !user) {
          return res.status(401).json({ error: 'Token inválido' });
        }

        if (!user.is_active) {
          return res.status(401).json({ error: 'Usuario inactivo' });
        }

        // Agregar usuario a la sesión
        req.session.user = user;
        return next();
      } catch (jwtError) {
        return res.status(401).json({ error: 'Token inválido' });
      }
    }

    // Si es una petición AJAX, devolver JSON
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Redirigir a login para peticiones normales
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware para verificar roles de usuario
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }

    next();
  };
};

// Middleware para verificar que el usuario pertenece a la escuela
const requireSchoolAccess = async (req, res, next) => {
  try {
    const schoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({ error: 'ID de escuela requerido' });
    }

    if (!req.session.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Verificar que el usuario tiene acceso a esta escuela
    const { data: userSchool, error } = await supabase
      .from('user_schools')
      .select('*')
      .eq('user_id', req.session.user.id)
      .eq('school_id', schoolId)
      .single();

    if (error || !userSchool) {
      return res.status(403).json({ error: 'No tienes acceso a esta escuela' });
    }

    // Agregar información de la escuela a la sesión
    req.session.school = { id: schoolId };
    next();
  } catch (error) {
    console.error('Error en middleware de acceso a escuela:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  authMiddleware,
  requireRole,
  requireSchoolAccess
};


