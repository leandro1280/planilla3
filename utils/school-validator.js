// ========================================
// VALIDADOR DE CONFIGURACIÓN DE ESCUELAS
// ========================================

const { getSchoolTypeConfig } = require('../config/school-types');

/**
 * Valida la configuración de una escuela
 * @param {Object} configData - Datos de configuración
 * @returns {Object} - Resultado de la validación
 */
const validateSchoolConfig = (configData) => {
    const errors = [];
    const warnings = [];

    // Validar datos básicos
    if (!configData.name || configData.name.trim().length < 3) {
        errors.push('El nombre de la escuela debe tener al menos 3 caracteres');
    }

    if (!configData.code || configData.code.trim().length < 2) {
        errors.push('El código de la escuela debe tener al menos 2 caracteres');
    }

    if (!configData.schoolType || !getSchoolTypeConfig(configData.schoolType)) {
        errors.push('Tipo de escuela no válido');
    }

    if (!configData.city || configData.city.trim().length < 2) {
        errors.push('La ciudad es requerida');
    }

    // Validar email si se proporciona
    if (configData.email && !isValidEmail(configData.email)) {
        errors.push('El formato del email no es válido');
    }

    // Validar teléfono si se proporciona
    if (configData.phone && !isValidPhone(configData.phone)) {
        warnings.push('El formato del teléfono puede no ser válido');
    }

    // Validar configuración específica del tipo de escuela
    if (configData.schoolType) {
        const schoolTypeConfig = getSchoolTypeConfig(configData.schoolType);
        if (schoolTypeConfig) {
            const typeValidation = validateSchoolTypeSpecific(configData, schoolTypeConfig);
            errors.push(...typeValidation.errors);
            warnings.push(...typeValidation.warnings);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        hasWarnings: warnings.length > 0
    };
};

/**
 * Valida aspectos específicos del tipo de escuela
 * @param {Object} configData - Datos de configuración
 * @param {Object} schoolTypeConfig - Configuración del tipo de escuela
 * @returns {Object} - Errores y advertencias específicas
 */
const validateSchoolTypeSpecific = (configData, schoolTypeConfig) => {
    const errors = [];
    const warnings = [];

    // Validar sistema de evaluación
    if (configData.evaluationSystem && configData.evaluationSystem !== schoolTypeConfig.evaluationSystem) {
        warnings.push(`El tipo de escuela "${schoolTypeConfig.name}" típicamente usa sistema ${schoolTypeConfig.evaluationSystem}`);
    }

    // Validar pre-informes
    if (configData.hasPreReports !== undefined && configData.hasPreReports !== schoolTypeConfig.hasPreReports) {
        warnings.push(`El tipo de escuela "${schoolTypeConfig.name}" típicamente ${schoolTypeConfig.hasPreReports ? 'tiene' : 'no tiene'} pre-informes`);
    }

    // Validar intensificación
    if (configData.hasIntensification !== undefined && configData.hasIntensification !== schoolTypeConfig.hasIntensification) {
        warnings.push(`El tipo de escuela "${schoolTypeConfig.name}" típicamente ${schoolTypeConfig.hasIntensification ? 'tiene' : 'no tiene'} períodos de intensificación`);
    }

    // Validar instancias por período
    if (configData.instancesPerPeriod && configData.instancesPerPeriod !== schoolTypeConfig.instancesPerPeriod) {
        warnings.push(`El tipo de escuela "${schoolTypeConfig.name}" típicamente tiene ${schoolTypeConfig.instancesPerPeriod} instancias por período`);
    }

    return { errors, warnings };
};

/**
 * Valida una especialización
 * @param {Object} specializationData - Datos de la especialización
 * @returns {Object} - Resultado de la validación
 */
const validateSpecialization = (specializationData) => {
    const errors = [];
    const warnings = [];

    if (!specializationData.name || specializationData.name.trim().length < 2) {
        errors.push('El nombre de la especialización debe tener al menos 2 caracteres');
    }

    if (!specializationData.code || specializationData.code.trim().length < 2) {
        errors.push('El código de la especialización debe tener al menos 2 caracteres');
    }

    if (!specializationData.startYear || specializationData.startYear < 1 || specializationData.startYear > 7) {
        errors.push('El año de inicio debe estar entre 1 y 7');
    }

    if (!specializationData.endYear || specializationData.endYear < 1 || specializationData.endYear > 7) {
        errors.push('El año de fin debe estar entre 1 y 7');
    }

    if (specializationData.startYear && specializationData.endYear && specializationData.startYear >= specializationData.endYear) {
        errors.push('El año de inicio debe ser menor al año de fin');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Valida una materia
 * @param {Object} subjectData - Datos de la materia
 * @returns {Object} - Resultado de la validación
 */
const validateSubject = (subjectData) => {
    const errors = [];
    const warnings = [];

    if (!subjectData.name || subjectData.name.trim().length < 2) {
        errors.push('El nombre de la materia debe tener al menos 2 caracteres');
    }

    if (!subjectData.code || subjectData.code.trim().length < 2) {
        errors.push('El código de la materia debe tener al menos 2 caracteres');
    }

    if (!subjectData.hours || subjectData.hours < 1 || subjectData.hours > 10) {
        errors.push('Las horas por semana deben estar entre 1 y 10');
    }

    if (!subjectData.type || !['curricular', 'taller', 'practica', 'optativa'].includes(subjectData.type)) {
        errors.push('El tipo de materia debe ser: curricular, taller, practica u optativa');
    }

    if (!subjectData.category || !['basica', 'especialidad', 'taller', 'practica', 'optativa'].includes(subjectData.category)) {
        errors.push('La categoría de materia debe ser: basica, especialidad, taller, practica u optativa');
    }

    if (!subjectData.startYear || subjectData.startYear < 1 || subjectData.startYear > 7) {
        errors.push('El año de inicio debe estar entre 1 y 7');
    }

    if (!subjectData.endYear || subjectData.endYear < 1 || subjectData.endYear > 7) {
        errors.push('El año de fin debe estar entre 1 y 7');
    }

    if (subjectData.startYear && subjectData.endYear && subjectData.startYear > subjectData.endYear) {
        errors.push('El año de inicio no puede ser mayor al año de fin');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Valida un curso
 * @param {Object} courseData - Datos del curso
 * @returns {Object} - Resultado de la validación
 */
const validateCourse = (courseData) => {
    const errors = [];
    const warnings = [];

    if (!courseData.year || courseData.year < 1 || courseData.year > 7) {
        errors.push('El año del curso debe estar entre 1 y 7');
    }

    if (!courseData.division || courseData.division.trim().length < 1) {
        errors.push('La división del curso es requerida');
    }

    if (!courseData.cycle || !['basico', 'superior'].includes(courseData.cycle)) {
        errors.push('El ciclo debe ser: basico o superior');
    }

    if (!courseData.shift || !['mañana', 'tarde', 'vespertino', 'noche'].includes(courseData.shift)) {
        errors.push('El turno debe ser: mañana, tarde, vespertino o noche');
    }

    if (!courseData.maxStudents || courseData.maxStudents < 1 || courseData.maxStudents > 50) {
        errors.push('El máximo de estudiantes debe estar entre 1 y 50');
    }

    if (courseData.year >= 4 && courseData.cycle === 'superior' && !courseData.specializationId) {
        warnings.push('Los cursos de ciclo superior típicamente tienen especialización');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Valida formato de teléfono
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} - True si es válido
 */
const isValidPhone = (phone) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
};

module.exports = {
    validateSchoolConfig,
    validateSpecialization,
    validateSubject,
    validateCourse,
    isValidEmail,
    isValidPhone
};
