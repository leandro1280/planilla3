// ========================================
// RUTAS DE PROMOCIÓN
// ========================================

const express = require('express');
const router = express.Router();

// Importar servicios
const promotionSystem = require('../services/promotion-system');

// Importar middlewares
const { authMiddleware, requireRole, requireSchoolAccess } = require('../middleware/auth');

// ========================================
// RUTAS DE PROMOCIÓN
// ========================================

/**
 * @route POST /api/promotions/calculate
 * @desc Calcular promoción de estudiante
 * @access Private
 */
router.post('/calculate', authMiddleware, requireRole(['director', 'preceptor']), async (req, res) => {
    try {
        const { studentId, academicYear } = req.body;
        const result = await promotionSystem.calculateStudentPromotion(studentId, academicYear);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route POST /api/promotions/course
 * @desc Calcular promociones de curso
 * @access Private
 */
router.post('/course', authMiddleware, requireRole(['director', 'preceptor']), async (req, res) => {
    try {
        const { courseId, academicYear } = req.body;
        const results = await promotionSystem.calculateCoursePromotions(courseId, academicYear);
        
        res.json({
            success: true,
            results
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route POST /api/promotions/execute
 * @desc Ejecutar promociones de curso
 * @access Private
 */
router.post('/execute', authMiddleware, requireRole(['director']), async (req, res) => {
    try {
        const { courseId, academicYear } = req.body;
        const results = await promotionSystem.promoteStudentsInCourse(courseId, academicYear);
        
        res.json({
            success: true,
            results
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route GET /api/promotions/history/:courseId
 * @desc Obtener historial de promociones
 * @access Private
 */
router.get('/history/:courseId', authMiddleware, requireSchoolAccess, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { academicYear } = req.query;
        
        const history = await promotionSystem.getPromotionHistory(courseId, academicYear);
        
        res.json({
            success: true,
            history
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/promotions/intensification
 * @desc Registrar resultado de intensificación
 * @access Private
 */
router.post('/intensification', authMiddleware, requireRole(['director', 'preceptor']), async (req, res) => {
    try {
        const { studentId, subjectId, grade, period } = req.body;
        
        const result = await promotionSystem.recordIntensificationResult(
            studentId, subjectId, grade, period
        );
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route GET /api/promotions/pending/:courseId
 * @desc Obtener estudiantes pendientes de promoción
 * @access Private
 */
router.get('/pending/:courseId', authMiddleware, requireSchoolAccess, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { academicYear } = req.query;
        
        const pendingStudents = await promotionSystem.getPendingPromotions(courseId, academicYear);
        
        res.json({
            success: true,
            pendingStudents
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
