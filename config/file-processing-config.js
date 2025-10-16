// ========================================
// CONFIGURACIÓN DE PROCESAMIENTO DE ARCHIVOS
// ========================================

const PROCESSING_CONFIG = {
    // Límites de archivos
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_EXTENSIONS: ['.xlsx', '.xls', '.csv', '.txt'],
    SUPPORTED_ENCODINGS: ['utf8', 'latin1', 'ascii'],
    MAX_STUDENTS_PER_IMPORT: 1000,
    TIMEOUT_MS: 30000, // 30 segundos
    
    // Configuración de validación
    MIN_STUDENTS_FOR_IMPORT: 1,
    MAX_GRADES_PER_STUDENT: 50,
    MAX_SUBJECTS_PER_FILE: 30,
    
    // Configuración de detección
    CONFIDENCE_THRESHOLD: 0.7,
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 100,
    
    // Tipos de archivo soportados
    FILE_TYPES: {
        EXCEL: 'excel',
        CSV: 'csv',
        TEXT: 'text',
        UNKNOWN: 'unknown'
    },
    
    // Mapeo de extensiones
    EXTENSION_MAP: {
        '.xlsx': 'excel',
        '.xls': 'excel',
        '.csv': 'csv',
        '.txt': 'text'
    },
    
    // Mensajes de error
    ERROR_MESSAGES: {
        FILE_TOO_LARGE: 'El archivo es demasiado grande',
        INVALID_EXTENSION: 'Tipo de archivo no soportado',
        NO_STUDENTS_FOUND: 'No se encontraron estudiantes en el archivo',
        TOO_MANY_STUDENTS: 'Demasiados estudiantes en el archivo',
        NO_GRADES_FOUND: 'No se encontraron notas en el archivo',
        NO_SUBJECTS_FOUND: 'No se encontraron materias reconocidas',
        PROCESSING_ERROR: 'Error al procesar el archivo',
        INVALID_DATA: 'Datos inválidos en el archivo'
    },
    
    // Mensajes de advertencia
    WARNING_MESSAGES: {
        LOW_CONFIDENCE: 'Confianza baja en la detección de datos',
        MISSING_DATA: 'Faltan algunos datos importantes',
        INCONSISTENT_FORMAT: 'Formato inconsistente detectado'
    },
    
    // Mensajes de sugerencia
    SUGGESTION_MESSAGES: {
        EVALUATION_SYSTEM: 'Se detectó sistema de evaluación',
        MISSING_SUBJECTS: 'Se detectaron materias no configuradas',
        GROUPS_DETECTED: 'Se detectó estructura de grupos',
        IMPROVE_FORMAT: 'Se sugiere mejorar el formato del archivo'
    }
};

module.exports = PROCESSING_CONFIG;
