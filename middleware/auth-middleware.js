// ========================================
// MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN
// ========================================

const { supabaseAdmin } = require('../config/database');
const { verifyToken } = require('../utils/jwt-utils');
const authConfig = require('../config/auth-config');

/**
 * Middleware principal de autenticación
 * Verifica sesión activa o token JWT válido
 */
const authMiddleware = async (req, res, next) => {
    try {
        console.log('🔍 AuthMiddleware - Verificando autenticación...');
        console.log('📊 URL:', req.url);
        console.log('📊 Método:', req.method);
        console.log('📊 Usuario en sesión:', req.session.user?.email);
        console.log('📊 Escuela en sesión:', req.session.school?.name);
        
        // Verificar sesión activa
        if (req.session.user) {
            console.log('✅ Usuario encontrado en sesión');
            if (isSessionExpired(req.session)) {
                console.log('❌ Sesión expirada, destruyendo sesión');
                req.session.destroy();
                return redirectToLogin(req, res);
            }
            console.log('✅ Sesión válida, continuando...');
            return next();
        }

        // Verificar token JWT
        const token = getTokenFromHeader(req);
        if (token) {
            const decoded = verifyToken(token);
            const user = await getUserById(decoded.userId);
            
            if (!user || !user.is_active) {
                return res.status(401).json({ error: authConfig.ERROR_MESSAGES.INVALID_TOKEN });
            }

            if (isUserLocked(user)) {
                return res.status(423).json({ 
                    error: authConfig.ERROR_MESSAGES.USER_LOCKED,
                    locked_until: user.locked_until
                });
            }

            // Establecer sesión
            req.session.user = {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                is_active: user.is_active,
                last_login: user.last_login
            };
            req.session.loginTime = Date.now();

            return next();
        }

        console.log('❌ No hay usuario en sesión ni token válido, redirigiendo a login');
        return redirectToLogin(req, res);

    } catch (error) {
        console.error('❌ Error en middleware de autenticación:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

/**
 * Middleware para verificar roles específicos
 * @param {Array} allowedRoles - Roles permitidos
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        if (!allowedRoles.includes(req.session.user.role)) {
            return res.status(403).json({ 
                error: authConfig.ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
                required_roles: allowedRoles,
                user_role: req.session.user.role
            });
        }

        next();
    };
};

/**
 * Middleware para verificar acceso a escuela específica
 */
const requireSchoolAccess = async (req, res, next) => {
    try {
        const schoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;
        
        if (!schoolId) {
            return res.status(400).json({ error: 'ID de escuela requerido' });
        }

        if (!req.session.user) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const userSchool = await getUserSchoolAccess(req.session.user.id, schoolId);
        if (!userSchool) {
            return res.status(403).json({ error: 'No tienes acceso a esta escuela' });
        }

        req.session.school = { 
            id: schoolId, 
            role_in_school: userSchool.role 
        };
        
        next();
    } catch (error) {
        console.error('Error en middleware de acceso a escuela:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

/**
 * Middleware para verificar permisos específicos
 * @param {Array} requiredPermissions - Permisos requeridos
 */
const requirePermission = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        if (!hasPermission(req.session.user.role, requiredPermissions)) {
            return res.status(403).json({ 
                error: authConfig.ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
                required_permissions: requiredPermissions,
                user_role: req.session.user.role
            });
        }

        next();
    };
};

// ========================================
// FUNCIONES AUXILIARES
// ========================================

const isSessionExpired = (session) => {
    return Date.now() - session.loginTime > authConfig.SESSION_TIMEOUT;
};

const getTokenFromHeader = (req) => {
    const authHeader = req.headers.authorization;
    return authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;
};

const getUserById = async (userId) => {
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    return error ? null : user;
};

const isUserLocked = (user) => {
    return user.locked_until && new Date(user.locked_until) > new Date();
};

const getUserSchoolAccess = async (userId, schoolId) => {
    const { data: userSchool, error } = await supabaseAdmin
        .from('user_schools')
        .select('*')
        .eq('user_id', userId)
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .single();

    return error ? null : userSchool;
};

const hasPermission = (userRole, requiredPermissions) => {
    const userPermissions = authConfig.ROLE_PERMISSIONS[userRole] || [];
    
    if (userPermissions.includes('all')) return true;
    
    return requiredPermissions.every(permission => 
        userPermissions.includes(permission)
    );
};

const redirectToLogin = (req, res) => {
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    return res.redirect('/auth/login');
};

module.exports = {
    authMiddleware,
    requireRole,
    requireSchoolAccess,
    requirePermission
};
