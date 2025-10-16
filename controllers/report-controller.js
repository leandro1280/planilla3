// ========================================
// CONTROLADOR DE REPORTES
// ========================================

const reportGenerator = require('../services/report-generator');
const Report = require('../models/Report');
const FileStorageService = require('../services/file-storage-service');

class ReportController {
    /**
     * Generar boletines
     */
    static async generateBoletines(req, res) {
        try {
            const params = req.body;
            const { schoolId } = params;
            
            // Generar reporte
            const result = await reportGenerator.generateStudentReportCards(params);
            
            // Subir a Cloudinary si es un archivo
            if (result.fileBuffer) {
                const uploadResult = await FileStorageService.uploadReport(
                    result.fileBuffer, 
                    'boletines', 
                    schoolId,
                    { 
                        courseId: params.courseId,
                        period: params.period,
                        generatedBy: req.session.user.id
                    }
                );
                
                result.cloudFile = uploadResult.report;
            }

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
     * Generar reporte de estadísticas
     */
    static async generateStatistics(req, res) {
        try {
            const params = req.body;
            const result = await reportGenerator.generateStatisticsReport(params);

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
     * Generar reporte de asistencia
     */
    static async generateAttendance(req, res) {
        try {
            const params = req.body;
            const result = await reportGenerator.generateAttendanceReport(params);

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
     * Generar análisis TEA/TEP/TED
     */
    static async generateTeaTepTed(req, res) {
        try {
            const params = req.body;
            const result = await reportGenerator.generateTeaTepTedAnalysis(params);

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
     * Descargar reporte generado
     */
    static async downloadReport(req, res) {
        try {
            const { reportId } = req.params;
            const { format } = req.query;

            const report = await Report.findById(reportId);

            if (!report) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Reporte no encontrado' 
                });
            }

            if (!report.isReady()) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Reporte no está listo para descarga' 
                });
            }

            if (format === 'pdf') {
                const pdfBuffer = await reportGenerator.exportToPdf(report);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="reporte-${reportId}.pdf"`);
                res.send(pdfBuffer);
            } else if (format === 'excel') {
                const excelBuffer = await reportGenerator.exportToExcel(report);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="reporte-${reportId}.xlsx"`);
                res.send(excelBuffer);
            } else {
                res.json({
                    success: true,
                    report: report
                });
            }
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener plantillas de reportes disponibles
     */
    static async getTemplates(req, res) {
        try {
            const templates = [
                {
                    id: 'boletin_estudiante',
                    name: 'Boletín Individual',
                    description: 'Boletín de calificaciones de un estudiante'
                },
                {
                    id: 'boletin_curso',
                    name: 'Boletín de Curso',
                    description: 'Boletín de calificaciones de todo el curso'
                },
                {
                    id: 'estadisticas_generales',
                    name: 'Estadísticas Generales',
                    description: 'Estadísticas de rendimiento del curso'
                },
                {
                    id: 'asistencia_curso',
                    name: 'Reporte de Asistencia',
                    description: 'Reporte de asistencia del curso'
                },
                {
                    id: 'tea_tep_ted',
                    name: 'Análisis TEA/TEP/TED',
                    description: 'Análisis de promedios por período'
                }
            ];

            res.json({
                success: true,
                templates
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener historial de reportes generados
     */
    static async getReportHistory(req, res) {
        try {
            const { schoolId } = req.query;
            const history = await Report.getHistory(schoolId);

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
     * Eliminar reporte
     */
    static async deleteReport(req, res) {
        try {
            const { reportId } = req.params;
            await Report.delete(reportId);

            res.json({
                success: true,
                message: 'Reporte eliminado correctamente'
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }
}

module.exports = ReportController;
