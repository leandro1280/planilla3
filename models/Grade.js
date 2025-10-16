// ========================================
// MODELO DE CALIFICACIONES
// ========================================

const { supabase } = require('../config/database');

class Grade {
    constructor(data) {
        this.id = data.id;
        this.student_id = data.student_id;
        this.subject_id = data.subject_id;
        this.teacher_id = data.teacher_id;
        this.grade_value = data.grade_value;
        this.period = data.period;
        this.instance = data.instance;
        this.tea = data.tea;
        this.tep = data.tep;
        this.ted = data.ted;
        this.is_pre_report = data.is_pre_report;
        this.comments = data.comments;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ========================================
    // MÉTODOS ESTÁTICOS
    // ========================================

    /**
     * Crear nueva calificación
     */
    static async create(gradeData) {
        try {
            const { data, error } = await supabase
                .from('grades')
                .insert([gradeData])
                .select()
                .single();

            if (error) throw error;
            return new Grade(data);
        } catch (error) {
            throw new Error(`Error creando calificación: ${error.message}`);
        }
    }

    /**
     * Obtener calificación por ID
     */
    static async findById(gradeId) {
        try {
            const { data, error } = await supabase
                .from('grades')
                .select('*')
                .eq('id', gradeId)
                .single();

            if (error) throw error;
            return data ? new Grade(data) : null;
        } catch (error) {
            throw new Error(`Error obteniendo calificación: ${error.message}`);
        }
    }

    /**
     * Obtener calificaciones por estudiante
     */
    static async findByStudent(studentId, subjectId = null, period = null) {
        try {
            let query = supabase
                .from('grades')
                .select(`
                    *,
                    school_subjects (name, code),
                    users (first_name, last_name)
                `)
                .eq('student_id', studentId);

            if (subjectId) {
                query = query.eq('subject_id', subjectId);
            }

            if (period) {
                query = query.eq('period', period);
            }

            const { data, error } = await query.order('period', { ascending: true });

            if (error) throw error;
            return data.map(grade => new Grade(grade));
        } catch (error) {
            throw new Error(`Error obteniendo calificaciones: ${error.message}`);
        }
    }

    /**
     * Obtener calificaciones por materia
     */
    static async findBySubject(subjectId, period = null) {
        try {
            let query = supabase
                .from('grades')
                .select(`
                    *,
                    students (first_name, last_name, dni)
                `)
                .eq('subject_id', subjectId);

            if (period) {
                query = query.eq('period', period);
            }

            const { data, error } = await query.order('students.last_name', { ascending: true });

            if (error) throw error;
            return data.map(grade => new Grade(grade));
        } catch (error) {
            throw new Error(`Error obteniendo calificaciones por materia: ${error.message}`);
        }
    }

    /**
     * Actualizar calificación
     */
    static async update(gradeId, updateData) {
        try {
            const { data, error } = await supabase
                .from('grades')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', gradeId)
                .select()
                .single();

            if (error) throw error;
            return new Grade(data);
        } catch (error) {
            throw new Error(`Error actualizando calificación: ${error.message}`);
        }
    }

    /**
     * Eliminar calificación
     */
    static async delete(gradeId) {
        try {
            const { error } = await supabase
                .from('grades')
                .delete()
                .eq('id', gradeId);

            if (error) throw error;
            return true;
        } catch (error) {
            throw new Error(`Error eliminando calificación: ${error.message}`);
        }
    }

    // ========================================
    // MÉTODOS DE CÁLCULO
    // ========================================

    /**
     * Calcular TEA (Trimestre/Evaluación Acumulada)
     */
    static async calculateTEA(studentId, subjectId, period) {
        try {
            const { data, error } = await supabase
                .from('grades')
                .select('grade_value')
                .eq('student_id', studentId)
                .eq('subject_id', subjectId)
                .eq('period', period)
                .eq('is_pre_report', false);

            if (error) throw error;

            if (data.length === 0) return null;

            const sum = data.reduce((acc, grade) => acc + grade.grade_value, 0);
            return Math.round((sum / data.length) * 100) / 100;
        } catch (error) {
            throw new Error(`Error calculando TEA: ${error.message}`);
        }
    }

    /**
     * Calcular TEP (Trimestre/Evaluación Promedio)
     */
    static async calculateTEP(studentId, subjectId, period) {
        try {
            const { data, error } = await supabase
                .from('grades')
                .select('grade_value')
                .eq('student_id', studentId)
                .eq('subject_id', subjectId)
                .eq('period', period);

            if (error) throw error;

            if (data.length === 0) return null;

            const sum = data.reduce((acc, grade) => acc + grade.grade_value, 0);
            return Math.round((sum / data.length) * 100) / 100;
        } catch (error) {
            throw new Error(`Error calculando TEP: ${error.message}`);
        }
    }

    /**
     * Calcular TED (Trimestre/Evaluación Definitiva)
     */
    static async calculateTED(studentId, subjectId, period) {
        try {
            const tea = await this.calculateTEA(studentId, subjectId, period);
            const tep = await this.calculateTEP(studentId, subjectId, period);

            if (tea === null || tep === null) return null;

            // TED = (TEA + TEP) / 2
            return Math.round(((tea + tep) / 2) * 100) / 100;
        } catch (error) {
            throw new Error(`Error calculando TED: ${error.message}`);
        }
    }

    /**
     * Obtener promedio general del estudiante
     */
    static async getStudentAverage(studentId, period = null) {
        try {
            let query = supabase
                .from('grades')
                .select('grade_value, period')
                .eq('student_id', studentId)
                .eq('is_pre_report', false);

            if (period) {
                query = query.eq('period', period);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data.length === 0) return null;

            const sum = data.reduce((acc, grade) => acc + grade.grade_value, 0);
            return Math.round((sum / data.length) * 100) / 100;
        } catch (error) {
            throw new Error(`Error calculando promedio: ${error.message}`);
        }
    }
}

module.exports = Grade;
