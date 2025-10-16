// ========================================
// RUTAS DE UTILIDADES
// ========================================

const express = require('express');
const router = express.Router();

// Importar middlewares
const { authMiddleware, requireRole } = require('../middleware/auth');

// ========================================
// RUTAS DE UTILIDADES
// ========================================

/**
 * @route GET /api/utils/config
 * @desc Obtener configuración del sistema
 * @access Private
 */
router.get('/config', authMiddleware, (req, res) => {
    res.json({
        success: true,
        config: {
            maxFileSize: '10MB',
            supportedFormats: ['.xlsx', '.xls', '.csv', '.txt'],
            maxStudentsPerImport: 1000,
            sessionTimeout: '24h',
            supportedSchoolTypes: [
                'primaria',
                'secundaria_comun',
                'secundaria_tecnica',
                'agrotecnica',
                'artistica',
                'adultos'
            ],
            evaluationSystems: ['trimestral', 'cuatrimestral'],
            gradeScales: {
                min: 1,
                max: 10,
                passing: 6
            }
        }
    });
});

/**
 * @route GET /api/utils/roles
 * @desc Obtener roles disponibles
 * @access Private
 */
router.get('/roles', authMiddleware, (req, res) => {
    const roles = [
        {
            id: 'super_admin',
            name: 'Super Administrador',
            description: 'Acceso total al sistema',
            permissions: ['all']
        },
        {
            id: 'director',
            name: 'Director',
            description: 'Administración de la escuela',
            permissions: ['school_management', 'user_management', 'reports']
        },
        {
            id: 'vicedirector',
            name: 'Vicedirector',
            description: 'Gestión académica',
            permissions: ['schedule_management', 'reports']
        },
        {
            id: 'preceptor',
            name: 'Preceptor',
            description: 'Gestión de estudiantes y notas',
            permissions: ['student_management', 'grade_management', 'reports']
        },
        {
            id: 'professor',
            name: 'Profesor',
            description: 'Carga de notas y visualización',
            permissions: ['grade_management', 'view_reports']
        }
    ];
    
    res.json({
        success: true,
        roles
    });
});

/**
 * @route GET /api/utils/health
 * @desc Verificar estado de servicios
 * @access Private
 */
router.get('/health', authMiddleware, async (req, res) => {
    try {
        const { supabase } = require('../config/database');
        
        // Verificar conexión a base de datos
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        const dbStatus = error ? 'error' : 'ok';
        
        res.json({
            success: true,
            services: {
                database: dbStatus,
                authentication: 'ok',
                fileProcessing: 'ok',
                reportGeneration: 'ok'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error verificando servicios',
            details: error.message
        });
    }
});

/**
 * @route GET /api/utils/version
 * @desc Obtener versión del sistema
 * @access Public
 */
router.get('/version', (req, res) => {
    res.json({
        success: true,
        version: '1.0.0',
        build: '2024.01.15',
        features: [
            'Gestión de escuelas',
            'Procesamiento de archivos',
            'Sistema de horarios',
            'Promoción automática',
            'Generación de reportes',
            'Autenticación y autorización'
        ]
    });
});

module.exports = router;
