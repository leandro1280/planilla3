// ========================================
// CONTROLADOR DE PROMOCIÓN
// ========================================

const promotionSystem = require('../services/promotion-system');

class PromotionController {
    /**
     * Calcular promoción de estudiante
     */
    static async calculateStudentPromotion(req, res) {
        try {
            const { studentId, academicYear } = req.body;
            const result = await promotionSystem.calculateStudentPromotion(studentId, academicYear);

            res.json({
                success: true,
                result
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Calcular promociones de curso
     */
    static async calculateCoursePromotions(req, res) {
        try {
            const { courseId, academicYear } = req.body;
            const results = await promotionSystem.calculateCoursePromotions(courseId, academicYear);

            res.json({
                success: true,
                results
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Ejecutar promociones de curso
     */
    static async executePromotions(req, res) {
        try {
            const { courseId, academicYear } = req.body;
            const results = await promotionSystem.promoteStudentsInCourse(courseId, academicYear);

            res.json({
                success: true,
                results
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener historial de promociones
     */
    static async getPromotionHistory(req, res) {
        try {
            const { courseId } = req.params;
            const { academicYear } = req.query;

            const history = await promotionSystem.getPromotionHistory(courseId, academicYear);

            res.json({
                success: true,
                history
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Registrar resultado de intensificación
     */
    static async recordIntensificationResult(req, res) {
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
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener estudiantes pendientes de promoción
     */
    static async getPendingPromotions(req, res) {
        try {
            const { courseId } = req.params;
            const { academicYear } = req.query;

            const pendingStudents = await promotionSystem.getPendingPromotions(courseId, academicYear);

            res.json({
                success: true,
                pendingStudents
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener estadísticas de promoción
     */
    static async getPromotionStats(req, res) {
        try {
            const { courseId } = req.params;
            const { academicYear } = req.query;

            const stats = await promotionSystem.getPromotionStats(courseId, academicYear);

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }
}

module.exports = PromotionController;
