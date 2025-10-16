// ========================================
// SERVICIOS DE AUTENTICACIÓN Y REGISTRO
// ========================================

const { supabaseAdmin } = require('../config/database');
const { generateToken } = require('../utils/jwt-utils');
const { hashPassword, verifyPassword } = require('../utils/password-utils');
const authConfig = require('../config/auth-config');

/**
 * Servicio principal de autenticación
 */
class AuthService {
    
    /**
     * Autentica un usuario con email y contraseña
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña
     * @param {Object} req - Request object para logging
     * @returns {Promise<Object>} - Datos del usuario y token
     */
    async login(email, password, req) {
        try {
            const user = await this.findUserByEmail(email);
            
            if (!user) {
                await this.logFailedLogin(email, req.ip, 'Usuario no encontrado');
                throw new Error(authConfig.ERROR_MESSAGES.INVALID_CREDENTIALS);
            }

            if (this.isUserLocked(user)) {
                await this.logFailedLogin(email, req.ip, 'Usuario bloqueado');
                throw new Error(authConfig.ERROR_MESSAGES.USER_LOCKED);
            }

            if (!user.is_active) {
                await this.logFailedLogin(email, req.ip, 'Usuario inactivo');
                throw new Error(authConfig.ERROR_MESSAGES.USER_INACTIVE);
            }

            const isValidPassword = await verifyPassword(password, user.password_hash);
            if (!isValidPassword) {
                await this.incrementFailedAttempts(user.id);
                await this.logFailedLogin(email, req.ip, 'Contraseña incorrecta');
                throw new Error(authConfig.ERROR_MESSAGES.INVALID_CREDENTIALS);
            }

            await this.resetFailedAttempts(user.id);
            await this.updateLastLogin(user.id, req.ip);

            const schools = await this.getUserSchools(user.id);
            const token = generateToken(user);

            await this.logSuccessfulLogin(user.id, req.ip);

            return {
                user: this.sanitizeUser(user),
                schools,
                token
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Registra un nuevo usuario
     * @param {Object} userData - Datos del usuario
     * @returns {Promise<Object>} - Usuario creado y token
     */
    async register(userData) {
        try {
            const { email, password, first_name, last_name, dni, role, schoolId } = userData;

            await this.validateUserData(userData);

            const password_hash = await hashPassword(password);

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

            if (schoolId) {
                await this.assignUserToSchool(user.id, schoolId, role);
            }

            const token = generateToken(user);
            await this.logUserRegistration(user.id);

            return {
                user: this.sanitizeUser(user),
                token
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Cambia la contraseña de un usuario
     * @param {string} userId - ID del usuario
     * @param {string} currentPassword - Contraseña actual
     * @param {string} newPassword - Nueva contraseña
     * @returns {Promise<boolean>} - True si se cambió exitosamente
     */
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.findUserById(userId);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            const isValidCurrentPassword = await verifyPassword(currentPassword, user.password_hash);
            if (!isValidCurrentPassword) {
                throw new Error('Contraseña actual incorrecta');
            }

            const newPasswordHash = await hashPassword(newPassword);

            const { error } = await supabaseAdmin
                .from('users')
                .update({ 
                    password_hash: newPasswordHash,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;

            await this.logPasswordChange(userId);
            return true;

        } catch (error) {
            throw error;
        }
    }

    // ========================================
    // MÉTODOS AUXILIARES
    // ========================================

    async findUserByEmail(email) {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        return error ? null : user;
    }

    async findUserById(userId) {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        return error ? null : user;
    }

    async validateUserData(userData) {
        const { email, password, first_name, last_name, dni } = userData;

        // Validar email único
        const existingUser = await this.findUserByEmail(email);
        if (existingUser) {
            throw new Error(authConfig.ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
        }

        // Validar DNI único
        const { data: existingDNI } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('dni', dni)
            .single();

        if (existingDNI) {
            throw new Error(authConfig.ERROR_MESSAGES.DNI_ALREADY_EXISTS);
        }

        // Validar email
        if (!authConfig.VALIDATION_RULES.EMAIL_REGEX.test(email)) {
            throw new Error(authConfig.ERROR_MESSAGES.INVALID_EMAIL);
        }

        // Validar DNI
        if (!authConfig.VALIDATION_RULES.DNI_REGEX.test(dni)) {
            throw new Error(authConfig.ERROR_MESSAGES.INVALID_DNI);
        }
    }

    async getUserSchools(userId) {
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
    }

    async assignUserToSchool(userId, schoolId, role) {
        const { error } = await supabaseAdmin
            .from('user_schools')
            .insert({
                user_id: userId,
                school_id: schoolId,
                role: role || 'profesor',
                is_active: true
            });

        if (error) throw error;
    }

    async incrementFailedAttempts(userId) {
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
        const user = await this.findUserById(userId);
        if (user.failed_login_attempts >= authConfig.MAX_LOGIN_ATTEMPTS) {
            const lockoutUntil = new Date(Date.now() + authConfig.LOCKOUT_DURATION);
            await supabaseAdmin
                .from('users')
                .update({ locked_until: lockoutUntil.toISOString() })
                .eq('id', userId);
        }
    }

    async resetFailedAttempts(userId) {
        const { error } = await supabaseAdmin
            .from('users')
            .update({ 
                failed_login_attempts: 0,
                locked_until: null
            })
            .eq('id', userId);

        if (error) throw error;
    }

    async updateLastLogin(userId, ipAddress) {
        const { error } = await supabaseAdmin
            .from('users')
            .update({ 
                last_login: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) throw error;
    }

    isUserLocked(user) {
        return user.locked_until && new Date(user.locked_until) > new Date();
    }

    sanitizeUser(user) {
        const { password_hash, failed_login_attempts, locked_until, ...sanitized } = user;
        return sanitized;
    }

    // ========================================
    // LOGGING METHODS
    // ========================================

    async logSuccessfulLogin(userId, ipAddress) {
        console.log(`✅ Login exitoso: Usuario ${userId} desde IP ${ipAddress}`);
    }

    async logFailedLogin(email, ipAddress, reason) {
        console.log(`❌ Login fallido: ${email} desde IP ${ipAddress} - ${reason}`);
    }

    async logUserRegistration(userId) {
        console.log(`📝 Usuario registrado: ${userId}`);
    }

    async logPasswordChange(userId) {
        console.log(`🔑 Contraseña cambiada: Usuario ${userId}`);
    }
}

module.exports = new AuthService();
