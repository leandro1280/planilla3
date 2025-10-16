// ========================================
// CONTROLADOR DE ESCUELAS
// ========================================

const School = require('../models/School');
const schoolConfigService = require('../services/school-config-service');

class SchoolController {
    /**
     * Crear escuela
     */
    static async createSchool(req, res) {
        try {
            const schoolData = req.body;
            const school = await schoolConfigService.configureSchool(schoolData);

            res.status(201).json({
                success: true,
                school
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener configuración de escuela
     */
    static async getSchoolConfig(req, res) {
        try {
            const { schoolId } = req.params;
            const config = await schoolConfigService.getSchoolConfig(schoolId);

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
     * Actualizar configuración de escuela
     */
    static async updateSchoolConfig(req, res) {
        try {
            const { schoolId } = req.params;
            const configData = req.body;

            await schoolConfigService.updateSchoolConfig(schoolId, configData);

            res.json({
                success: true,
                message: 'Configuración actualizada correctamente'
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Agregar especialización personalizada
     */
    static async addSpecialization(req, res) {
        try {
            const { schoolId } = req.params;
            const specializationData = req.body;

            const specialization = await schoolConfigService.addCustomSpecialization(schoolId, specializationData);

            res.status(201).json({
                success: true,
                specialization
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener especializaciones
     */
    static async getSpecializations(req, res) {
        try {
            const { schoolId } = req.params;
            const specializations = await schoolConfigService.getSpecializations(schoolId);

            res.json({
                success: true,
                specializations
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Agregar materia personalizada
     */
    static async addSubject(req, res) {
        try {
            const { schoolId } = req.params;
            const subjectData = req.body;

            const subject = await schoolConfigService.addCustomSubject(schoolId, subjectData);

            res.status(201).json({
                success: true,
                subject
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener materias por año
     */
    static async getSubjectsByYear(req, res) {
        try {
            const { schoolId, year } = req.params;
            const subjects = await schoolConfigService.getSubjectsByYear(schoolId, parseInt(year));

            res.json({
                success: true,
                subjects
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener tipos de escuela disponibles
     */
    static async getSchoolTypes(req, res) {
        try {
            const { getAvailableSchoolTypes } = require('../utils/school-config');
            const schoolTypes = getAvailableSchoolTypes();

            res.json({
                success: true,
                schoolTypes
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Obtener estadísticas de la escuela
     */
    static async getSchoolStats(req, res) {
        try {
            const { schoolId } = req.params;
            const school = await School.findById(schoolId);

            if (!school) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Escuela no encontrada' 
                });
            }

            const stats = await school.getStats();

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }
}

module.exports = SchoolController;
