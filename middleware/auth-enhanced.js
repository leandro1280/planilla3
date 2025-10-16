// ========================================
// SISTEMA DE AUTENTICACIÓN MEJORADO - VERSIÓN COMERCIAL
// ========================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase, supabaseAdmin } = require('../config/database');

// ========================================
// CONFIGURACIÓN DE SEGURIDAD
// ========================================
const SECURITY_CONFIG = {
    JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutos
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24 horas
};

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN MEJORADO
// ========================================
const authMiddleware = async (req, res, next) => {
    try {
        // Verificar si hay sesión activa
        if (req.session.user) {
            // Verificar si la sesión no ha expirado
            if (Date.now() - req.session.loginTime > SECURITY_CONFIG.SESSION_TIMEOUT) {
                req.session.destroy();
                return redirectToLogin(req, res);
            }
            return next();
        }

        // Verificar token JWT en header Authorization
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            
            try {
                const decoded = jwt.verify(token, SECURITY_CONFIG.JWT_SECRET);
                
                // Verificar que el usuario existe y está activo
                const { data: user, error } = await supabaseAdmin
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

                // Verificar si el usuario está bloqueado
                if (user.locked_until && new Date(user.locked_until) > new Date()) {
                    return res.status(423).json({ 
                        error: 'Usuario bloqueado temporalmente',
                        locked_until: user.locked_until
                    });
                }

                // Agregar usuario a la sesión
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
            } catch (jwtError) {
                return res.status(401).json({ error: 'Token inválido' });
            }
        }

        // Si es una petición AJAX, devolver JSON
        if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Redirigir a login para peticiones normales
        return redirectToLogin(req, res);
    } catch (error) {
        console.error('Error en middleware de autenticación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ========================================
// MIDDLEWARE DE VERIFICACIÓN DE ROLES
// ========================================
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        if (!allowedRoles.includes(req.session.user.role)) {
            return res.status(403).json({ 
                error: 'Permisos insuficientes',
                required_roles: allowedRoles,
                user_role: req.session.user.role
            });
        }

        next();
    };
};

// ========================================
// MIDDLEWARE DE VERIFICACIÓN DE ESCUELA
// ========================================
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
        const { data: userSchool, error } = await supabaseAdmin
            .from('user_schools')
            .select('*')
            .eq('user_id', req.session.user.id)
            .eq('school_id', schoolId)
            .eq('is_active', true)
            .single();

        if (error || !userSchool) {
            return res.status(403).json({ error: 'No tienes acceso a esta escuela' });
        }

        // Agregar información de la escuela a la sesión
        req.session.school = { 
            id: schoolId, 
            role_in_school: userSchool.role 
        };
        
        next();
    } catch (error) {
        console.error('Error en middleware de acceso a escuela:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ========================================
// FUNCIONES DE AUTENTICACIÓN
// ========================================

// Función para generar token JWT
const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user.id, 
            email: user.email, 
            role: user.role,
            schoolId: user.schoolId || null
        },
        SECURITY_CONFIG.JWT_SECRET,
        { expiresIn: SECURITY_CONFIG.JWT_EXPIRES_IN }
    );
};

// Función para verificar contraseña
const verifyPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

// Función para encriptar contraseña
const hashPassword = async (password) => {
    return await bcrypt.hash(password, SECURITY_CONFIG.BCRYPT_ROUNDS);
};

// Función de login con seguridad mejorada
const login = async (email, password, req) => {
    try {
        // Buscar usuario
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            // Log intento fallido
            await logFailedLogin(email, req.ip, 'Usuario no encontrado');
            throw new Error('Credenciales inválidas');
        }

        // Verificar si el usuario está bloqueado
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            await logFailedLogin(email, req.ip, 'Usuario bloqueado');
            throw new Error('Usuario bloqueado temporalmente');
        }

        // Verificar si el usuario está activo
        if (!user.is_active) {
            await logFailedLogin(email, req.ip, 'Usuario inactivo');
            throw new Error('Usuario inactivo');
        }

        // Verificar contraseña
        const isValidPassword = await verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            // Incrementar intentos fallidos
            await incrementFailedAttempts(user.id);
            await logFailedLogin(email, req.ip, 'Contraseña incorrecta');
            throw new Error('Credenciales inválidas');
        }

        // Resetear intentos fallidos
        await resetFailedAttempts(user.id);

        // Actualizar último login
        await updateLastLogin(user.id, req.ip);

        // Obtener escuelas del usuario
        const schools = await getUserSchools(user.id);

        // Generar token
        const token = generateToken(user);

        // Log login exitoso
        await logSuccessfulLogin(user.id, req.ip);

        return {
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                is_active: user.is_active,
                last_login: user.last_login
            },
            schools,
            token
        };
    } catch (error) {
        throw error;
    }
};

// Función de registro con validaciones
const register = async (userData) => {
    try {
        const { email, password, first_name, last_name, dni, role, schoolId } = userData;

        // Validar email único
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existingUser) {
            throw new Error('El email ya está registrado');
        }

        // Validar DNI único
        const { data: existingDNI } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('dni', dni)
            .single();

        if (existingDNI) {
            throw new Error('El DNI ya está registrado');
        }

        // Encriptar contraseña
        const password_hash = await hashPassword(password);

        // Crear usuario
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .insert({
                email: email.toLowerCase(),
                password_hash,
                first_name,
                last_name,
                dni,
                role: role || 'profesor',
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        // Si se proporciona escuela, asignar usuario
        if (schoolId) {
            await assignUserToSchool(user.id, schoolId, role);
        }

        // Generar token
        const token = generateToken(user);

        // Log registro exitoso
        await logUserRegistration(user.id);

        return {
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                is_active: user.is_active
            },
            token
        };
    } catch (error) {
        throw error;
    }
};

// ========================================
// FUNCIONES AUXILIARES
// ========================================

// Obtener escuelas del usuario
const getUserSchools = async (userId) => {
    const { data, error } = await supabaseAdmin
        .from('user_schools')
        .select(`
            *,
            schools (*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

    if (error) throw error;

    return data.map(item => ({
        ...item.schools,
        role_in_school: item.role
    }));
};

// Asignar usuario a escuela
const assignUserToSchool = async (userId, schoolId, role) => {
    const { error } = await supabaseAdmin
        .from('user_schools')
        .insert({
            user_id: userId,
            school_id: schoolId,
            role: role || 'profesor',
            is_active: true
        });

    if (error) throw error;
};

// Incrementar intentos fallidos
const incrementFailedAttempts = async (userId) => {
    const { error } = await supabaseAdmin
        .from('users')
        .update({ 
            failed_login_attempts: supabaseAdmin.rpc('increment', { 
                column_name: 'failed_login_attempts' 
            })
        })
        .eq('id', userId);

    if (error) throw error;

    // Verificar si debe bloquearse
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('failed_login_attempts')
        .eq('id', userId)
        .single();

    if (user.failed_login_attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
        const lockoutUntil = new Date(Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION);
        await supabaseAdmin
            .from('users')
            .update({ locked_until: lockoutUntil.toISOString() })
            .eq('id', userId);
    }
};

// Resetear intentos fallidos
const resetFailedAttempts = async (userId) => {
    const { error } = await supabaseAdmin
        .from('users')
        .update({ 
            failed_login_attempts: 0,
            locked_until: null
        })
        .eq('id', userId);

    if (error) throw error;
};

// Actualizar último login
const updateLastLogin = async (userId, ipAddress) => {
    const { error } = await supabaseAdmin
        .from('users')
        .update({ 
            last_login: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) throw error;
};

// ========================================
// FUNCIONES DE LOGGING
// ========================================

// Log de login exitoso
const logSuccessfulLogin = async (userId, ipAddress) => {
    console.log(`✅ Login exitoso: Usuario ${userId} desde IP ${ipAddress}`);
    // Aquí podrías guardar en una tabla de logs si quieres
};

// Log de login fallido
const logFailedLogin = async (email, ipAddress, reason) => {
    console.log(`❌ Login fallido: ${email} desde IP ${ipAddress} - ${reason}`);
    // Aquí podrías guardar en una tabla de logs si quieres
};

// Log de registro de usuario
const logUserRegistration = async (userId) => {
    console.log(`📝 Usuario registrado: ${userId}`);
};

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

// Redirigir a login
const redirectToLogin = (req, res) => {
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    return res.redirect('/auth/login');
};

// Verificar permisos específicos
const hasPermission = (userRole, requiredPermissions) => {
    const rolePermissions = {
        'super_admin': ['all'],
        'director': ['manage_school', 'manage_users', 'view_reports', 'manage_schedules'],
        'vicedirector': ['manage_school', 'view_reports', 'manage_schedules'],
        'secretario': ['manage_students', 'view_reports'],
        'preceptor': ['manage_students', 'manage_grades', 'view_reports'],
        'profesor': ['manage_grades', 'view_students']
    };

    const userPermissions = rolePermissions[userRole] || [];
    
    if (userPermissions.includes('all')) return true;
    
    return requiredPermissions.every(permission => 
        userPermissions.includes(permission)
    );
};

// Middleware para verificar permisos específicos
const requirePermission = (permissions) => {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        if (!hasPermission(req.session.user.role, permissions)) {
            return res.status(403).json({ 
                error: 'Permisos insuficientes',
                required_permissions: permissions,
                user_role: req.session.user.role
            });
        }

        next();
    };
};

// ========================================
// EXPORTAR FUNCIONES
// ========================================
module.exports = {
    // Middlewares
    authMiddleware,
    requireRole,
    requireSchoolAccess,
    requirePermission,
    
    // Funciones de autenticación
    login,
    register,
    generateToken,
    verifyPassword,
    hashPassword,
    
    // Funciones auxiliares
    getUserSchools,
    assignUserToSchool,
    hasPermission,
    
    // Configuración
    SECURITY_CONFIG
};
