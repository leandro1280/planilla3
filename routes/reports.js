// ========================================
// RUTAS DE REPORTES
// ========================================

const express = require('express');
const router = express.Router();

// Importar servicios
const reportGenerator = require('../services/report-generator');

// Importar middlewares
const { authMiddleware, requireRole, requireSchoolAccess } = require('../middleware/auth');

// ========================================
// RUTAS DE REPORTES
// ========================================

/**
 * @route POST /api/reports/boletines
 * @desc Generar boletines
 * @access Private
 */
router.post('/boletines', authMiddleware, requireRole(['director', 'preceptor']), async (req, res) => {
    try {
        const params = req.body;
        const result = await reportGenerator.generateStudentReportCards(params);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route POST /api/reports/estadisticas
 * @desc Generar reporte de estadísticas
 * @access Private
 */
router.post('/estadisticas', authMiddleware, requireRole(['director', 'preceptor']), async (req, res) => {
    try {
        const params = req.body;
        const result = await reportGenerator.generateStatisticsReport(params);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route POST /api/reports/asistencia
 * @desc Generar reporte de asistencia
 * @access Private
 */
router.post('/asistencia', authMiddleware, requireRole(['director', 'preceptor']), async (req, res) => {
    try {
        const params = req.body;
        const result = await reportGenerator.generateAttendanceReport(params);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route POST /api/reports/tea-tep-ted
 * @desc Generar análisis TEA/TEP/TED
 * @access Private
 */
router.post('/tea-tep-ted', authMiddleware, requireRole(['director', 'preceptor']), async (req, res) => {
    try {
        const params = req.body;
        const result = await reportGenerator.generateTeaTepTedAnalysis(params);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route GET /api/reports/:reportId/download
 * @desc Descargar reporte generado
 * @access Private
 */
router.get('/:reportId/download', authMiddleware, async (req, res) => {
    try {
        const { reportId } = req.params;
        const { format } = req.query; // pdf, excel, csv
        
        const reportData = await reportGenerator.getReportData(reportId);
        
        if (format === 'pdf') {
            const pdfBuffer = await reportGenerator.exportToPdf(reportData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-${reportId}.pdf"`);
            res.send(pdfBuffer);
        } else if (format === 'excel') {
            const excelBuffer = await reportGenerator.exportToExcel(reportData);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-${reportId}.xlsx"`);
            res.send(excelBuffer);
        } else {
            res.json({
                success: true,
                report: reportData
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/reports/templates
 * @desc Obtener plantillas de reportes disponibles
 * @access Private
 */
router.get('/templates', authMiddleware, (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/reports/history
 * @desc Obtener historial de reportes generados
 * @access Private
 */
router.get('/history', authMiddleware, requireSchoolAccess, async (req, res) => {
    try {
        const { schoolId } = req.query;
        const history = await reportGenerator.getReportHistory(schoolId);
        
        res.json({
            success: true,
            history
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
