// ========================================
// ARCHIVO PRINCIPAL DE RUTAS API
// ========================================

const express = require('express');
const router = express.Router();

// Importar rutas específicas
const authRoutes = require('./auth');
const schoolRoutes = require('./schools');
const fileRoutes = require('./files');
const scheduleRoutes = require('./schedules');
const promotionRoutes = require('./promotions');
const reportRoutes = require('./reports');
const utilRoutes = require('./utils');

// ========================================
// CONFIGURAR RUTAS
// ========================================

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de escuelas
router.use('/schools', schoolRoutes);

// Rutas de archivos
router.use('/files', fileRoutes);

// Rutas de horarios
router.use('/schedules', scheduleRoutes);

// Rutas de promoción
router.use('/promotions', promotionRoutes);

// Rutas de reportes
router.use('/reports', reportRoutes);

// Rutas de utilidades
router.use('/utils', utilRoutes);

// ========================================
// RUTA DE SALUD DEL SISTEMA
// ========================================

/**
 * @route GET /api/health
 * @desc Verificar estado del sistema
 * @access Public
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
            auth: 'active',
            schools: 'active',
            files: 'active',
            schedules: 'active',
            promotions: 'active',
            reports: 'active'
        }
    });
});

module.exports = router;
