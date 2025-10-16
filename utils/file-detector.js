// ========================================
// DETECTOR DE TIPOS DE ARCHIVO
// ========================================

const PROCESSING_CONFIG = require('../config/file-processing-config');

/**
 * Clase para detectar y validar tipos de archivo
 */
class FileDetector {
    
    /**
     * Valida un archivo antes de procesarlo
     * @param {File} file - Archivo a validar
     * @throws {Error} - Error si el archivo no es válido
     */
    validateFile(file) {
        if (!file) {
            throw new Error('No se proporcionó archivo');
        }

        if (file.size > PROCESSING_CONFIG.MAX_FILE_SIZE) {
            const maxSizeMB = PROCESSING_CONFIG.MAX_FILE_SIZE / (1024 * 1024);
            throw new Error(`${PROCESSING_CONFIG.ERROR_MESSAGES.FILE_TOO_LARGE}. Máximo permitido: ${maxSizeMB}MB`);
        }

        const extension = this.getFileExtension(file.originalname);
        if (!PROCESSING_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
            throw new Error(`${PROCESSING_CONFIG.ERROR_MESSAGES.INVALID_EXTENSION}: ${extension}. Tipos permitidos: ${PROCESSING_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`);
        }
    }
    
    /**
     * Detecta el tipo de archivo basado en su extensión
     * @param {string} fileName - Nombre del archivo
     * @returns {string} - Tipo de archivo detectado
     */
    detectFileType(fileName) {
        const extension = this.getFileExtension(fileName).toLowerCase();
        return PROCESSING_CONFIG.EXTENSION_MAP[extension] || PROCESSING_CONFIG.FILE_TYPES.UNKNOWN;
    }
    
    /**
     * Obtiene la extensión de un archivo
     * @param {string} fileName - Nombre del archivo
     * @returns {string} - Extensión del archivo
     */
    getFileExtension(fileName) {
        if (!fileName || typeof fileName !== 'string') {
            return '';
        }
        
        const lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex === -1) {
            return '';
        }
        
        return fileName.substring(lastDotIndex).toLowerCase();
    }
    
    /**
     * Verifica si un archivo es de tipo Excel
     * @param {string} fileName - Nombre del archivo
     * @returns {boolean} - True si es Excel
     */
    isExcelFile(fileName) {
        const extension = this.getFileExtension(fileName).toLowerCase();
        return extension === '.xlsx' || extension === '.xls';
    }
    
    /**
     * Verifica si un archivo es CSV
     * @param {string} fileName - Nombre del archivo
     * @returns {boolean} - True si es CSV
     */
    isCSVFile(fileName) {
        const extension = this.getFileExtension(fileName).toLowerCase();
        return extension === '.csv';
    }
    
    /**
     * Verifica si un archivo es de texto
     * @param {string} fileName - Nombre del archivo
     * @returns {boolean} - True si es texto
     */
    isTextFile(fileName) {
        const extension = this.getFileExtension(fileName).toLowerCase();
        return extension === '.txt';
    }
    
    /**
     * Obtiene información básica del archivo
     * @param {File} file - Archivo a analizar
     * @returns {Object} - Información del archivo
     */
    getFileInfo(file) {
        return {
            name: file.originalname,
            size: file.size,
            type: file.type,
            extension: this.getFileExtension(file.originalname),
            detectedType: this.detectFileType(file.originalname),
            sizeMB: (file.size / (1024 * 1024)).toFixed(2),
            isValid: this.isValidFile(file),
            lastModified: file.lastModified ? new Date(file.lastModified) : null
        };
    }
    
    /**
     * Verifica si un archivo es válido para procesamiento
     * @param {File} file - Archivo a verificar
     * @returns {boolean} - True si es válido
     */
    isValidFile(file) {
        try {
            this.validateFile(file);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Obtiene tipos de archivo soportados
     * @returns {Array} - Array de extensiones soportadas
     */
    getSupportedExtensions() {
        return [...PROCESSING_CONFIG.ALLOWED_EXTENSIONS];
    }
    
    /**
     * Obtiene el tamaño máximo permitido
     * @returns {number} - Tamaño máximo en bytes
     */
    getMaxFileSize() {
        return PROCESSING_CONFIG.MAX_FILE_SIZE;
    }
    
    /**
     * Obtiene el tamaño máximo en MB
     * @returns {number} - Tamaño máximo en MB
     */
    getMaxFileSizeMB() {
        return PROCESSING_CONFIG.MAX_FILE_SIZE / (1024 * 1024);
    }
}

module.exports = FileDetector;
