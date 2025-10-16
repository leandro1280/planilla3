// ========================================
// CONFIGURACIÓN DE AUTENTICACIÓN Y SEGURIDAD
// ========================================

const authConfig = {
    // Configuración JWT
    JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    
    // Configuración de encriptación
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    
    // Configuración de seguridad
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutos
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas
    
    // Configuración de archivos
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    
    // Roles del sistema
    ROLES: {
        SUPER_ADMIN: 'super_admin',
        DIRECTOR: 'director',
        VICEDIRECTOR: 'vicedirector',
        SECRETARIO: 'secretario',
        PRECEPTOR: 'preceptor',
        PROFESOR: 'profesor'
    },
    
    // Permisos por rol
    ROLE_PERMISSIONS: {
        super_admin: ['all'],
        director: [
            'manage_school',
            'manage_users',
            'view_reports',
            'manage_schedules',
            'manage_students',
            'manage_grades'
        ],
        vicedirector: [
            'manage_school',
            'view_reports',
            'manage_schedules',
            'manage_students'
        ],
        secretario: [
            'manage_students',
            'view_reports',
            'manage_grades'
        ],
        preceptor: [
            'manage_students',
            'manage_grades',
            'view_reports'
        ],
        profesor: [
            'manage_grades',
            'view_students'
        ]
    },
    
    // Validaciones
    VALIDATION_RULES: {
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        DNI_REGEX: /^\d{7,8}$/,
        PASSWORD_MIN_LENGTH: 6,
        NAME_MIN_LENGTH: 2,
        NAME_MAX_LENGTH: 100
    },
    
    // Mensajes de error
    ERROR_MESSAGES: {
        INVALID_CREDENTIALS: 'Credenciales inválidas',
        USER_NOT_FOUND: 'Usuario no encontrado',
        USER_INACTIVE: 'Usuario inactivo',
        USER_LOCKED: 'Usuario bloqueado temporalmente',
        INSUFFICIENT_PERMISSIONS: 'Permisos insuficientes',
        INVALID_TOKEN: 'Token inválido',
        TOKEN_EXPIRED: 'Token expirado',
        EMAIL_ALREADY_EXISTS: 'El email ya está registrado',
        DNI_ALREADY_EXISTS: 'El DNI ya está registrado',
        INVALID_EMAIL: 'Email inválido',
        WEAK_PASSWORD: 'La contraseña es muy débil',
        INVALID_DNI: 'DNI inválido'
    }
};

module.exports = authConfig;
