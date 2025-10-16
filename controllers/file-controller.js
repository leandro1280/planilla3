// ========================================
// CONTROLADOR DE ARCHIVOS
// ========================================

const FileProcessingService = require('../services/file-processing-service');
const FileStorageService = require('../services/file-storage-service');

class FileController {
    /**
     * Procesar archivo de estudiantes/notas con detección inteligente
     */
    static async processFile(req, res) {
        try {
            const { schoolId } = req.body;
            const schoolIdFromSession = req.session.school?.id;

            if (!req.file) {
                return res.status(400).json({ 
                    success: false,
                    error: 'No se proporcionó archivo' 
                });
            }

            // Usar schoolId de la sesión si no se proporciona
            const finalSchoolId = schoolId || schoolIdFromSession;
            if (!finalSchoolId) {
                return res.status(400).json({ 
                    success: false,
                    error: 'ID de escuela requerido' 
                });
            }

            console.log('🔍 Procesando archivo:', req.file.originalname);
            console.log('📊 Escuela:', finalSchoolId);

            // Subir archivo a Cloudinary
            const uploadResult = await FileStorageService.uploadStudentFile(req.file, finalSchoolId);
            
            // Detectar tipo de contenido del archivo
            const { detectContentType } = require('../utils/file-processor');
            const contentType = await detectContentType(req.file);
            
            console.log('📋 Tipo de contenido detectado:', contentType);

            // Crear instancia del servicio
            const fileProcessor = new FileProcessingService();
            
            // Procesar según el tipo de contenido detectado
            let processResult;
            if (contentType === 'courses_and_students') {
                // Archivo con cursos y estudiantes
                processResult = await fileProcessor.processFileWithCourses(req.file, finalSchoolId);
            } else if (contentType === 'students_only') {
                // Archivo solo con estudiantes
                processResult = await fileProcessor.processFileStudentsOnly(req.file, finalSchoolId);
            } else {
                // Tipo no reconocido, intentar procesamiento genérico
                processResult = await fileProcessor.processFile(req.file, finalSchoolId);
            }

            res.json({
                success: true,
                contentType: contentType,
                result: {
                    ...processResult,
                    file: uploadResult.file
                }
            });
        } catch (error) {
            console.error('❌ Error procesando archivo:', error);
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Validar archivo antes de procesar
     */
    static async validateFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ 
                    success: false,
                    error: 'No se proporcionó archivo' 
                });
            }

            const { validateFile, getFileInfo } = require('../utils/file-processor');

            // Validar archivo
            validateFile(req.file);

            // Obtener información del archivo
            const fileInfo = getFileInfo(req.file);

            res.json({
                success: true,
                fileInfo
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener tipos de archivo soportados
     */
    static async getSupportedTypes(req, res) {
        try {
            const { getSupportedFileTypes } = require('../utils/file-processor');
            const supportedTypes = getSupportedFileTypes();

            res.json({
                success: true,
                supportedTypes
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener configuración de procesamiento
     */
    static async getProcessingConfig(req, res) {
        try {
            const { getProcessingConfig } = require('../utils/file-processor');
            const config = getProcessingConfig();

            res.json({
                success: true,
                config
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener plantilla de importación
     */
    static async getImportTemplate(req, res) {
        try {
            const { schoolId, courseId } = req.query;

            // Generar plantilla basada en la configuración de la escuela
            const template = {
                headers: [
                    'DNI',
                    'Apellido',
                    'Nombre',
                    'Email',
                    'Teléfono'
                ],
                example: [
                    '12345678',
                    'García',
                    'Juan',
                    'juan.garcia@email.com',
                    '1234567890'
                ],
                instructions: [
                    'La primera fila debe contener los encabezados',
                    'Cada fila representa un estudiante',
                    'El DNI debe ser único',
                    'Los campos son obligatorios'
                ]
            };

            res.json({
                success: true,
                template
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Descargar archivo procesado
     */
    static async downloadFile(req, res) {
        try {
            const { fileId } = req.params;
            
            if (!fileId) {
                return res.status(400).json({ 
                    success: false,
                    error: 'ID de archivo requerido' 
                });
            }

            // Aquí implementarías la lógica para descargar el archivo
            // Por ahora, devolvemos un error indicando que no está implementado
            res.status(501).json({ 
                success: false,
                error: 'Funcionalidad de descarga no implementada aún' 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }
}

module.exports = FileController;
