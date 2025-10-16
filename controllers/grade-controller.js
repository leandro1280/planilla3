// ========================================
// CONTROLADOR DE CALIFICACIONES
// ========================================

const Grade = require('../models/Grade');

class GradeController {
    /**
     * Crear calificación
     */
    static async createGrade(req, res) {
        try {
            const gradeData = req.body;
            const grade = await Grade.create(gradeData);

            res.status(201).json({
                success: true,
                grade
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener calificaciones por estudiante
     */
    static async getGradesByStudent(req, res) {
        try {
            const { studentId } = req.params;
            const { subjectId, period } = req.query;

            const grades = await Grade.findByStudent(studentId, subjectId, period);

            res.json({
                success: true,
                grades
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener calificaciones por materia
     */
    static async getGradesBySubject(req, res) {
        try {
            const { subjectId } = req.params;
            const { period } = req.query;

            const grades = await Grade.findBySubject(subjectId, period);

            res.json({
                success: true,
                grades
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Actualizar calificación
     */
    static async updateGrade(req, res) {
        try {
            const { gradeId } = req.params;
            const updateData = req.body;

            const grade = await Grade.update(gradeId, updateData);

            res.json({
                success: true,
                grade
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Eliminar calificación
     */
    static async deleteGrade(req, res) {
        try {
            const { gradeId } = req.params;
            await Grade.delete(gradeId);

            res.json({
                success: true,
                message: 'Calificación eliminada correctamente'
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Calcular TEA
     */
    static async calculateTEA(req, res) {
        try {
            const { studentId, subjectId, period } = req.body;

            const tea = await Grade.calculateTEA(studentId, subjectId, period);

            res.json({
                success: true,
                tea
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Calcular TEP
     */
    static async calculateTEP(req, res) {
        try {
            const { studentId, subjectId, period } = req.body;

            const tep = await Grade.calculateTEP(studentId, subjectId, period);

            res.json({
                success: true,
                tep
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Calcular TED
     */
    static async calculateTED(req, res) {
        try {
            const { studentId, subjectId, period } = req.body;

            const ted = await Grade.calculateTED(studentId, subjectId, period);

            res.json({
                success: true,
                ted
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener promedio general
     */
    static async getGeneralAverage(req, res) {
        try {
            const { studentId } = req.params;
            const { period } = req.query;

            const average = await Grade.getStudentAverage(studentId, period);

            res.json({
                success: true,
                average
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }
}

module.exports = GradeController;
