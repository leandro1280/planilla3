// ========================================
// MODELO DE MATERIAS
// ========================================

const { supabase } = require('../config/database');

class Subject {
    constructor(data) {
        this.id = data.id;
        this.school_id = data.school_id;
        this.name = data.name;
        this.code = data.code;
        this.category = data.category;
        this.type = data.type;
        this.hours_per_week = data.hours_per_week;
        this.has_groups = data.has_groups;
        this.max_students_per_group = data.max_students_per_group;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ========================================
    // MÉTODOS ESTÁTICOS
    // ========================================

    /**
     * Crear nueva materia
     */
    static async create(subjectData) {
        try {
            const { data, error } = await supabase
                .from('school_subjects')
                .insert([subjectData])
                .select()
                .single();

            if (error) throw error;
            return new Subject(data);
        } catch (error) {
            throw new Error(`Error creando materia: ${error.message}`);
        }
    }

    /**
     * Obtener materia por ID
     */
    static async findById(subjectId) {
        try {
            const { data, error } = await supabase
                .from('school_subjects')
                .select('*')
                .eq('id', subjectId)
                .single();

            if (error) throw error;
            return data ? new Subject(data) : null;
        } catch (error) {
            throw new Error(`Error obteniendo materia: ${error.message}`);
        }
    }

    /**
     * Obtener materias por escuela
     */
    static async findBySchool(schoolId, category = null) {
        try {
            let query = supabase
                .from('school_subjects')
                .select('*')
                .eq('school_id', schoolId)
                .eq('is_active', true);

            if (category) {
                query = query.eq('category', category);
            }

            const { data, error } = await query.order('name', { ascending: true });

            if (error) throw error;
            return data.map(subject => new Subject(subject));
        } catch (error) {
            throw new Error(`Error obteniendo materias: ${error.message}`);
        }
    }

    /**
     * Obtener materias por año
     */
    static async findByYear(schoolId, year) {
        try {
            const { data, error } = await supabase
                .from('course_subjects')
                .select(`
                    school_subjects (*)
                `)
                .eq('course_id', year)
                .eq('school_subjects.school_id', schoolId);

            if (error) throw error;
            return data.map(item => new Subject(item.school_subjects));
        } catch (error) {
            throw new Error(`Error obteniendo materias por año: ${error.message}`);
        }
    }

    /**
     * Actualizar materia
     */
    static async update(subjectId, updateData) {
        try {
            const { data, error } = await supabase
                .from('school_subjects')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', subjectId)
                .select()
                .single();

            if (error) throw error;
            return new Subject(data);
        } catch (error) {
            throw new Error(`Error actualizando materia: ${error.message}`);
        }
    }

    /**
     * Eliminar materia (soft delete)
     */
    static async delete(subjectId) {
        try {
            const { error } = await supabase
                .from('school_subjects')
                .update({ is_active: false })
                .eq('id', subjectId);

            if (error) throw error;
            return true;
        } catch (error) {
            throw new Error(`Error eliminando materia: ${error.message}`);
        }
    }

    // ========================================
    // MÉTODOS DE INSTANCIA
    // ========================================

    /**
     * Obtener cursos que dictan esta materia
     */
    async getCourses() {
        try {
            const { data, error } = await supabase
                .from('course_subjects')
                .select(`
                    *,
                    courses (*)
                `)
                .eq('subject_id', this.id);

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error obteniendo cursos: ${error.message}`);
        }
    }

    /**
     * Verificar si es materia básica
     */
    isBasic() {
        return this.category === 'basica';
    }

    /**
     * Verificar si es taller
     */
    isWorkshop() {
        return this.type === 'taller';
    }
}

module.exports = Subject;
