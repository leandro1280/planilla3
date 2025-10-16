// ========================================
// CONFIGURACIONES PREDEFINIDAS POR TIPO DE ESCUELA
// ========================================

/**
 * Configuraciones completas para cada tipo de escuela
 */
const SCHOOL_TYPE_CONFIGS = {
    primaria: {
        name: 'Escuela Primaria',
        maxYears: 6,
        evaluationSystem: 'trimestral',
        hasPreReports: false,
        hasIntensification: true,
        instancesPerPeriod: 3,
        basicSubjects: [
            { name: 'Matemática', code: 'MTM', hours: 4, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5, 6] },
            { name: 'Prácticas del Lenguaje', code: 'PLG', hours: 4, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5, 6] },
            { name: 'Ciencias Naturales', code: 'CNT', hours: 3, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5, 6] },
            { name: 'Ciencias Sociales', code: 'CS', hours: 3, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5, 6] },
            { name: 'Educación Física', code: 'EFC', hours: 3, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5, 6] },
            { name: 'Inglés', code: 'IGS', hours: 2, type: 'curricular', category: 'basica', years: [4, 5, 6] },
            { name: 'Artística', code: 'ART', hours: 2, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5, 6] },
            { name: 'Construcción de Ciudadanía', code: 'CCD', hours: 2, type: 'curricular', category: 'basica', years: [5, 6] }
        ],
        specializations: [],
        hasSpecializations: false,
        hasGroups: false,
        hasWorkshops: false
    },

    secundaria_comun: {
        name: 'Escuela Secundaria Común',
        maxYears: 5,
        evaluationSystem: 'cuatrimestral',
        hasPreReports: true,
        hasIntensification: true,
        instancesPerPeriod: 4,
        basicSubjects: [
            { name: 'Matemática', code: 'MTM', hours: 4, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Prácticas del Lenguaje', code: 'PLG', hours: 4, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Biología', code: 'BLG', hours: 3, type: 'curricular', category: 'basica', years: [2, 3, 4, 5] },
            { name: 'Historia', code: 'HTR', hours: 3, type: 'curricular', category: 'basica', years: [2, 3, 4, 5] },
            { name: 'Geografía', code: 'GGF', hours: 3, type: 'curricular', category: 'basica', years: [2, 3, 4, 5] },
            { name: 'Educación Física', code: 'EFC', hours: 3, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5] },
            { name: 'Inglés', code: 'IGS', hours: 3, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5] },
            { name: 'Construcción de Ciudadanía', code: 'CCD', hours: 2, type: 'curricular', category: 'basica', years: [4, 5] },
            { name: 'Artística', code: 'ART', hours: 2, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Físico-Química', code: 'FQA', hours: 3, type: 'curricular', category: 'basica', years: [2, 3] },
            { name: 'Literatura', code: 'LIT', hours: 3, type: 'curricular', category: 'basica', years: [4, 5] },
            { name: 'Matemática Ciclo Superior', code: 'MCS', hours: 4, type: 'curricular', category: 'basica', years: [4, 5] }
        ],
        specializations: [
            { name: 'Ciencias Naturales', code: 'CN', years: [4, 5], subjects: [
                { name: 'Biología Avanzada', code: 'BLA', hours: 4 },
                { name: 'Química', code: 'QMC', hours: 4 },
                { name: 'Física', code: 'FIS', hours: 4 },
                { name: 'Matemática Avanzada', code: 'MTA', hours: 4 }
            ]},
            { name: 'Ciencias Sociales', code: 'CS', years: [4, 5], subjects: [
                { name: 'Historia Argentina', code: 'HAR', hours: 4 },
                { name: 'Geografía Argentina', code: 'GAR', hours: 4 },
                { name: 'Sociología', code: 'SOC', hours: 3 },
                { name: 'Economía', code: 'ECO', hours: 3 }
            ]},
            { name: 'Economía y Administración', code: 'EA', years: [4, 5], subjects: [
                { name: 'Economía', code: 'ECO', hours: 4 },
                { name: 'Administración', code: 'ADM', hours: 4 },
                { name: 'Contabilidad', code: 'CON', hours: 4 },
                { name: 'Derecho', code: 'DER', hours: 3 }
            ]},
            { name: 'Comunicación', code: 'COM', years: [4, 5], subjects: [
                { name: 'Comunicación Social', code: 'COS', hours: 4 },
                { name: 'Periodismo', code: 'PER', hours: 4 },
                { name: 'Publicidad', code: 'PUB', hours: 3 },
                { name: 'Medios Audiovisuales', code: 'MAV', hours: 3 }
            ]}
        ],
        hasSpecializations: true,
        hasGroups: false,
        hasWorkshops: false
    },

    tecnica: {
        name: 'Escuela Técnica',
        maxYears: 7,
        evaluationSystem: 'cuatrimestral',
        hasPreReports: true,
        hasIntensification: true,
        instancesPerPeriod: 5, // Como mencionaste, 5 instancias por cuatrimestre
        basicSubjects: [
            { name: 'Matemática', code: 'MTM', hours: 4, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Prácticas del Lenguaje', code: 'PLG', hours: 4, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Biología', code: 'BLG', hours: 3, type: 'curricular', category: 'basica', years: [2, 3, 4, 5, 6, 7] },
            { name: 'Historia', code: 'HTR', hours: 3, type: 'curricular', category: 'basica', years: [2, 3, 4, 5, 6, 7] },
            { name: 'Geografía', code: 'GGF', hours: 3, type: 'curricular', category: 'basica', years: [2, 3, 4, 5, 6, 7] },
            { name: 'Educación Física', code: 'EFC', hours: 3, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5, 6, 7] },
            { name: 'Inglés', code: 'IGS', hours: 3, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5, 6, 7] },
            { name: 'Construcción de Ciudadanía', code: 'CCD', hours: 2, type: 'curricular', category: 'basica', years: [4, 5, 6, 7] },
            { name: 'Artística', code: 'ART', hours: 2, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Físico-Química', code: 'FQA', hours: 3, type: 'curricular', category: 'basica', years: [2, 3] },
            { name: 'Literatura', code: 'LIT', hours: 3, type: 'curricular', category: 'basica', years: [4, 5, 6, 7] },
            { name: 'Matemática Ciclo Superior', code: 'MCS', hours: 4, type: 'curricular', category: 'basica', years: [4, 5, 6, 7] },
            { name: 'Física', code: 'FIS', hours: 4, type: 'curricular', category: 'basica', years: [4, 5, 6, 7] },
            { name: 'Química', code: 'QMC', hours: 4, type: 'curricular', category: 'basica', years: [4, 5, 6, 7] }
        ],
        specializations: [
            { name: 'Programación', code: 'PROG', years: [4, 5, 6, 7], subjects: [
                { name: 'Programación I', code: 'PRO1', hours: 4, type: 'curricular' },
                { name: 'Programación II', code: 'PRO2', hours: 4, type: 'curricular' },
                { name: 'Base de Datos', code: 'BD', hours: 3, type: 'curricular' },
                { name: 'Sistemas Operativos', code: 'SO', hours: 3, type: 'curricular' },
                { name: 'Redes', code: 'RED', hours: 3, type: 'curricular' },
                { name: 'Taller de Programación I', code: 'TP1', hours: 6, type: 'taller' },
                { name: 'Taller de Programación II', code: 'TP2', hours: 6, type: 'taller' },
                { name: 'Práctica Profesional', code: 'PP', hours: 8, type: 'practica' }
            ]},
            { name: 'Electromecánica', code: 'EM', years: [4, 5, 6, 7], subjects: [
                { name: 'Electrotecnia', code: 'ET', hours: 4, type: 'curricular' },
                { name: 'Máquinas Eléctricas', code: 'ME', hours: 4, type: 'curricular' },
                { name: 'Automatización', code: 'AUT', hours: 3, type: 'curricular' },
                { name: 'Instalaciones Eléctricas', code: 'IE', hours: 3, type: 'curricular' },
                { name: 'Mecánica Técnica', code: 'MT', hours: 4, type: 'curricular' },
                { name: 'Taller de Electromecánica I', code: 'TEM1', hours: 8, type: 'taller' },
                { name: 'Taller de Electromecánica II', code: 'TEM2', hours: 8, type: 'taller' },
                { name: 'Práctica Profesional', code: 'PP', hours: 8, type: 'practica' }
            ]},
            { name: 'Química', code: 'QMC', years: [4, 5, 6, 7], subjects: [
                { name: 'Química Orgánica', code: 'QO', hours: 4, type: 'curricular' },
                { name: 'Química Inorgánica', code: 'QI', hours: 4, type: 'curricular' },
                { name: 'Análisis Químico', code: 'AQ', hours: 4, type: 'curricular' },
                { name: 'Microbiología', code: 'MIC', hours: 3, type: 'curricular' },
                { name: 'Control de Calidad', code: 'CC', hours: 3, type: 'curricular' },
                { name: 'Taller de Química I', code: 'TQ1', hours: 8, type: 'taller' },
                { name: 'Taller de Química II', code: 'TQ2', hours: 8, type: 'taller' },
                { name: 'Práctica Profesional', code: 'PP', hours: 8, type: 'practica' }
            ]}
        ],
        hasSpecializations: true,
        hasGroups: true,
        hasWorkshops: true
    },

    agrotecnica: {
        name: 'Escuela Agrotécnica',
        maxYears: 6,
        evaluationSystem: 'cuatrimestral',
        hasPreReports: true,
        hasIntensification: true,
        instancesPerPeriod: 4,
        basicSubjects: [
            { name: 'Matemática', code: 'MTM', hours: 4, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Prácticas del Lenguaje', code: 'PLG', hours: 4, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Biología', code: 'BLG', hours: 4, type: 'curricular', category: 'basica', years: [2, 3, 4, 5, 6] },
            { name: 'Historia', code: 'HTR', hours: 3, type: 'curricular', category: 'basica', years: [2, 3, 4, 5, 6] },
            { name: 'Geografía', code: 'GGF', hours: 3, type: 'curricular', category: 'basica', years: [2, 3, 4, 5, 6] },
            { name: 'Educación Física', code: 'EFC', hours: 3, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5, 6] },
            { name: 'Inglés', code: 'IGS', hours: 3, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5, 6] },
            { name: 'Construcción de Ciudadanía', code: 'CCD', hours: 2, type: 'curricular', category: 'basica', years: [4, 5, 6] },
            { name: 'Artística', code: 'ART', hours: 2, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Físico-Química', code: 'FQA', hours: 3, type: 'curricular', category: 'basica', years: [2, 3] },
            { name: 'Literatura', code: 'LIT', hours: 3, type: 'curricular', category: 'basica', years: [4, 5, 6] },
            { name: 'Matemática Ciclo Superior', code: 'MCS', hours: 4, type: 'curricular', category: 'basica', years: [4, 5, 6] }
        ],
        specializations: [
            { name: 'Producción Agropecuaria', code: 'PA', years: [4, 5, 6], subjects: [
                { name: 'Producción Vegetal', code: 'PV', hours: 4, type: 'curricular' },
                { name: 'Producción Animal', code: 'PA', hours: 4, type: 'curricular' },
                { name: 'Mecanización Agrícola', code: 'MA', hours: 3, type: 'curricular' },
                { name: 'Economía Agraria', code: 'EA', hours: 3, type: 'curricular' },
                { name: 'Taller de Producción I', code: 'TP1', hours: 8, type: 'taller' },
                { name: 'Taller de Producción II', code: 'TP2', hours: 8, type: 'taller' },
                { name: 'Práctica Profesional', code: 'PP', hours: 8, type: 'practica' }
            ]}
        ],
        hasSpecializations: true,
        hasGroups: true,
        hasWorkshops: true
    },

    artistica: {
        name: 'Escuela Artística',
        maxYears: 5,
        evaluationSystem: 'cuatrimestral',
        hasPreReports: true,
        hasIntensification: true,
        instancesPerPeriod: 4,
        basicSubjects: [
            { name: 'Matemática', code: 'MTM', hours: 4, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Prácticas del Lenguaje', code: 'PLG', hours: 4, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Biología', code: 'BLG', hours: 3, type: 'curricular', category: 'basica', years: [2, 3, 4, 5] },
            { name: 'Historia', code: 'HTR', hours: 3, type: 'curricular', category: 'basica', years: [2, 3, 4, 5] },
            { name: 'Geografía', code: 'GGF', hours: 3, type: 'curricular', category: 'basica', years: [2, 3, 4, 5] },
            { name: 'Educación Física', code: 'EFC', hours: 3, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5] },
            { name: 'Inglés', code: 'IGS', hours: 3, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5] },
            { name: 'Construcción de Ciudadanía', code: 'CCD', hours: 2, type: 'curricular', category: 'basica', years: [4, 5] },
            { name: 'Artística', code: 'ART', hours: 4, type: 'curricular', category: 'basica', years: [1, 2, 3, 4, 5] },
            { name: 'Físico-Química', code: 'FQA', hours: 3, type: 'curricular', category: 'basica', years: [2, 3] },
            { name: 'Literatura', code: 'LIT', hours: 3, type: 'curricular', category: 'basica', years: [4, 5] },
            { name: 'Matemática Ciclo Superior', code: 'MCS', hours: 4, type: 'curricular', category: 'basica', years: [4, 5] }
        ],
        specializations: [
            { name: 'Música', code: 'MUS', years: [4, 5], subjects: [
                { name: 'Teoría Musical', code: 'TM', hours: 4, type: 'curricular' },
                { name: 'Instrumento Principal', code: 'IP', hours: 4, type: 'curricular' },
                { name: 'Historia de la Música', code: 'HM', hours: 3, type: 'curricular' },
                { name: 'Taller de Música I', code: 'TM1', hours: 6, type: 'taller' },
                { name: 'Taller de Música II', code: 'TM2', hours: 6, type: 'taller' }
            ]},
            { name: 'Artes Visuales', code: 'AV', years: [4, 5], subjects: [
                { name: 'Dibujo', code: 'DIB', hours: 4, type: 'curricular' },
                { name: 'Pintura', code: 'PIN', hours: 4, type: 'curricular' },
                { name: 'Escultura', code: 'ESC', hours: 3, type: 'curricular' },
                { name: 'Taller de Artes Visuales I', code: 'TAV1', hours: 6, type: 'taller' },
                { name: 'Taller de Artes Visuales II', code: 'TAV2', hours: 6, type: 'taller' }
            ]}
        ],
        hasSpecializations: true,
        hasGroups: true,
        hasWorkshops: true
    },

    adultos: {
        name: 'Educación de Adultos',
        maxYears: 3,
        evaluationSystem: 'cuatrimestral',
        hasPreReports: false,
        hasIntensification: false,
        instancesPerPeriod: 2,
        basicSubjects: [
            { name: 'Matemática', code: 'MTM', hours: 4, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Prácticas del Lenguaje', code: 'PLG', hours: 4, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Ciencias Naturales', code: 'CNT', hours: 3, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Ciencias Sociales', code: 'CS', hours: 3, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Educación Física', code: 'EFC', hours: 2, type: 'curricular', category: 'basica', years: [1, 2, 3] },
            { name: 'Construcción de Ciudadanía', code: 'CCD', hours: 2, type: 'curricular', category: 'basica', years: [2, 3] }
        ],
        specializations: [],
        hasSpecializations: false,
        hasGroups: false,
        hasWorkshops: false
    }
};

/**
 * Obtiene tipos de escuela disponibles
 * @returns {Array} - Array de tipos de escuela
 */
const getAvailableSchoolTypes = () => {
    return Object.keys(SCHOOL_TYPE_CONFIGS).map(key => ({
        key,
        name: SCHOOL_TYPE_CONFIGS[key].name,
        maxYears: SCHOOL_TYPE_CONFIGS[key].maxYears,
        evaluationSystem: SCHOOL_TYPE_CONFIGS[key].evaluationSystem,
        hasSpecializations: SCHOOL_TYPE_CONFIGS[key].hasSpecializations,
        hasGroups: SCHOOL_TYPE_CONFIGS[key].hasGroups,
        hasWorkshops: SCHOOL_TYPE_CONFIGS[key].hasWorkshops
    }));
};

/**
 * Obtiene configuración por tipo de escuela
 * @param {string} schoolType - Tipo de escuela
 * @returns {Object|null} - Configuración o null si no existe
 */
const getSchoolTypeConfig = (schoolType) => {
    return SCHOOL_TYPE_CONFIGS[schoolType] || null;
};

module.exports = {
    SCHOOL_TYPE_CONFIGS,
    getAvailableSchoolTypes,
    getSchoolTypeConfig
};
