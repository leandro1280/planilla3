// ========================================
// MODELO DE CURSOS
// ========================================

const { supabase } = require('../config/database');

class Course {
    constructor(data) {
        this.id = data.id;
        this.school_id = data.school_id;
        this.year = data.year;
        this.division = data.division;
        this.academic_year = data.academic_year;
        this.academic_year_end = data.academic_year_end;
        this.max_students = data.max_students;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ========================================
    // MÉTODOS ESTÁTICOS
    // ========================================

    /**
     * Crear nuevo curso
     */
    static async create(courseData) {
        try {
            const { data, error } = await supabase
                .from('courses')
                .insert([courseData])
                .select()
                .single();

            if (error) throw error;
            return new Course(data);
        } catch (error) {
            throw new Error(`Error creando curso: ${error.message}`);
        }
    }

    /**
     * Obtener curso por ID
     */
    static async findById(courseId) {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('id', courseId)
                .single();

            if (error) throw error;
            return data ? new Course(data) : null;
        } catch (error) {
            throw new Error(`Error obteniendo curso: ${error.message}`);
        }
    }

    /**
     * Obtener cursos por escuela
     */
    static async findBySchool(schoolId, academicYear = null) {
        try {
            let query = supabase
                .from('courses')
                .select('*')
                .eq('school_id', schoolId)
                .eq('is_active', true);

            if (academicYear) {
                query = query.eq('academic_year', academicYear);
            }

            const { data, error } = await query.order('year', { ascending: true });

            if (error) throw error;
            return data.map(course => new Course(course));
        } catch (error) {
            throw new Error(`Error obteniendo cursos: ${error.message}`);
        }
    }

    /**
     * Obtener cursos por año
     */
    static async findByYear(schoolId, year, academicYear = null) {
        try {
            let query = supabase
                .from('courses')
                .select('*')
                .eq('school_id', schoolId)
                .eq('year', year)
                .eq('is_active', true);

            if (academicYear) {
                query = query.eq('academic_year', academicYear);
            }

            const { data, error } = await query.order('division', { ascending: true });

            if (error) throw error;
            return data.map(course => new Course(course));
        } catch (error) {
            throw new Error(`Error obteniendo cursos por año: ${error.message}`);
        }
    }

    /**
     * Actualizar curso
     */
    static async update(courseId, updateData) {
        try {
            const { data, error } = await supabase
                .from('courses')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', courseId)
                .select()
                .single();

            if (error) throw error;
            return new Course(data);
        } catch (error) {
            throw new Error(`Error actualizando curso: ${error.message}`);
        }
    }

    /**
     * Eliminar curso (soft delete)
     */
    static async delete(courseId) {
        try {
            const { error } = await supabase
                .from('courses')
                .update({ is_active: false })
                .eq('id', courseId);

            if (error) throw error;
            return true;
        } catch (error) {
            throw new Error(`Error eliminando curso: ${error.message}`);
        }
    }

    // ========================================
    // MÉTODOS DE INSTANCIA
    // ========================================

    /**
     * Obtener estudiantes del curso
     */
    async getStudents() {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('course_id', this.id)
                .eq('is_active', true)
                .order('last_name', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error obteniendo estudiantes: ${error.message}`);
        }
    }

    /**
     * Obtener materias del curso
     */
    async getSubjects() {
        try {
            const { data, error } = await supabase
                .from('course_subjects')
                .select(`
                    *,
                    school_subjects (*),
                    users (id, first_name, last_name)
                `)
                .eq('course_id', this.id);

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error obteniendo materias: ${error.message}`);
        }
    }

    /**
     * Obtener estadísticas del curso
     */
    async getStats() {
        try {
            const students = await this.getStudents();
            const subjects = await this.getSubjects();

            return {
                total_students: students.length,
                total_subjects: subjects.length,
                max_students: this.max_students,
                occupancy_rate: this.max_students ? (students.length / this.max_students) * 100 : 0
            };
        } catch (error) {
            throw new Error(`Error obteniendo estadísticas: ${error.message}`);
        }
    }

    /**
     * Verificar si el curso está completo
     */
    isFull() {
        if (!this.max_students) return false;
        return this.getStudents().then(students => students.length >= this.max_students);
    }
}

module.exports = Course;
