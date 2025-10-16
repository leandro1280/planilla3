// ========================================
// UTILIDADES DE CONTRASEÑAS Y ENCRIPTACIÓN
// ========================================

const bcrypt = require('bcryptjs');
const authConfig = require('../config/auth-config');

/**
 * Encripta una contraseña usando bcrypt
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} - Contraseña encriptada
 */
const hashPassword = async (password) => {
    try {
        return await bcrypt.hash(password, authConfig.BCRYPT_ROUNDS);
    } catch (error) {
        throw new Error(`Error al encriptar contraseña: ${error.message}`);
    }
};

/**
 * Verifica si una contraseña coincide con su hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash de la contraseña
 * @returns {Promise<boolean>} - True si coincide
 */
const verifyPassword = async (password, hash) => {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        throw new Error(`Error al verificar contraseña: ${error.message}`);
    }
};

/**
 * Valida la fortaleza de una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} - Resultado de la validación
 */
const validatePasswordStrength = (password) => {
    const errors = [];
    
    if (!password || password.length < authConfig.VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
        errors.push(`La contraseña debe tener al menos ${authConfig.VALIDATION_RULES.PASSWORD_MIN_LENGTH} caracteres`);
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('La contraseña debe contener al menos una letra mayúscula');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('La contraseña debe contener al menos una letra minúscula');
    }
    
    if (!/\d/.test(password)) {
        errors.push('La contraseña debe contener al menos un número');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        strength: calculatePasswordStrength(password)
    };
};

/**
 * Calcula la fortaleza de una contraseña
 * @param {string} password - Contraseña a evaluar
 * @returns {string} - Nivel de fortaleza (weak, medium, strong)
 */
const calculatePasswordStrength = (password) => {
    let score = 0;
    
    // Longitud
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complejidad
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z\d]/.test(password)) score += 1;
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
};

module.exports = {
    hashPassword,
    verifyPassword,
    validatePasswordStrength,
    calculatePasswordStrength
};
