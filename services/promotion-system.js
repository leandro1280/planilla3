// ========================================
// SISTEMA DE PROMOCIÓN AUTOMÁTICA
// ========================================

const { supabaseAdmin } = require('../config/database');

/**
 * Servicio para gestión de promociones automáticas
 */
class PromotionSystem {
    
    /**
     * Calcula la promoción de un estudiante
     * @param {string} studentId - ID del estudiante
     * @param {number} academicYear - Año académico
     * @returns {Promise<Object>} - Resultado de la promoción
     */
    async calculateStudentPromotion(studentId, academicYear) {
        try {
            // Obtener información del estudiante y su escuela
            const studentInfo = await this.getStudentInfo(studentId);
            if (!studentInfo) {
                throw new Error('Estudiante no encontrado');
            }

            const { schoolType, schoolId } = studentInfo;

            // Obtener configuración de promoción de la escuela
            const promotionConfig = await this.getPromotionConfig(schoolId);

            // Obtener todas las materias del estudiante
            const studentSubjects = await this.getStudentSubjects(studentId, academicYear);

            // Calcular promedio y materias pendientes
            const results = await this.evaluateStudentPerformance(studentSubjects, promotionConfig, schoolType);

            // Crear registro de promoción
            const promotionRecord = await this.createPromotionRecord(studentId, academicYear, results);

            return {
                studentId,
                academicYear,
                ...results,
                promotionRecord
            };

        } catch (error) {
            throw new Error(`Error al calcular promoción: ${error.message}`);
        }
    }

    /**
     * Calcula promociones masivas para un curso
     * @param {string} courseId - ID del curso
     * @param {number} academicYear - Año académico
     * @returns {Promise<Array>} - Resultados de promoción
     */
    async calculateCoursePromotions(courseId, academicYear) {
        try {
            // Obtener todos los estudiantes del curso
            const students = await this.getCourseStudents(courseId);

            const results = [];

            for (const student of students) {
                try {
                    const promotionResult = await this.calculateStudentPromotion(student.id, academicYear);
                    results.push(promotionResult);
                } catch (error) {
                    console.error(`Error al calcular promoción para estudiante ${student.id}:`, error.message);
                    results.push({
                        studentId: student.id,
                        academicYear,
                        error: error.message,
                        promovido: false
                    });
                }
            }

            return results;

        } catch (error) {
            throw new Error(`Error al calcular promociones del curso: ${error.message}`);
        }
    }

    /**
     * Obtiene información del estudiante y su escuela
     * @param {string} studentId - ID del estudiante
     * @returns {Promise<Object|null>} - Información del estudiante
     */
    async getStudentInfo(studentId) {
        try {
            const { data: student, error } = await supabaseAdmin
                .from('students')
                .select(`
                    *,
                    courses (school_id, schools (school_type))
                `)
                .eq('id', studentId)
                .single();

            if (error) throw error;

            return {
                id: student.id,
                name: `${student.first_name} ${student.last_name}`,
                courseId: student.course_id,
                schoolId: student.courses?.school_id,
                schoolType: student.courses?.schools?.school_type
            };

        } catch (error) {
            return null;
        }
    }

    /**
     * Obtiene configuración de promoción de la escuela
     * @param {string} schoolId - ID de la escuela
     * @returns {Promise<Object>} - Configuración de promoción
     */
    async getPromotionConfig(schoolId) {
        try {
            const { data: config, error } = await supabaseAdmin
                .from('school_configurations')
                .select('config_value')
                .eq('school_id', schoolId)
                .eq('config_key', 'promotion_criteria')
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            // Configuración por defecto
            const defaultConfig = {
                minimumAverage: 6.0,
                maxFailedSubjects: 3,
                requireAllSubjects: false,
                considerIntensification: true,
                promotionPercentage: 0.7 // 70% de materias aprobadas
            };

            return config ? config.config_value : defaultConfig;

        } catch (error) {
            throw new Error(`Error al obtener configuración de promoción: ${error.message}`);
        }
    }

    /**
     * Obtiene materias del estudiante con sus notas
     * @param {string} studentId - ID del estudiante
     * @param {number} academicYear - Año académico
     * @returns {Promise<Array>} - Materias con notas
     */
    async getStudentSubjects(studentId, academicYear) {
        try {
            const { data: subjects, error } = await supabaseAdmin
                .from('course_subjects')
                .select(`
                    *,
                    school_subjects (name, code, type, category),
                    grades!inner (
                        *,
                        course_subject_id
                    )
                `)
                .eq('grades.student_id', studentId)
                .eq('courses.academic_year', academicYear)
                .eq('is_active', true);

            if (error) throw error;

            return subjects.map(subject => ({
                id: subject.id,
                subjectId: subject.subject_id,
                name: subject.school_subjects?.name,
                code: subject.school_subjects?.code,
                type: subject.school_subjects?.type,
                category: subject.school_subjects?.category,
                grades: subject.grades
            }));

        } catch (error) {
            throw new Error(`Error al obtener materias del estudiante: ${error.message}`);
        }
    }

    /**
     * Evalúa el rendimiento del estudiante
     * @param {Array} subjects - Materias con notas
     * @param {Object} config - Configuración de promoción
     * @param {string} schoolType - Tipo de escuela
     * @returns {Promise<Object>} - Resultado de la evaluación
     */
    async evaluateStudentPerformance(subjects, config, schoolType) {
        let totalMaterias = 0;
        let materiasAprobadas = 0;
        let materiasPendientes = [];
        let sumaNotas = 0;
        let materiasIntensificacion = [];

        // Ajustar criterios según tipo de escuela
        let maxFailedSubjects = config.maxFailedSubjects;
        if (schoolType === 'primaria') {
            maxFailedSubjects = Math.min(maxFailedSubjects, 2);
        }

        subjects.forEach(subject => {
            totalMaterias++;
            
            // Calcular promedio de la materia
            const subjectAverage = this.calculateSubjectAverage(subject.grades);
            sumaNotas += subjectAverage;

            if (subjectAverage >= config.minimumAverage) {
                materiasAprobadas++;
            } else {
                materiasPendientes.push({
                    subjectId: subject.subjectId,
                    name: subject.name,
                    code: subject.code,
                    average: subjectAverage,
                    type: subject.type,
                    category: subject.category
                });

                // Determinar si necesita intensificación
                if (config.considerIntensification && this.needsIntensification(subjectAverage, subject.type)) {
                    materiasIntensificacion.push({
                        subjectId: subject.subjectId,
                        name: subject.name,
                        code: subject.code,
                        average: subjectAverage
                    });
                }
            }
        });

        const promedioGeneral = totalMaterias > 0 ? sumaNotas / totalMaterias : 0;
        
        // Determinar promoción
        const materiasFallidas = totalMaterias - materiasAprobadas;
        const promovido = materiasFallidas <= maxFailedSubjects;

        return {
            promovido,
            promedio: parseFloat(promedioGeneral.toFixed(2)),
            totalMaterias,
            materiasAprobadas,
            materiasFallidas,
            materiasPendientes,
            materiasIntensificacion,
            maxFailedSubjects,
            criteria: {
                minimumAverage: config.minimumAverage,
                maxFailedSubjects,
                promotionPercentage: config.promotionPercentage
            }
        };
    }

    /**
     * Calcula el promedio de una materia
     * @param {Array} grades - Notas de la materia
     * @returns {number} - Promedio de la materia
     */
    calculateSubjectAverage(grades) {
        if (!grades || grades.length === 0) return 0;

        // Filtrar solo notas numéricas del informe final
        const finalGrades = grades.filter(grade => 
            grade.numeric_grade !== null && 
            grade.grade_type === 'informe'
        );

        if (finalGrades.length === 0) return 0;

        const suma = finalGrades.reduce((total, grade) => total + parseFloat(grade.numeric_grade), 0);
        return suma / finalGrades.length;
    }

    /**
     * Determina si una materia necesita intensificación
     * @param {number} average - Promedio de la materia
     * @param {string} type - Tipo de materia
     * @returns {boolean} - True si necesita intensificación
     */
    needsIntensification(average, type) {
        // Materias curriculares con promedio entre 4 y 5.9
        if (type === 'curricular' && average >= 4 && average < 6) {
            return true;
        }
        
        // Materias de taller con promedio entre 3 y 5.9
        if (type === 'taller' && average >= 3 && average < 6) {
            return true;
        }

        return false;
    }

    /**
     * Crea un registro de promoción
     * @param {string} studentId - ID del estudiante
     * @param {number} academicYear - Año académico
     * @param {Object} results - Resultados de la promoción
     * @returns {Promise<Object>} - Registro creado
     */
    async createPromotionRecord(studentId, academicYear, results) {
        try {
            const studentInfo = await this.getStudentInfo(studentId);
            
            const { data: record, error } = await supabaseAdmin
                .from('student_promotions')
                .insert({
                    student_id: studentId,
                    from_course_id: studentInfo.courseId,
                    academic_year: academicYear,
                    promotion_status: results.promovido ? 'promovido' : 'no_promovido',
                    average_grade: results.promedio,
                    failed_subjects: results.materiasPendientes,
                    intensification_subjects: results.materiasIntensificacion
                })
                .select()
                .single();

            if (error) throw error;

            return record;

        } catch (error) {
            throw new Error(`Error al crear registro de promoción: ${error.message}`);
        }
    }

    /**
     * Obtiene estudiantes de un curso
     * @param {string} courseId - ID del curso
     * @returns {Promise<Array>} - Lista de estudiantes
     */
    async getCourseStudents(courseId) {
        try {
            const { data: students, error } = await supabaseAdmin
                .from('students')
                .select('id, first_name, last_name, dni')
                .eq('course_id', courseId)
                .eq('is_active', true);

            if (error) throw error;

            return students;

        } catch (error) {
            throw new Error(`Error al obtener estudiantes del curso: ${error.message}`);
        }
    }

    /**
     * Obtiene estadísticas de promoción de un curso
     * @param {string} courseId - ID del curso
     * @param {number} academicYear - Año académico
     * @returns {Promise<Object>} - Estadísticas de promoción
     */
    async getPromotionStatistics(courseId, academicYear) {
        try {
            const { data: promotions, error } = await supabaseAdmin
                .from('student_promotions')
                .select(`
                    *,
                    students (course_id)
                `)
                .eq('students.course_id', courseId)
                .eq('academic_year', academicYear);

            if (error) throw error;

            const totalStudents = promotions.length;
            const promovidos = promotions.filter(p => p.promotion_status === 'promovido').length;
            const noPromovidos = promotions.filter(p => p.promotion_status === 'no_promovido').length;

            const promedioGeneral = totalStudents > 0 
                ? promotions.reduce((sum, p) => sum + (p.average_grade || 0), 0) / totalStudents 
                : 0;

            return {
                totalStudents,
                promovidos,
                noPromovidos,
                promedioGeneral: parseFloat(promedioGeneral.toFixed(2)),
                promocionPercentage: totalStudents > 0 ? (promovidos / totalStudents) * 100 : 0
            };

        } catch (error) {
            throw new Error(`Error al obtener estadísticas de promoción: ${error.message}`);
        }
    }

    /**
     * Obtiene historial de promociones de un estudiante
     * @param {string} studentId - ID del estudiante
     * @returns {Promise<Array>} - Historial de promociones
     */
    async getStudentPromotionHistory(studentId) {
        try {
            const { data: history, error } = await supabaseAdmin
                .from('student_promotions')
                .select(`
                    *,
                    courses (year, division)
                `)
                .eq('student_id', studentId)
                .order('academic_year', { ascending: false });

            if (error) throw error;

            return history;

        } catch (error) {
            throw new Error(`Error al obtener historial de promociones: ${error.message}`);
        }
    }
}

module.exports = new PromotionSystem();
