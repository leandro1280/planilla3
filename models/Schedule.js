// ========================================
// MODELO DE HORARIOS
// ========================================

const { supabase } = require('../config/database');

class Schedule {
    constructor(data) {
        this.id = data.id;
        this.course_id = data.course_id;
        this.academic_year = data.academic_year;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ========================================
    // MÉTODOS ESTÁTICOS
    // ========================================

    /**
     * Crear nuevo horario
     */
    static async create(scheduleData) {
        try {
            const { data, error } = await supabase
                .from('course_schedules')
                .insert([scheduleData])
                .select()
                .single();

            if (error) throw error;
            return new Schedule(data);
        } catch (error) {
            throw new Error(`Error creando horario: ${error.message}`);
        }
    }

    /**
     * Obtener horario por ID
     */
    static async findById(scheduleId) {
        try {
            const { data, error } = await supabase
                .from('course_schedules')
                .select('*')
                .eq('id', scheduleId)
                .single();

            if (error) throw error;
            return data ? new Schedule(data) : null;
        } catch (error) {
            throw new Error(`Error obteniendo horario: ${error.message}`);
        }
    }

    /**
     * Obtener horario por curso
     */
    static async findByCourse(courseId, academicYear = null) {
        try {
            let query = supabase
                .from('course_schedules')
                .select('*')
                .eq('course_id', courseId)
                .eq('is_active', true);

            if (academicYear) {
                query = query.eq('academic_year', academicYear);
            }

            const { data, error } = await query.single();

            if (error) throw error;
            return data ? new Schedule(data) : null;
        } catch (error) {
            throw new Error(`Error obteniendo horario del curso: ${error.message}`);
        }
    }

    /**
     * Crear bloque de horario
     */
    static async createBlock(blockData) {
        try {
            const { data, error } = await supabase
                .from('schedule_blocks')
                .insert([blockData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error creando bloque de horario: ${error.message}`);
        }
    }

    /**
     * Obtener bloques de horario
     */
    static async getBlocks(scheduleId) {
        try {
            const { data, error } = await supabase
                .from('schedule_blocks')
                .select(`
                    *,
                    school_subjects (name, code),
                    users (first_name, last_name)
                `)
                .eq('schedule_id', scheduleId)
                .order('day_of_week', { ascending: true })
                .order('start_time', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error obteniendo bloques de horario: ${error.message}`);
        }
    }

    /**
     * Verificar disponibilidad de profesor
     */
    static async checkTeacherAvailability(teacherId, dayOfWeek, startTime, endTime, academicYear) {
        try {
            const { data, error } = await supabase
                .from('schedule_blocks')
                .select('id')
                .eq('teacher_id', teacherId)
                .eq('day_of_week', dayOfWeek)
                .eq('academic_year', academicYear)
                .or(`start_time.lte.${startTime},end_time.gte.${endTime}`);

            if (error) throw error;
            return data.length === 0;
        } catch (error) {
            throw new Error(`Error verificando disponibilidad: ${error.message}`);
        }
    }

    /**
     * Obtener horario de profesor
     */
    static async getTeacherSchedule(teacherId, academicYear = null) {
        try {
            let query = supabase
                .from('schedule_blocks')
                .select(`
                    *,
                    school_subjects (name, code),
                    course_schedules (courses (year, division))
                `)
                .eq('teacher_id', teacherId);

            if (academicYear) {
                query = query.eq('academic_year', academicYear);
            }

            const { data, error } = await query.order('day_of_week', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error obteniendo horario del profesor: ${error.message}`);
        }
    }

    /**
     * Actualizar bloque de horario
     */
    static async updateBlock(blockId, updateData) {
        try {
            const { data, error } = await supabase
                .from('schedule_blocks')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', blockId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error actualizando bloque: ${error.message}`);
        }
    }

    /**
     * Eliminar bloque de horario
     */
    static async deleteBlock(blockId) {
        try {
            const { error } = await supabase
                .from('schedule_blocks')
                .delete()
                .eq('id', blockId);

            if (error) throw error;
            return true;
        } catch (error) {
            throw new Error(`Error eliminando bloque: ${error.message}`);
        }
    }

    // ========================================
    // MÉTODOS DE INSTANCIA
    // ========================================

    /**
     * Obtener bloques de este horario
     */
    async getBlocks() {
        return await Schedule.getBlocks(this.id);
    }

    /**
     * Formatear horario para mostrar
     */
    async getFormattedSchedule() {
        try {
            const blocks = await this.getBlocks();
            
            const schedule = {
                lunes: [],
                martes: [],
                miercoles: [],
                jueves: [],
                viernes: [],
                sabado: []
            };

            blocks.forEach(block => {
                const dayNames = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
                const dayName = dayNames[block.day_of_week - 1];
                
                if (schedule[dayName]) {
                    schedule[dayName].push({
                        id: block.id,
                        subject: block.school_subjects.name,
                        teacher: `${block.users.first_name} ${block.users.last_name}`,
                        start_time: block.start_time,
                        end_time: block.end_time,
                        classroom: block.classroom
                    });
                }
            });

            return schedule;
        } catch (error) {
            throw new Error(`Error formateando horario: ${error.message}`);
        }
    }
}

module.exports = Schedule;
