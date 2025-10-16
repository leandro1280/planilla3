// ========================================
// ARCHIVO PRINCIPAL DE AUTENTICACIÓN
// ========================================

// Re-exportar todos los middlewares y servicios
const {
    authMiddleware,
    requireRole,
    requireSchoolAccess,
    requirePermission
} = require('./auth-middleware');

const authService = require('../services/auth-service');

// Exportar configuración
const authConfig = require('../config/auth-config');

// Exportar utilidades
const {
    generateToken,
    verifyToken,
    decodeToken
} = require('../utils/jwt-utils');

const {
    hashPassword,
    verifyPassword,
    validatePasswordStrength
} = require('../utils/password-utils');

module.exports = {
    // Middlewares
    authMiddleware,
    requireRole,
    requireSchoolAccess,
    requirePermission,
    
    // Servicios
    authService,
    
    // Utilidades
    generateToken,
    verifyToken,
    decodeToken,
    hashPassword,
    verifyPassword,
    validatePasswordStrength,
    
    // Configuración
    authConfig
};