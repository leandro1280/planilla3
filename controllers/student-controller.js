// ========================================
// CONTROLADOR DE ESTUDIANTES
// ========================================

const Student = require('../models/Student');
const Grade = require('../models/Grade');

class StudentController {
    /**
     * Crear estudiante
     */
    static async createStudent(req, res) {
        try {
            const studentData = req.body;
            const student = await Student.create(studentData);

            res.status(201).json({
                success: true,
                student
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener estudiantes por curso
     */
    static async getStudentsByCourse(req, res) {
        try {
            const { courseId } = req.params;
            const { academicYear } = req.query;

            const students = await Student.findByCourse(courseId, academicYear);

            res.json({
                success: true,
                students
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener estudiante por ID
     */
    static async getStudentById(req, res) {
        try {
            const { studentId } = req.params;
            const student = await Student.findById(studentId);

            if (!student) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Estudiante no encontrado' 
                });
            }

            res.json({
                success: true,
                student
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Actualizar estudiante
     */
    static async updateStudent(req, res) {
        try {
            const { studentId } = req.params;
            const updateData = req.body;

            const student = await Student.update(studentId, updateData);

            res.json({
                success: true,
                student
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Eliminar estudiante
     */
    static async deleteStudent(req, res) {
        try {
            const { studentId } = req.params;
            await Student.delete(studentId);

            res.json({
                success: true,
                message: 'Estudiante eliminado correctamente'
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener calificaciones del estudiante
     */
    static async getStudentGrades(req, res) {
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
     * Obtener promedio del estudiante
     */
    static async getStudentAverage(req, res) {
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

    /**
     * Importar estudiantes desde archivo
     */
    static async importStudents(req, res) {
        try {
            const { courseId } = req.body;
            
            if (!req.file) {
                return res.status(400).json({ 
                    success: false,
                    error: 'No se proporcionó archivo' 
                });
            }

            const result = await Student.importFromCSV(req.file, courseId);

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
     * Obtener estadísticas del estudiante
     */
    static async getStudentStats(req, res) {
        try {
            const { studentId } = req.params;
            const student = await Student.findById(studentId);

            if (!student) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Estudiante no encontrado' 
                });
            }

            const stats = await student.getStats();

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

module.exports = StudentController;
