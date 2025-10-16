// ========================================
// RUTAS DE GESTIÓN DE ESCUELAS
// ========================================

const express = require('express');
const router = express.Router();

// Importar servicios
const schoolConfigService = require('../services/school-config-service');
const School = require('../models/School');
const { SCHOOL_TYPE_CONFIGS } = require('../config/school-types');
const { supabaseAdmin } = require('../config/database');

// Importar middlewares
const { authMiddleware, requireRole, requireSchoolAccess } = require('../middleware/auth');

// ========================================
// RUTAS DE VISTAS
// ========================================

/**
 * @route GET /schools
 * @desc Mostrar lista de escuelas
 * @access Private
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const schools = await School.findByUserId(req.session.user.id);
        
        res.render('pages/schools/index', {
            title: 'Gestión de Escuelas',
            schools: schools,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error obteniendo escuelas:', error);
        res.render('pages/schools/index', {
            title: 'Gestión de Escuelas',
            schools: [],
            error: 'Error al cargar las escuelas'
        });
    }
});

/**
 * @route GET /schools/create
 * @desc Mostrar formulario de creación de escuela
 * @access Private
 */
router.get('/create', authMiddleware, requireRole(['super_admin', 'director']), (req, res) => {
    res.render('pages/schools/create', {
        title: 'Crear Nueva Escuela',
        schoolTypes: Object.keys(SCHOOL_TYPE_CONFIGS),
        user: req.session.user
    });
});

/**
 * @route GET /schools/success
 * @desc Mostrar página de éxito al crear escuela
 * @access Private
 */
router.get('/success', authMiddleware, (req, res) => {
    const { name, code, city, province, type, address } = req.query;
    
    res.render('pages/schools/success', {
        title: 'Escuela Creada Exitosamente',
        school: {
            name: name || 'Escuela',
            code: code || 'N/A',
            city: city || 'N/A',
            province: province || 'N/A',
            school_type: type || 'N/A',
            address: address || 'N/A'
        },
        user: req.session.user
    });
});

/**
 * @route GET /schools/:id/configure-subjects
 * @desc Mostrar configuración de materias
 * @access Private
 */
router.get('/:id/configure-subjects', authMiddleware, requireSchoolAccess, async (req, res) => {
    try {
        const { id } = req.params;
        const school = await School.findById(id);
        
        if (!school) {
            return res.status(404).render('error', {
                title: 'Escuela no encontrada',
                message: 'La escuela solicitada no existe',
                error: { status: 404 }
            });
        }

        res.render('pages/schools/configure-subjects', {
            title: 'Configurar Materias',
            school: school,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error obteniendo escuela:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error al cargar la configuración',
            error: { status: 500 }
        });
    }
});

/**
 * @route GET /schools/select
 * @desc Mostrar selector de escuela
 * @access Private
 */
router.get('/select', authMiddleware, async (req, res) => {
    try {
        const schools = await School.findByUserId(req.session.user.id);
        
        res.render('pages/schools/select', {
            title: 'Seleccionar Escuela',
            schools: schools,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error obteniendo escuelas:', error);
        res.render('pages/schools/select', {
            title: 'Seleccionar Escuela',
            schools: [],
            error: 'Error al cargar las escuelas'
        });
    }
});

// ========================================
// RUTAS DE API
// ========================================

/**
 * @route POST /schools
 * @desc Crear nueva escuela
 * @access Private
 */
router.post('/', authMiddleware, requireRole(['super_admin', 'director']), async (req, res) => {
    try {
        const schoolData = req.body;
        schoolData.created_by = req.session.user.id;
        
        // Mapear school_type a schoolType para el servicio
        if (schoolData.school_type) {
            schoolData.schoolType = schoolData.school_type;
            delete schoolData.school_type;
        }
        
        const school = await schoolConfigService.configureSchool(schoolData);
        
        res.json({
            success: true,
            school: school,
            message: 'Escuela creada exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

/**
 * @route GET /schools/api
 * @desc Obtener escuelas del usuario (API)
 * @access Private
 */
router.get('/api', authMiddleware, async (req, res) => {
    try {
        const schools = await School.findByUserId(req.session.user.id);
        
        res.json({
            success: true,
            schools: schools
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

/**
 * @route POST /schools/select
 * @desc Seleccionar escuela para el usuario
 * @access Private
 */
router.post('/select', authMiddleware, async (req, res) => {
    try {
        console.log('🔍 Seleccionando escuela...');
        console.log('📊 Usuario en sesión:', req.session.user?.email);
        console.log('📊 Escuela actual en sesión:', req.session.school?.name);
        
        const { schoolId } = req.body;
        
        if (!schoolId) {
            console.log('❌ No se proporcionó schoolId');
            return res.status(400).json({ 
                success: false,
                error: 'ID de escuela es requerido' 
            });
        }

        console.log('🔍 Buscando escuela con ID:', schoolId);

        // Verificar que el usuario tenga acceso a la escuela
        const school = await School.findById(schoolId);
        if (!school) {
            console.log('❌ Escuela no encontrada');
            return res.status(404).json({ 
                success: false,
                error: 'Escuela no encontrada' 
            });
        }

        console.log('✅ Escuela encontrada:', school.name);

        // Actualizar sesión con la escuela seleccionada
        req.session.school = school;
        
        // Forzar guardado de sesión
        req.session.save((err) => {
            if (err) {
                console.error('❌ Error guardando sesión:', err);
                return res.status(500).json({ 
                    success: false,
                    error: 'Error guardando sesión' 
                });
            }
            
            console.log('✅ Sesión guardada correctamente');
            console.log('📊 Escuela en sesión después de guardar:', req.session.school?.name);
            
            res.json({
                success: true,
                school: school,
                message: 'Escuela seleccionada correctamente'
            });
        });
    } catch (error) {
        console.error('❌ Error en selección de escuela:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

/**
 * @route GET /schools/check-code
 * @desc Verificar disponibilidad de código
 * @access Private
 */
router.get('/check-code', authMiddleware, async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).json({ 
                success: false,
                error: 'Código es requerido' 
            });
        }

        const { data: existingSchool, error } = await supabaseAdmin
            .from('schools')
            .select('id')
            .eq('code', code)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        res.json({
            success: true,
            available: !existingSchool,
            code: code
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

/**
 * @route GET /schools/:id
 * @desc Obtener detalles de escuela
 * @access Private
 */
router.get('/:id', authMiddleware, requireSchoolAccess, async (req, res) => {
    try {
        const { id } = req.params;
        const school = await School.findById(id);
        
        if (!school) {
            return res.status(404).render('error', {
                title: 'Escuela no encontrada',
                message: 'La escuela solicitada no existe',
                error: { status: 404 }
            });
        }

        const stats = await school.getStats();
        
        res.render('pages/schools/details', {
            title: school.name,
            school: school,
            stats: stats,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error obteniendo escuela:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error al cargar la escuela',
            error: { status: 500 }
        });
    }
});

module.exports = router;