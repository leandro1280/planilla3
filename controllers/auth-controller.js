// ========================================
// CONTROLADOR DE AUTENTICACIÓN
// ========================================

const authService = require('../services/auth-service');

class AuthController {
    /**
     * Iniciar sesión
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Email y contraseña son requeridos' 
                });
            }

            const result = await authService.login(email, password, req);
            
            // Establecer sesión
            req.session.user = result.user;
            req.session.loginTime = Date.now();

            res.json({
                success: true,
                user: result.user,
                schools: result.schools,
                token: result.token
            });

        } catch (error) {
            res.status(401).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Registrar usuario
     */
    static async register(req, res) {
        try {
            const { email, password, first_name, last_name, dni, role, schoolId } = req.body;

            if (!email || !password || !first_name || !last_name || !dni) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Todos los campos son requeridos' 
                });
            }

            const result = await authService.register({
                email,
                password,
                first_name,
                last_name,
                dni,
                role,
                schoolId
            });

            res.status(201).json({
                success: true,
                user: result.user,
                token: result.token
            });

        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Cerrar sesión
     */
    static async logout(req, res) {
        try {
            req.session.destroy((err) => {
                if (err) {
                    return res.status(500).json({ 
                        success: false,
                        error: 'Error al cerrar sesión' 
                    });
                }
                res.json({ 
                    success: true, 
                    message: 'Sesión cerrada correctamente' 
                });
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener usuario actual
     */
    static async getCurrentUser(req, res) {
        try {
            res.json({
                success: true,
                user: req.session.user
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Cambiar contraseña
     */
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.session.user.id;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Contraseña actual y nueva son requeridas' 
                });
            }

            await authService.changePassword(userId, currentPassword, newPassword);

            res.json({
                success: true,
                message: 'Contraseña cambiada correctamente'
            });

        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Cambiar escuela
     */
    static async switchSchool(req, res) {
        try {
            const { schoolId } = req.body;
            const userId = req.session.user.id;

            if (!schoolId) {
                return res.status(400).json({ 
                    success: false,
                    error: 'ID de escuela es requerido' 
                });
            }

            const result = await authService.switchSchool(userId, schoolId);
            
            // Actualizar sesión
            req.session.user = result.user;

            res.json({
                success: true,
                user: result.user,
                message: 'Escuela cambiada correctamente'
            });

        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }
}

module.exports = AuthController;
