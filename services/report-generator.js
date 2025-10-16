// ========================================
// GENERADOR DE REPORTES Y BOLETINES
// ========================================

const { supabaseAdmin } = require('../config/database');
const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');

/**
 * Servicio para generación de reportes y boletines
 */
class ReportGenerator {
    
    constructor() {
        this.reportsPath = path.join(__dirname, '../public/reports');
        this.ensureReportsDirectory();
    }

    /**
     * Asegura que el directorio de reportes existe
     */
    async ensureReportsDirectory() {
        try {
            await fs.mkdir(this.reportsPath, { recursive: true });
        } catch (error) {
            console.error('Error al crear directorio de reportes:', error);
        }
    }

    /**
     * Genera boletines de estudiantes
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise<Object>} - Información del reporte generado
     */
    async generateStudentReportCards(params) {
        try {
            const { schoolId, courseId, period, format = 'excel' } = params;

            // Obtener datos de estudiantes
            const studentsData = await this.getStudentsData(schoolId, courseId, period);

            // Crear reporte
            const reportData = await this.createReportRecord('boletines', params, schoolId);

            let filePath;
            if (format === 'excel') {
                filePath = await this.generateExcelReportCards(studentsData, reportData.id);
            } else if (format === 'pdf') {
                filePath = await this.generatePDFReportCards(studentsData, reportData.id);
            } else {
                throw new Error('Formato no soportado');
            }

            // Actualizar registro con ruta del archivo
            await this.updateReportRecord(reportData.id, filePath, 'completed');

            return {
                reportId: reportData.id,
                filePath,
                totalStudents: studentsData.length,
                status: 'completed'
            };

        } catch (error) {
            throw new Error(`Error al generar boletines: ${error.message}`);
        }
    }

    /**
     * Genera reporte de estadísticas
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise<Object>} - Información del reporte generado
     */
    async generateStatisticsReport(params) {
        try {
            const { schoolId, courseId, period, reportType = 'performance' } = params;

            // Obtener estadísticas
            const statistics = await this.getStatisticsData(schoolId, courseId, period, reportType);

            // Crear reporte
            const reportData = await this.createReportRecord('estadisticas', params, schoolId);

            const filePath = await this.generateExcelStatistics(statistics, reportData.id);

            // Actualizar registro
            await this.updateReportRecord(reportData.id, filePath, 'completed');

            return {
                reportId: reportData.id,
                filePath,
                statistics,
                status: 'completed'
            };

        } catch (error) {
            throw new Error(`Error al generar reporte de estadísticas: ${error.message}`);
        }
    }

    /**
     * Genera reporte de asistencia
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise<Object>} - Información del reporte generado
     */
    async generateAttendanceReport(params) {
        try {
            const { schoolId, courseId, startDate, endDate } = params;

            // Obtener datos de asistencia
            const attendanceData = await this.getAttendanceData(schoolId, courseId, startDate, endDate);

            // Crear reporte
            const reportData = await this.createReportRecord('asistencia', params, schoolId);

            const filePath = await this.generateExcelAttendance(attendanceData, reportData.id);

            // Actualizar registro
            await this.updateReportRecord(reportData.id, filePath, 'completed');

            return {
                reportId: reportData.id,
                filePath,
                totalRecords: attendanceData.length,
                status: 'completed'
            };

        } catch (error) {
            throw new Error(`Error al generar reporte de asistencia: ${error.message}`);
        }
    }

    /**
     * Genera reporte de TEA/TEP/TED
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise<Object>} - Información del reporte generado
     */
    async generateTeaTepTedReport(params) {
        try {
            const { schoolId, courseId, period } = params;

            // Obtener datos de TEA/TEP/TED
            const evaluationData = await this.getTeaTepTedData(schoolId, courseId, period);

            // Crear reporte
            const reportData = await this.createReportRecord('tea_tep_ted', params, schoolId);

            const filePath = await this.generateExcelTeaTepTed(evaluationData, reportData.id);

            // Actualizar registro
            await this.updateReportRecord(reportData.id, filePath, 'completed');

            return {
                reportId: reportData.id,
                filePath,
                totalEvaluations: evaluationData.length,
                status: 'completed'
            };

        } catch (error) {
            throw new Error(`Error al generar reporte TEA/TEP/TED: ${error.message}`);
        }
    }

    /**
     * Obtiene datos de estudiantes para boletines
     * @param {string} schoolId - ID de la escuela
     * @param {string} courseId - ID del curso
     * @param {number} period - Período
     * @returns {Promise<Array>} - Datos de estudiantes
     */
    async getStudentsData(schoolId, courseId, period) {
        try {
            const { data: students, error } = await supabaseAdmin
                .from('students')
                .select(`
                    *,
                    grades!inner (
                        *,
                        course_subjects (
                            school_subjects (name, code)
                        )
                    ),
                    courses (year, division, schools (name))
                `)
                .eq('school_id', schoolId)
                .eq('course_id', courseId)
                .eq('is_active', true);

            if (error) throw error;

            // Procesar datos para boletines
            return students.map(student => ({
                id: student.id,
                name: `${student.first_name} ${student.last_name}`,
                dni: student.dni,
                course: `${student.courses?.year}° ${student.courses?.division}`,
                school: student.courses?.schools?.name,
                grades: this.processStudentGrades(student.grades, period)
            }));

        } catch (error) {
            throw new Error(`Error al obtener datos de estudiantes: ${error.message}`);
        }
    }

    /**
     * Procesa las notas de un estudiante
     * @param {Array} grades - Notas del estudiante
     * @param {number} period - Período
     * @returns {Array} - Notas procesadas
     */
    processStudentGrades(grades, period) {
        const processedGrades = {};

        grades.forEach(grade => {
            if (grade.quarter === period && grade.grade_type === 'informe') {
                const subjectName = grade.course_subjects?.school_subjects?.name || 'Sin materia';
                
                if (!processedGrades[subjectName]) {
                    processedGrades[subjectName] = {
                        subject: subjectName,
                        numericGrade: grade.numeric_grade,
                        evaluation: grade.tea_tep_ted,
                        attendance: grade.attendance_percentage
                    };
                }
            }
        });

        return Object.values(processedGrades);
    }

    /**
     * Obtiene datos de estadísticas
     * @param {string} schoolId - ID de la escuela
     * @param {string} courseId - ID del curso
     * @param {number} period - Período
     * @param {string} reportType - Tipo de reporte
     * @returns {Promise<Object>} - Datos de estadísticas
     */
    async getStatisticsData(schoolId, courseId, period, reportType) {
        try {
            const { data: grades, error } = await supabaseAdmin
                .from('grades')
                .select(`
                    *,
                    students (course_id),
                    course_subjects (
                        school_subjects (name, code)
                    )
                `)
                .eq('students.course_id', courseId)
                .eq('quarter', period)
                .eq('grade_type', 'informe');

            if (error) throw error;

            // Procesar estadísticas según tipo
            switch (reportType) {
                case 'performance':
                    return this.processPerformanceStatistics(grades);
                case 'subjects':
                    return this.processSubjectStatistics(grades);
                case 'comparative':
                    return this.processComparativeStatistics(grades);
                default:
                    return this.processPerformanceStatistics(grades);
            }

        } catch (error) {
            throw new Error(`Error al obtener datos de estadísticas: ${error.message}`);
        }
    }

    /**
     * Procesa estadísticas de rendimiento
     * @param {Array} grades - Notas
     * @returns {Object} - Estadísticas de rendimiento
     */
    processPerformanceStatistics(grades) {
        const stats = {
            totalGrades: grades.length,
            teaCount: grades.filter(g => g.tea_tep_ted === 'TEA').length,
            tepCount: grades.filter(g => g.tea_tep_ted === 'TEP').length,
            tedCount: grades.filter(g => g.tea_tep_ted === 'TED').length,
            averageGrade: 0,
            subjects: {}
        };

        // Calcular promedio general
        const numericGrades = grades.filter(g => g.numeric_grade !== null);
        if (numericGrades.length > 0) {
            const sum = numericGrades.reduce((total, grade) => total + parseFloat(grade.numeric_grade), 0);
            stats.averageGrade = parseFloat((sum / numericGrades.length).toFixed(2));
        }

        // Estadísticas por materia
        grades.forEach(grade => {
            const subjectName = grade.course_subjects?.school_subjects?.name || 'Sin materia';
            
            if (!stats.subjects[subjectName]) {
                stats.subjects[subjectName] = {
                    name: subjectName,
                    totalGrades: 0,
                    teaCount: 0,
                    tepCount: 0,
                    tedCount: 0,
                    averageGrade: 0
                };
            }

            const subjectStats = stats.subjects[subjectName];
            subjectStats.totalGrades++;

            if (grade.tea_tep_ted === 'TEA') subjectStats.teaCount++;
            else if (grade.tea_tep_ted === 'TEP') subjectStats.tepCount++;
            else if (grade.tea_tep_ted === 'TED') subjectStats.tedCount++;

            if (grade.numeric_grade !== null) {
                const currentSum = subjectStats.averageGrade * (subjectStats.totalGrades - 1);
                subjectStats.averageGrade = parseFloat(((currentSum + parseFloat(grade.numeric_grade)) / subjectStats.totalGrades).toFixed(2));
            }
        });

        return stats;
    }

    /**
     * Genera reporte Excel de boletines
     * @param {Array} studentsData - Datos de estudiantes
     * @param {string} reportId - ID del reporte
     * @returns {Promise<string>} - Ruta del archivo generado
     */
    async generateExcelReportCards(studentsData, reportId) {
        try {
            const workbook = XLSX.utils.book_new();

            // Crear hoja de datos
            const worksheetData = studentsData.map(student => ({
                'Nombre': student.name,
                'DNI': student.dni,
                'Curso': student.course,
                'Escuela': student.school,
                'Promedio': this.calculateStudentAverage(student.grades)
            }));

            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Boletines');

            // Generar archivo
            const fileName = `boletines_${reportId}_${Date.now()}.xlsx`;
            const filePath = path.join(this.reportsPath, fileName);
            
            XLSX.writeFile(workbook, filePath);

            return filePath;

        } catch (error) {
            throw new Error(`Error al generar Excel: ${error.message}`);
        }
    }

    /**
     * Genera reporte Excel de estadísticas
     * @param {Object} statistics - Datos de estadísticas
     * @param {string} reportId - ID del reporte
     * @returns {Promise<string>} - Ruta del archivo generado
     */
    async generateExcelStatistics(statistics, reportId) {
        try {
            const workbook = XLSX.utils.book_new();

            // Hoja de resumen
            const summaryData = [
                { 'Métrica': 'Total de calificaciones', 'Valor': statistics.totalGrades },
                { 'Métrica': 'TEA', 'Valor': statistics.teaCount },
                { 'Métrica': 'TEP', 'Valor': statistics.tepCount },
                { 'Métrica': 'TED', 'Valor': statistics.tedCount },
                { 'Métrica': 'Promedio General', 'Valor': statistics.averageGrade }
            ];

            const summarySheet = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

            // Hoja por materias
            const subjectsData = Object.values(statistics.subjects).map(subject => ({
                'Materia': subject.name,
                'Total Calificaciones': subject.totalGrades,
                'TEA': subject.teaCount,
                'TEP': subject.tepCount,
                'TED': subject.tedCount,
                'Promedio': subject.averageGrade
            }));

            const subjectsSheet = XLSX.utils.json_to_sheet(subjectsData);
            XLSX.utils.book_append_sheet(workbook, subjectsSheet, 'Por Materias');

            // Generar archivo
            const fileName = `estadisticas_${reportId}_${Date.now()}.xlsx`;
            const filePath = path.join(this.reportsPath, fileName);
            
            XLSX.writeFile(workbook, filePath);

            return filePath;

        } catch (error) {
            throw new Error(`Error al generar Excel de estadísticas: ${error.message}`);
        }
    }

    /**
     * Calcula el promedio de un estudiante
     * @param {Array} grades - Notas del estudiante
     * @returns {number} - Promedio calculado
     */
    calculateStudentAverage(grades) {
        if (!grades || grades.length === 0) return 0;

        const numericGrades = grades.filter(g => g.numericGrade !== null);
        if (numericGrades.length === 0) return 0;

        const sum = numericGrades.reduce((total, grade) => total + parseFloat(grade.numericGrade), 0);
        return parseFloat((sum / numericGrades.length).toFixed(2));
    }

    /**
     * Crea un registro de reporte
     * @param {string} reportType - Tipo de reporte
     * @param {Object} parameters - Parámetros
     * @param {string} schoolId - ID de la escuela
     * @returns {Promise<Object>} - Registro creado
     */
    async createReportRecord(reportType, parameters, schoolId) {
        try {
            const { data: report, error } = await supabaseAdmin
                .from('reports')
                .insert({
                    school_id: schoolId,
                    report_type: reportType,
                    parameters: parameters,
                    status: 'generating'
                })
                .select()
                .single();

            if (error) throw error;

            return report;

        } catch (error) {
            throw new Error(`Error al crear registro de reporte: ${error.message}`);
        }
    }

    /**
     * Actualiza un registro de reporte
     * @param {string} reportId - ID del reporte
     * @param {string} filePath - Ruta del archivo
     * @param {string} status - Estado del reporte
     */
    async updateReportRecord(reportId, filePath, status) {
        try {
            const { error } = await supabaseAdmin
                .from('reports')
                .update({
                    file_path: filePath,
                    file_size: await this.getFileSize(filePath),
                    status: status,
                    completed_at: new Date().toISOString()
                })
                .eq('id', reportId);

            if (error) throw error;

        } catch (error) {
            throw new Error(`Error al actualizar registro de reporte: ${error.message}`);
        }
    }

    /**
     * Obtiene el tamaño de un archivo
     * @param {string} filePath - Ruta del archivo
     * @returns {Promise<number>} - Tamaño en bytes
     */
    async getFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    // Métodos adicionales para otros tipos de reportes...
    async getAttendanceData(schoolId, courseId, startDate, endDate) {
        // Implementación para datos de asistencia
        return [];
    }

    async generateExcelAttendance(attendanceData, reportId) {
        // Implementación para Excel de asistencia
        return '';
    }

    async getTeaTepTedData(schoolId, courseId, period) {
        // Implementación para datos TEA/TEP/TED
        return [];
    }

    async generateExcelTeaTepTed(evaluationData, reportId) {
        // Implementación para Excel TEA/TEP/TED
        return '';
    }

    processSubjectStatistics(grades) {
        // Implementación para estadísticas por materia
        return {};
    }

    processComparativeStatistics(grades) {
        // Implementación para estadísticas comparativas
        return {};
    }
}

module.exports = new ReportGenerator();
