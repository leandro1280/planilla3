// ========================================
// ARCHIVO PRINCIPAL DE PROCESAMIENTO DE ARCHIVOS
// ========================================

// Re-exportar todas las clases y utilidades
const FileProcessingService = require('../services/file-processing-service');
const FileDetector = require('./file-detector');
const DataExtractor = require('./data-extractor');
const { PatternDetector } = require('./pattern-detector');

// Exportar configuración
const PROCESSING_CONFIG = require('../config/file-processing-config');

// ========================================
// FUNCIONES DE UTILIDAD EXPORTADAS
// ========================================

/**
 * Función principal para procesar archivos
 * @param {File} file - Archivo a procesar
 * @param {string} schoolId - ID de la escuela
 * @param {string} courseId - ID del curso (opcional)
 * @returns {Promise<Object>} - Resultados del procesamiento
 */
const processFile = async (file, schoolId, courseId = null) => {
    const processor = new FileProcessingService();
    return await processor.processFile(file, schoolId, courseId);
};

/**
 * Función para validar archivo antes de procesar
 * @param {File} file - Archivo a validar
 * @returns {boolean} - True si es válido
 */
const validateFile = (file) => {
    const detector = new FileDetector();
    detector.validateFile(file);
    return true;
};

/**
 * Función para obtener tipos de archivo soportados
 * @returns {Array} - Array de extensiones soportadas
 */
const getSupportedFileTypes = () => {
    return PROCESSING_CONFIG.ALLOWED_EXTENSIONS;
};

/**
 * Función para obtener configuración de procesamiento
 * @returns {Object} - Configuración de procesamiento
 */
const getProcessingConfig = () => {
    return PROCESSING_CONFIG;
};

/**
 * Función para obtener información de un archivo
 * @param {File} file - Archivo a analizar
 * @returns {Object} - Información del archivo
 */
const getFileInfo = (file) => {
    const detector = new FileDetector();
    return detector.getFileInfo(file);
};

/**
 * Función para detectar tipo de archivo
 * @param {string} fileName - Nombre del archivo
 * @returns {string} - Tipo de archivo detectado
 */
const detectFileType = (fileName) => {
    const detector = new FileDetector();
    return detector.detectFileType(fileName);
};

/**
 * Detectar tipo de contenido del archivo
 * @param {Object} file - Archivo a analizar
 * @returns {Promise<string>} - Tipo de contenido detectado
 */
const detectContentType = async (file) => {
    try {
        console.log('🔍 Detectando tipo de contenido...');
        
        // Extraer datos del archivo
        const extractor = new DataExtractor();
        const rawData = await extractor.extractData(file);
        
        if (!rawData || !rawData.rows || !Array.isArray(rawData.rows) || rawData.rows.length === 0) {
            console.log('⚠️ Datos no válidos para detección de patrones:', rawData);
            return 'unknown';
        }

        // Detectar patrones usando las filas extraídas
        const patternDetector = new PatternDetector();
        const patterns = patternDetector.detectPatterns(rawData.rows);
        
        console.log('📊 Patrones detectados:', patterns);

        // Analizar patrones para determinar el tipo de contenido
        const hasStudentData = patterns.hasStudentNames || patterns.hasDNI || patterns.hasStudentInfo;
        const hasCourseData = patterns.hasCourseNames || patterns.hasGrades || patterns.hasSubjects;
        const hasGradeData = patterns.hasGrades || patterns.hasNumericGrades;

        if (hasStudentData && hasCourseData) {
            console.log('✅ Detectado: Archivo con cursos y estudiantes');
            return 'courses_and_students';
        } else if (hasStudentData && !hasCourseData) {
            console.log('✅ Detectado: Archivo solo con estudiantes');
            return 'students_only';
        } else if (hasGradeData) {
            console.log('✅ Detectado: Archivo con calificaciones');
            return 'grades_only';
        } else {
            console.log('⚠️ Tipo de contenido no reconocido');
            return 'unknown';
        }
    } catch (error) {
        console.error('❌ Error detectando tipo de contenido:', error);
        return 'unknown';
    }
};

module.exports = {
    // Clases principales
    FileProcessingService,
    FileDetector,
    DataExtractor,
    PatternDetector,
    
    // Funciones de utilidad
    processFile,
    validateFile,
    getSupportedFileTypes,
    getProcessingConfig,
    getFileInfo,
    detectFileType,
    detectContentType,
    
    // Configuración
    PROCESSING_CONFIG
};