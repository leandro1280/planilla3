// ========================================
// DETECTOR DE PATRONES PARA ARCHIVOS
// ========================================

/**
 * Patrones de detección para diferentes tipos de datos
 */
const DETECTION_PATTERNS = {
    // Patrones para nombres de estudiantes - Múltiples formatos
    studentNames: [
        // Formato con comillas dobles anidadas
        /^"\s*[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+""[A-Z]""\s*"$/, // "ALMARAZ NARA ""C""""
        /^\d+,\s*"[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+""[A-Z]""\s*",/, // "1, "ALMARAZ NARA ""C""","
        
        // Formato con apóstrofes
        /^\d+\s+[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+'[A-Z]'$/, // "1 ALMARAZ NARA 'C'"
        /^[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+'[A-Z]'$/,       // "ALMARAZ NARA 'C'"
        
        // Formato con comillas simples
        /^\d+\s+[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+'?[A-Z]?'?$/, // "1 ALMARAZ NARA 'C'"
        /^[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+'?[A-Z]?'?$/,       // "ALMARAZ NARA 'C'"
        
        // Formato con coma (Apellido, Nombre)
        /^[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+,\s*[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+$/, // "GONZÁLEZ, JUAN"
        /^\d+\s+[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+,\s*[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+$/, // "1 GONZÁLEZ, JUAN"
        
        // Formato con DNI
        /^\d+,\s*[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+,\s*[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+$/, // "12345678, GONZÁLEZ, JUAN"
        
        // Formato mixto (Nombre Apellido)
        /^\d+\s+[A-Z][a-záéíóúñü]+\s+[A-Z][a-záéíóúñü]+$/, // "1 Juan Pérez"
        /^[A-Z][a-záéíóúñü]+\s+[A-Z][a-záéíóúñü]+$/,      // "Juan Pérez"
        
        // Formato solo apellidos en mayúsculas
        /^\d+\s+[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+$/,            // "1 ALMARAZ NARA"
        /^[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+$/,                  // "ALMARAZ NARA"
        
        // Formato solo nombres
        /^\d+\s+[A-Z][a-záéíóúñü]+$/,                     // "1 Juan"
        /^[A-Z][a-záéíóúñü]+$/,                           // "Juan"
        
        // Formato con paréntesis
        /^[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+\([A-ZÁÉÍÓÚÑÜ\s]+\)$/, // "GONZÁLEZ (JUAN)"
        
        // Formato con guiones
        /^[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+-\s*[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+$/, // "GONZÁLEZ - JUAN"
    ],
    
    // Patrones para DNI
    dni: [
        /^\d{7,8}$/,           // "12345678"
        /^\d{2}\.\d{3}\.\d{3}$/, // "12.345.678"
        /^\d{2}-\d{3}-\d{3}$/,   // "12-345-678"
        /^\d{2}\s\d{3}\s\d{3}$/  // "12 345 678"
    ],
    
    // Patrones para columnas de notas
    gradeColumns: [
        /^\d+°$/,                    // "1°", "2°", "3°"
        /nota|calificación/i,        // "Nota", "Calificación"
        /puntaje|score/i,            // "Puntaje", "Score"
        /valoración|valuación/i,     // "Valoración"
        /evaluación/i,               // "Evaluación"
        /instancia/i,                // "Instancia"
        /parcial/i                   // "Parcial"
    ],
    
    // Patrones para períodos
    periods: [
        /cuatrimestre/i,             // "1° Cuatrimestre"
        /trimestre/i,                // "1° Trimestre"
        /bimestre/i,                 // "Bimestre"
        /parcial/i,                  // "Parcial"
        /evaluación/i                // "Evaluación"
    ],
    
    // Patrones para TEA/TEP/TED
    evaluations: [
        /tea|tep|ted/i,              // "TEA", "TEP", "TED"
        /preliminar|pre/i,           // "Preliminar"
        /final|definitiva/i,         // "Final", "Definitiva"
        /recuperatorio/i             // "Recuperatorio"
    ],
    
    // Patrones para materias (comunes)
    subjectPatterns: [
        /matemática|matematica|mtm/i,
        /lengua|español|castellano|plg/i,
        /biología|biologia|blg/i,
        /historia|htr/i,
        /geografía|geografia|ggf/i,
        /física|fisica|fqa/i,
        /química|quimica/i,
        /inglés|ingles|igs/i,
        /educación física|educacion fisica|efc/i,
        /artística|artistica|art/i,
        /literatura|lit/i,
        /construcción de ciudadanía|construccion de ciudadania|ccd/i,
        /ciencias naturales|cnt/i,
        /ciencias sociales|cs/i
    ]
};

/**
 * Clase para detectar patrones en archivos
 */
class PatternDetector {
    
    /**
     * Detecta si un texto es un nombre de estudiante
     * @param {string} text - Texto a analizar
     * @returns {boolean} - True si es un nombre de estudiante
     */
    isStudentName(text) {
        if (!text || typeof text !== 'string') return false;
        
        const cleanText = text.trim();
        if (cleanText.length < 2) return false;
        
        return DETECTION_PATTERNS.studentNames.some(pattern => pattern.test(cleanText));
    }
    
    /**
     * Detecta si un texto es un DNI válido
     * @param {string} text - Texto a analizar
     * @returns {boolean} - True si es un DNI válido
     */
    isDNI(text) {
        if (!text || typeof text !== 'string') return false;
        
        const cleanText = text.trim();
        return DETECTION_PATTERNS.dni.some(pattern => pattern.test(cleanText));
    }
    
    /**
     * Detecta si un header es una columna de notas
     * @param {string} header - Header a analizar
     * @returns {boolean} - True si es una columna de notas
     */
    isGradeColumn(header) {
        if (!header || typeof header !== 'string') return false;
        
        return DETECTION_PATTERNS.gradeColumns.some(pattern => pattern.test(header));
    }
    
    /**
     * Detecta si un header es una columna de período
     * @param {string} header - Header a analizar
     * @returns {boolean} - True si es una columna de período
     */
    isPeriodColumn(header) {
        if (!header || typeof header !== 'string') return false;
        
        return DETECTION_PATTERNS.periods.some(pattern => pattern.test(header));
    }
    
    /**
     * Detecta si un header es una columna de evaluación
     * @param {string} header - Header a analizar
     * @returns {boolean} - True si es una columna de evaluación
     */
    isEvaluationColumn(header) {
        if (!header || typeof header !== 'string') return false;
        
        return DETECTION_PATTERNS.evaluations.some(pattern => pattern.test(header));
    }
    
    /**
     * Detecta si un header es una columna de materia
     * @param {string} header - Header a analizar
     * @param {Array} knownSubjects - Materias conocidas
     * @returns {boolean} - True si es una columna de materia
     */
    isSubjectColumn(header, knownSubjects = []) {
        if (!header || typeof header !== 'string') return false;
        
        // Verificar patrones generales
        const matchesPattern = DETECTION_PATTERNS.subjectPatterns.some(pattern => 
            pattern.test(header)
        );
        
        if (matchesPattern) return true;
        
        // Verificar contra materias conocidas
        return knownSubjects.some(subject => 
            header.toLowerCase().includes(subject.name.toLowerCase()) ||
            header.toLowerCase().includes(subject.code.toLowerCase())
        );
    }
    
    /**
     * Detecta si un header es una columna de estudiante
     * @param {string} header - Header a analizar
     * @returns {boolean} - True si es una columna de estudiante
     */
    isStudentNameColumn(header) {
        if (!header || typeof header !== 'string') return false;
        
        const studentHeaders = [
            'alumno', 'estudiante', 'nombre', 'apellido', 
            'apellido y nombre', 'estudiante', 'alumno/a'
        ];
        
        return studentHeaders.some(h => header.toLowerCase().includes(h));
    }
    
    /**
     * Detecta si un header es una columna de DNI
     * @param {string} header - Header a analizar
     * @returns {boolean} - True si es una columna de DNI
     */
    isDNIColumn(header) {
        if (!header || typeof header !== 'string') return false;
        
        const dniHeaders = ['dni', 'documento', 'cedula', 'identificacion'];
        return dniHeaders.some(h => header.toLowerCase().includes(h));
    }
    
    /**
     * Parsea un nombre de estudiante
     * @param {string} name - Nombre a parsear
     * @returns {Object} - Objeto con first_name, last_name, full_name
     */
    parseStudentName(name) {
        if (!name || typeof name !== 'string') {
            return { first_name: '', last_name: '', full_name: '' };
        }
        
        // Limpiar y parsear nombre
        let cleanName = name.replace(/^\d+\s*/, ''); // Quitar número al inicio
        cleanName = cleanName.replace(/'[A-Z]'?$/, ''); // Quitar 'C' al final
        cleanName = cleanName.trim();
        
        const parts = cleanName.split(/\s+/);
        
        if (parts.length >= 2) {
            return {
                first_name: parts[0],
                last_name: parts.slice(1).join(' '),
                full_name: cleanName
            };
        } else {
            return {
                first_name: parts[0] || '',
                last_name: '',
                full_name: cleanName
            };
        }
    }

    /**
     * Detecta patrones en los datos extraídos
     * @param {Array} data - Datos a analizar
     * @returns {Object} - Patrones detectados
     */
    detectPatterns(data) {
        const patterns = {
            hasStudentNames: false,
            hasDNI: false,
            hasStudentInfo: false,
            hasCourseNames: false,
            hasGrades: false,
            hasNumericGrades: false,
            hasSubjects: false
        };

        if (!data || data.length === 0) {
            return patterns;
        }

        // Verificar que data sea iterable
        if (!data || !Array.isArray(data)) {
            console.log('⚠️ Data no es un array válido:', typeof data);
            return results;
        }
        
        // Analizar cada fila
        for (const row of data) {
            if (!Array.isArray(row)) continue;

            for (const cell of row) {
                if (typeof cell !== 'string') continue;

                // Detectar nombres de estudiantes
                if (DETECTION_PATTERNS.studentNames.some(pattern => pattern.test(cell))) {
                    patterns.hasStudentNames = true;
                    patterns.hasStudentInfo = true;
                }

                // Detectar DNI
                if (DETECTION_PATTERNS.dni.some(pattern => pattern.test(cell))) {
                    patterns.hasDNI = true;
                    patterns.hasStudentInfo = true;
                }

                // Detectar nombres de cursos
                if (DETECTION_PATTERNS.courseNames && DETECTION_PATTERNS.courseNames.some(pattern => pattern.test(cell))) {
                    patterns.hasCourseNames = true;
                }

                // Detectar calificaciones
                if (DETECTION_PATTERNS.grades && DETECTION_PATTERNS.grades.some(pattern => pattern.test(cell))) {
                    patterns.hasGrades = true;
                }

                // Detectar calificaciones numéricas
                if (DETECTION_PATTERNS.numericGrades && DETECTION_PATTERNS.numericGrades.some(pattern => pattern.test(cell))) {
                    patterns.hasNumericGrades = true;
                }

                // Detectar materias
                if (DETECTION_PATTERNS.subjects && DETECTION_PATTERNS.subjects.some(pattern => pattern.test(cell))) {
                    patterns.hasSubjects = true;
                }
            }
        }

        return patterns;
    }
}

module.exports = {
    DETECTION_PATTERNS,
    PatternDetector
};
