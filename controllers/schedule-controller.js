// ========================================
// CONTROLADOR DE HORARIOS
// ========================================

const Schedule = require('../models/Schedule');

class ScheduleController {
    /**
     * Crear horario para curso
     */
    static async createSchedule(req, res) {
        try {
            const { courseId, academicYear } = req.body;
            const schedule = await Schedule.create({ courseId, academicYear });

            res.status(201).json({
                success: true,
                schedule
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener horario de curso
     */
    static async getCourseSchedule(req, res) {
        try {
            const { courseId } = req.params;
            const { academicYear } = req.query;

            const schedule = await Schedule.findByCourse(courseId, academicYear);

            if (!schedule) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Horario no encontrado' 
                });
            }

            const formattedSchedule = await schedule.getFormattedSchedule();

            res.json({
                success: true,
                schedule: formattedSchedule
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Crear bloque de horario
     */
    static async createScheduleBlock(req, res) {
        try {
            const blockData = req.body;
            const block = await Schedule.createBlock(blockData);

            res.status(201).json({
                success: true,
                block
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Actualizar bloque de horario
     */
    static async updateScheduleBlock(req, res) {
        try {
            const { blockId } = req.params;
            const updateData = req.body;

            const block = await Schedule.updateBlock(blockId, updateData);

            res.json({
                success: true,
                block
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Eliminar bloque de horario
     */
    static async deleteScheduleBlock(req, res) {
        try {
            const { blockId } = req.params;
            await Schedule.deleteBlock(blockId);

            res.json({
                success: true,
                message: 'Bloque de horario eliminado correctamente'
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener horario de profesor
     */
    static async getTeacherSchedule(req, res) {
        try {
            const { teacherId } = req.params;
            const { academicYear } = req.query;

            const schedule = await Schedule.getTeacherSchedule(teacherId, academicYear);

            res.json({
                success: true,
                schedule
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Verificar disponibilidad de profesor
     */
    static async checkTeacherAvailability(req, res) {
        try {
            const { teacherId, dayOfWeek, startTime, endTime, academicYear } = req.body;

            const isAvailable = await Schedule.checkTeacherAvailability(
                teacherId, dayOfWeek, startTime, endTime, academicYear
            );

            res.json({
                success: true,
                isAvailable
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener bloques de horario
     */
    static async getScheduleBlocks(req, res) {
        try {
            const { scheduleId } = req.params;
            const blocks = await Schedule.getBlocks(scheduleId);

            res.json({
                success: true,
                blocks
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener horarios por día
     */
    static async getScheduleByDay(req, res) {
        try {
            const { courseId } = req.params;
            const { dayOfWeek, academicYear } = req.query;

            const schedule = await Schedule.findByCourse(courseId, academicYear);
            
            if (!schedule) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Horario no encontrado' 
                });
            }

            const blocks = await schedule.getBlocks();
            const dayBlocks = blocks.filter(block => block.day_of_week === parseInt(dayOfWeek));

            res.json({
                success: true,
                blocks: dayBlocks
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }
}

module.exports = ScheduleController;
