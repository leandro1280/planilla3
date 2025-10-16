// ========================================
// RUTAS DE AUTENTICACIÓN
// ========================================

const express = require('express');
const router = express.Router();

// Importar servicios
const authService = require('../services/auth-service');

// Importar middlewares
const { authMiddleware, requireRole } = require('../middleware/auth');

// ========================================
// RUTAS DE AUTENTICACIÓN
// ========================================

/**
 * @route POST /api/auth/login
 * @desc Iniciar sesión
 * @access Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
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
        res.status(401).json({ error: error.message });
    }
});

/**
 * @route POST /api/auth/register
 * @desc Registrar usuario
 * @access Public
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, first_name, last_name, dni, role, schoolId } = req.body;

        if (!email || !password || !first_name || !last_name || !dni) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
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

        // Si es director, redirigir a configuración inicial
        if (result.user.role === 'director') {
            res.status(201).json({
                success: true,
                user: result.user,
                token: result.token,
                redirectTo: '/auth/initial-config'
            });
        } else {
            res.status(201).json({
                success: true,
                user: result.user,
                token: result.token
            });
        }

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route POST /api/auth/logout
 * @desc Cerrar sesión
 * @access Private
 */
router.post('/logout', authMiddleware, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.json({ success: true, message: 'Sesión cerrada correctamente' });
    });
});

/**
 * @route GET /api/auth/me
 * @desc Obtener usuario actual
 * @access Private
 */
router.get('/me', authMiddleware, (req, res) => {
    res.json({
        success: true,
        user: req.session.user
    });
});

/**
 * @route POST /api/auth/change-password
 * @desc Cambiar contraseña
 * @access Private
 */
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.session.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
        }

        await authService.changePassword(userId, currentPassword, newPassword);

        res.json({
            success: true,
            message: 'Contraseña cambiada correctamente'
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route POST /api/auth/initial-config
 * @desc Configurar escuela inicialmente
 * @access Private (solo directores)
 */
router.post('/initial-config', authMiddleware, requireRole(['director']), async (req, res) => {
    try {
        const { schoolName, schoolType, turns } = req.body;
        const userId = req.session.user.id;

        if (!schoolName || !schoolType || !turns || turns.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Faltan datos requeridos' 
            });
        }

        // Mapear tipo de escuela a código de base de datos
        const schoolTypeMapping = {
            'primaria': 'primaria',
            'secundaria': 'secundaria_comun',
            'tecnica': 'secundaria_tecnica'
        };

        // Crear escuela
        const { data: school, error: schoolError } = await supabaseAdmin
            .from('schools')
            .insert({
                name: schoolName,
                code: `ESC_${Date.now()}`, // Código temporal
                school_type: schoolTypeMapping[schoolType],
                max_years: 6, // Todas las escuelas tienen 6 años en Buenos Aires
                is_active: true,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (schoolError) throw schoolError;

        // Asignar usuario como director de la escuela
        const { error: userSchoolError } = await supabaseAdmin
            .from('user_schools')
            .insert({
                school_id: school.id,
                user_id: userId,
                role: 'director',
                is_active: true,
                assigned_by: userId
            });

        if (userSchoolError) throw userSchoolError;

        // Crear cursos automáticamente según el tipo de escuela
        const courses = [];
        const currentYear = new Date().getFullYear();
        
        // Determinar años según el tipo de escuela
        let maxYears = 6;
        if (schoolType === 'tecnica') {
            maxYears = 7;
        }
        
        for (let year = 1; year <= maxYears; year++) {
            for (const turn of turns) {
                let cycle = 'basico';
                let yearLabel = '';
                
                if (schoolType === 'primaria') {
                    yearLabel = `${year}° Grado`;
                    cycle = 'primario';
                } else if (schoolType === 'secundaria' || schoolType === 'tecnica') {
                    yearLabel = `${year}° Año`;
                    cycle = year <= 3 ? 'basico' : 'superior';
                }
                
                courses.push({
                    school_id: school.id,
                    year: year.toString(),
                    division: 'A', // Por defecto
                    group_name: null, // Sin grupo por defecto
                    shift: turn,
                    cycle: cycle,
                    academic_year: currentYear,
                    max_students: 30,
                    is_active: true,
                    created_at: new Date().toISOString()
                });
            }
        }

        // Insertar cursos
        const { error: coursesError } = await supabaseAdmin
            .from('courses')
            .insert(courses);

        if (coursesError) throw coursesError;

        // Actualizar sesión con la escuela
        req.session.school = school;

        res.json({
            success: true,
            school: school,
            coursesCreated: courses.length,
            message: 'Escuela configurada correctamente'
        });

    } catch (error) {
        console.error('❌ Error en configuración inicial:', error);
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;