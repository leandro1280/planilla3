// ========================================
// ARCHIVO PRINCIPAL DE CONFIGURACIÓN DE ESCUELAS
// ========================================

// Re-exportar todas las clases y servicios
const schoolConfigService = require('../services/school-config-service');
const { SCHOOL_TYPE_CONFIGS, getAvailableSchoolTypes, getSchoolTypeConfig } = require('../config/school-types');
const { 
    validateSchoolConfig, 
    validateSpecialization, 
    validateSubject, 
    validateCourse 
} = require('./school-validator');

// ========================================
// FUNCIONES DE UTILIDAD EXPORTADAS
// ========================================

/**
 * Función principal para crear configuración de escuela
 * @param {Object} schoolData - Datos de la escuela
 * @returns {Promise<Object>} - Escuela creada
 */
const createSchoolConfig = async (schoolData) => {
    return await schoolConfigService.configureSchool(schoolData);
};

/**
 * Función para obtener configuración de escuela
 * @param {string} schoolId - ID de la escuela
 * @returns {Promise<Object>} - Configuración completa
 */
const getSchoolConfig = async (schoolId) => {
    return await schoolConfigService.getSchoolConfig(schoolId);
};

/**
 * Función para agregar especialización personalizada
 * @param {string} schoolId - ID de la escuela
 * @param {Object} specializationData - Datos de la especialización
 * @returns {Promise<Object>} - Especialización creada
 */
const addCustomSpecialization = async (schoolId, specializationData) => {
    return await schoolConfigService.addCustomSpecialization(schoolId, specializationData);
};

/**
 * Función para agregar materia personalizada
 * @param {string} schoolId - ID de la escuela
 * @param {Object} subjectData - Datos de la materia
 * @returns {Promise<Object>} - Materia creada
 */
const addCustomSubject = async (schoolId, subjectData) => {
    return await schoolConfigService.addCustomSubject(schoolId, subjectData);
};

/**
 * Función para obtener materias por año
 * @param {string} schoolId - ID de la escuela
 * @param {number} year - Año
 * @returns {Promise<Array>} - Materias del año
 */
const getSubjectsByYear = async (schoolId, year) => {
    return await schoolConfigService.getSubjectsByYear(schoolId, year);
};

/**
 * Función para actualizar configuración de escuela
 * @param {string} schoolId - ID de la escuela
 * @param {Object} configData - Datos de configuración
 * @returns {Promise<boolean>} - True si se actualizó
 */
const updateSchoolConfig = async (schoolId, configData) => {
    return await schoolConfigService.updateSchoolConfig(schoolId, configData);
};

module.exports = {
    // Servicio principal
    schoolConfigService,
    
    // Funciones de utilidad
    createSchoolConfig,
    getSchoolConfig,
    addCustomSpecialization,
    addCustomSubject,
    getSubjectsByYear,
    updateSchoolConfig,
    
    // Configuraciones y validaciones
    SCHOOL_TYPE_CONFIGS,
    getAvailableSchoolTypes,
    getSchoolTypeConfig,
    validateSchoolConfig,
    validateSpecialization,
    validateSubject,
    validateCourse
};