// ========================================
// RUTAS DE HORARIOS
// ========================================

const express = require('express');
const router = express.Router();

// Importar servicios
const scheduleManager = require('../services/schedule-manager');

// Importar middlewares
const { authMiddleware, requireRole, requireSchoolAccess } = require('../middleware/auth');

// ========================================
// RUTAS DE HORARIOS
// ========================================

/**
 * @route POST /api/schedules
 * @desc Crear horario para curso
 * @access Private
 */
router.post('/', authMiddleware, requireRole(['director', 'vicedirector']), async (req, res) => {
    try {
        const { courseId, academicYear } = req.body;
        const schedule = await scheduleManager.createCourseSchedule(courseId, academicYear);
        
        res.status(201).json({
            success: true,
            schedule
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route GET /api/schedules/course/:courseId
 * @desc Obtener horario de curso
 * @access Private
 */
router.get('/course/:courseId', authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { academicYear } = req.query;
        
        const schedule = await scheduleManager.getCourseSchedule(courseId, academicYear);
        
        res.json({
            success: true,
            schedule
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/schedules/blocks
 * @desc Crear bloque de horario
 * @access Private
 */
router.post('/blocks', authMiddleware, requireRole(['director', 'vicedirector']), async (req, res) => {
    try {
        const blockData = req.body;
        const block = await scheduleManager.createScheduleBlock(blockData);
        
        res.status(201).json({
            success: true,
            block
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route PUT /api/schedules/blocks/:blockId
 * @desc Actualizar bloque de horario
 * @access Private
 */
router.put('/blocks/:blockId', authMiddleware, requireRole(['director', 'vicedirector']), async (req, res) => {
    try {
        const { blockId } = req.params;
        const updateData = req.body;
        
        const block = await scheduleManager.updateScheduleBlock(blockId, updateData);
        
        res.json({
            success: true,
            block
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route DELETE /api/schedules/blocks/:blockId
 * @desc Eliminar bloque de horario
 * @access Private
 */
router.delete('/blocks/:blockId', authMiddleware, requireRole(['director', 'vicedirector']), async (req, res) => {
    try {
        const { blockId } = req.params;
        
        await scheduleManager.deleteScheduleBlock(blockId);
        
        res.json({
            success: true,
            message: 'Bloque de horario eliminado correctamente'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route GET /api/schedules/teacher/:teacherId
 * @desc Obtener horario de profesor
 * @access Private
 */
router.get('/teacher/:teacherId', authMiddleware, async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { academicYear } = req.query;
        
        const schedule = await scheduleManager.getTeacherSchedule(teacherId, academicYear);
        
        res.json({
            success: true,
            schedule
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/schedules/availability/check
 * @desc Verificar disponibilidad de profesor
 * @access Private
 */
router.post('/availability/check', authMiddleware, async (req, res) => {
    try {
        const { teacherId, dayOfWeek, startTime, endTime, academicYear } = req.body;
        
        const isAvailable = await scheduleManager.checkTeacherAvailability(
            teacherId, dayOfWeek, startTime, endTime, academicYear
        );
        
        res.json({
            success: true,
            isAvailable
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route PUT /api/schedules/assignments/:assignmentId
 * @desc Actualizar asignación de profesor
 * @access Private
 */
router.put('/assignments/:assignmentId', authMiddleware, requireRole(['director', 'vicedirector']), async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { newTeacherId } = req.body;
        
        const assignment = await scheduleManager.updateTeacherAssignment(assignmentId, newTeacherId);
        
        res.json({
            success: true,
            assignment
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
