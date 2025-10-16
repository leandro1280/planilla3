// ========================================
// UTILIDADES JWT (JSON WEB TOKENS)
// ========================================

const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth-config');

/**
 * Genera un token JWT para un usuario
 * @param {Object} user - Datos del usuario
 * @param {string} user.id - ID del usuario
 * @param {string} user.email - Email del usuario
 * @param {string} user.role - Rol del usuario
 * @param {string} user.schoolId - ID de la escuela (opcional)
 * @returns {string} - Token JWT
 */
const generateToken = (user) => {
    try {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            schoolId: user.schoolId || null,
            iat: Math.floor(Date.now() / 1000)
        };

        return jwt.sign(payload, authConfig.JWT_SECRET, {
            expiresIn: authConfig.JWT_EXPIRES_IN
        });
    } catch (error) {
        throw new Error(`Error al generar token: ${error.message}`);
    }
};

/**
 * Verifica y decodifica un token JWT
 * @param {string} token - Token JWT
 * @returns {Object} - Datos decodificados del token
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, authConfig.JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error(authConfig.ERROR_MESSAGES.TOKEN_EXPIRED);
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error(authConfig.ERROR_MESSAGES.INVALID_TOKEN);
        } else {
            throw new Error(`Error al verificar token: ${error.message}`);
        }
    }
};

/**
 * Decodifica un token sin verificar (para inspección)
 * @param {string} token - Token JWT
 * @returns {Object} - Datos decodificados
 */
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        throw new Error(`Error al decodificar token: ${error.message}`);
    }
};

/**
 * Obtiene el tiempo restante de un token
 * @param {string} token - Token JWT
 * @returns {number} - Segundos restantes
 */
const getTokenTimeRemaining = (token) => {
    try {
        const decoded = decodeToken(token);
        if (!decoded.exp) return 0;
        
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, decoded.exp - now);
    } catch (error) {
        return 0;
    }
};

/**
 * Verifica si un token está próximo a expirar
 * @param {string} token - Token JWT
 * @param {number} thresholdMinutes - Minutos antes de expirar (default: 30)
 * @returns {boolean} - True si está próximo a expirar
 */
const isTokenExpiringSoon = (token, thresholdMinutes = 30) => {
    const timeRemaining = getTokenTimeRemaining(token);
    const thresholdSeconds = thresholdMinutes * 60;
    
    return timeRemaining > 0 && timeRemaining <= thresholdSeconds;
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    getTokenTimeRemaining,
    isTokenExpiringSoon
};
