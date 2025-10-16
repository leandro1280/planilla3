// ========================================
// GESTOR DE HORARIOS EN TIEMPO REAL
// ========================================

const { supabaseAdmin } = require('../config/database');

/**
 * Servicio para gestión de horarios en tiempo real
 */
class ScheduleManager {
    
    /**
     * Crea un horario para un curso
     * @param {string} courseId - ID del curso
     * @param {number} academicYear - Año académico
     * @returns {Promise<Object>} - Horario creado
     */
    async createCourseSchedule(courseId, academicYear) {
        try {
            // Verificar si ya existe un horario activo
            const existingSchedule = await this.getActiveCourseSchedule(courseId, academicYear);
            if (existingSchedule) {
                throw new Error('Ya existe un horario activo para este curso');
            }

            const { data: schedule, error } = await supabaseAdmin
                .from('course_schedules')
                .insert({
                    course_id: courseId,
                    academic_year: academicYear,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;

            return schedule;
        } catch (error) {
            throw new Error(`Error al crear horario: ${error.message}`);
        }
    }

    /**
     * Crea un bloque de horario
     * @param {Object} blockData - Datos del bloque
     * @returns {Promise<Object>} - Bloque creado
     */
    async createScheduleBlock(blockData) {
        try {
            const { scheduleId, dayOfWeek, startTime, endTime, subjectId, teacherId, groupId, classroom } = blockData;

            // Verificar disponibilidad del profesor
            const isAvailable = await this.checkTeacherAvailability(teacherId, dayOfWeek, startTime, endTime);
            if (!isAvailable) {
                throw new Error('El profesor no está disponible en ese horario');
            }

            // Verificar disponibilidad del aula
            const classroomAvailable = await this.checkClassroomAvailability(classroom, dayOfWeek, startTime, endTime);
            if (!classroomAvailable) {
                throw new Error('El aula no está disponible en ese horario');
            }

            const { data: block, error } = await supabaseAdmin
                .from('schedule_blocks')
                .insert({
                    schedule_id: scheduleId,
                    day_of_week: dayOfWeek,
                    start_time: startTime,
                    end_time: endTime,
                    subject_id: subjectId,
                    teacher_id: teacherId,
                    group_id: groupId,
                    classroom: classroom,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;

            return block;
        } catch (error) {
            throw new Error(`Error al crear bloque de horario: ${error.message}`);
        }
    }

    /**
     * Obtiene el horario de un curso
     * @param {string} courseId - ID del curso
     * @param {number} academicYear - Año académico
     * @returns {Promise<Object>} - Horario del curso
     */
    async getCourseSchedule(courseId, academicYear) {
        try {
            const { data: schedule, error } = await supabaseAdmin
                .from('course_schedules')
                .select(`
                    *,
                    schedule_blocks (
                        *,
                        school_subjects (name, code),
                        users (first_name, last_name),
                        course_groups (name)
                    )
                `)
                .eq('course_id', courseId)
                .eq('academic_year', academicYear)
                .eq('is_active', true)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return schedule;
        } catch (error) {
            throw new Error(`Error al obtener horario: ${error.message}`);
        }
    }

    /**
     * Obtiene horario activo de un curso
     * @param {string} courseId - ID del curso
     * @param {number} academicYear - Año académico
     * @returns {Promise<Object|null>} - Horario activo o null
     */
    async getActiveCourseSchedule(courseId, academicYear) {
        try {
            const { data: schedule, error } = await supabaseAdmin
                .from('course_schedules')
                .select('*')
                .eq('course_id', courseId)
                .eq('academic_year', academicYear)
                .eq('is_active', true)
                .single();

            if (error && error.code === 'PGRST116') return null;
            if (error) throw error;

            return schedule;
        } catch (error) {
            throw new Error(`Error al obtener horario activo: ${error.message}`);
        }
    }

    /**
     * Actualiza un bloque de horario
     * @param {string} blockId - ID del bloque
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<Object>} - Bloque actualizado
     */
    async updateScheduleBlock(blockId, updateData) {
        try {
            const { dayOfWeek, startTime, endTime, teacherId, classroom } = updateData;

            // Si se cambia horario o profesor, verificar disponibilidad
            if (dayOfWeek || startTime || endTime || teacherId) {
                const currentBlock = await this.getScheduleBlock(blockId);
                if (!currentBlock) {
                    throw new Error('Bloque de horario no encontrado');
                }

                const checkDay = dayOfWeek || currentBlock.day_of_week;
                const checkStart = startTime || currentBlock.start_time;
                const checkEnd = endTime || currentBlock.end_time;
                const checkTeacher = teacherId || currentBlock.teacher_id;

                // Verificar disponibilidad del profesor (excluyendo el bloque actual)
                const isAvailable = await this.checkTeacherAvailability(checkTeacher, checkDay, checkStart, checkEnd, blockId);
                if (!isAvailable) {
                    throw new Error('El profesor no está disponible en ese horario');
                }

                // Verificar disponibilidad del aula (excluyendo el bloque actual)
                const classroomAvailable = await this.checkClassroomAvailability(classroom || currentBlock.classroom, checkDay, checkStart, checkEnd, blockId);
                if (!classroomAvailable) {
                    throw new Error('El aula no está disponible en ese horario');
                }
            }

            const { data: block, error } = await supabaseAdmin
                .from('schedule_blocks')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', blockId)
                .select()
                .single();

            if (error) throw error;

            return block;
        } catch (error) {
            throw new Error(`Error al actualizar bloque de horario: ${error.message}`);
        }
    }

    /**
     * Elimina un bloque de horario
     * @param {string} blockId - ID del bloque
     * @returns {Promise<boolean>} - True si se eliminó
     */
    async deleteScheduleBlock(blockId) {
        try {
            const { error } = await supabaseAdmin
                .from('schedule_blocks')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', blockId);

            if (error) throw error;

            return true;
        } catch (error) {
            throw new Error(`Error al eliminar bloque de horario: ${error.message}`);
        }
    }

    /**
     * Verifica disponibilidad de un profesor
     * @param {string} teacherId - ID del profesor
     * @param {number} dayOfWeek - Día de la semana (1-7)
     * @param {string} startTime - Hora de inicio
     * @param {string} endTime - Hora de fin
     * @param {string} excludeBlockId - ID del bloque a excluir (para actualizaciones)
     * @returns {Promise<boolean>} - True si está disponible
     */
    async checkTeacherAvailability(teacherId, dayOfWeek, startTime, endTime, excludeBlockId = null) {
        try {
            let query = supabaseAdmin
                .from('schedule_blocks')
                .select('id')
                .eq('teacher_id', teacherId)
                .eq('day_of_week', dayOfWeek)
                .eq('is_active', true);

            if (excludeBlockId) {
                query = query.neq('id', excludeBlockId);
            }

            // Verificar solapamiento de horarios
            query = query.or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

            const { data: conflicts, error } = await query;

            if (error) throw error;

            return conflicts.length === 0;
        } catch (error) {
            throw new Error(`Error al verificar disponibilidad del profesor: ${error.message}`);
        }
    }

    /**
     * Verifica disponibilidad de un aula
     * @param {string} classroom - Nombre del aula
     * @param {number} dayOfWeek - Día de la semana (1-7)
     * @param {string} startTime - Hora de inicio
     * @param {string} endTime - Hora de fin
     * @param {string} excludeBlockId - ID del bloque a excluir (para actualizaciones)
     * @returns {Promise<boolean>} - True si está disponible
     */
    async checkClassroomAvailability(classroom, dayOfWeek, startTime, endTime, excludeBlockId = null) {
        try {
            if (!classroom) return true; // Si no se especifica aula, está disponible

            let query = supabaseAdmin
                .from('schedule_blocks')
                .select('id')
                .eq('classroom', classroom)
                .eq('day_of_week', dayOfWeek)
                .eq('is_active', true);

            if (excludeBlockId) {
                query = query.neq('id', excludeBlockId);
            }

            // Verificar solapamiento de horarios
            query = query.or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

            const { data: conflicts, error } = await query;

            if (error) throw error;

            return conflicts.length === 0;
        } catch (error) {
            throw new Error(`Error al verificar disponibilidad del aula: ${error.message}`);
        }
    }

    /**
     * Obtiene el horario de un profesor
     * @param {string} teacherId - ID del profesor
     * @param {number} academicYear - Año académico
     * @returns {Promise<Array>} - Horario del profesor
     */
    async getTeacherSchedule(teacherId, academicYear) {
        try {
            const { data: blocks, error } = await supabaseAdmin
                .from('schedule_blocks')
                .select(`
                    *,
                    course_schedules!inner (academic_year, course_id),
                    school_subjects (name, code),
                    course_groups (name),
                    courses (year, division, schools (name))
                `)
                .eq('teacher_id', teacherId)
                .eq('course_schedules.academic_year', academicYear)
                .eq('is_active', true)
                .order('day_of_week')
                .order('start_time');

            if (error) throw error;

            return blocks;
        } catch (error) {
            throw new Error(`Error al obtener horario del profesor: ${error.message}`);
        }
    }

    /**
     * Obtiene un bloque de horario por ID
     * @param {string} blockId - ID del bloque
     * @returns {Promise<Object|null>} - Bloque de horario
     */
    async getScheduleBlock(blockId) {
        try {
            const { data: block, error } = await supabaseAdmin
                .from('schedule_blocks')
                .select('*')
                .eq('id', blockId)
                .single();

            if (error && error.code === 'PGRST116') return null;
            if (error) throw error;

            return block;
        } catch (error) {
            throw new Error(`Error al obtener bloque de horario: ${error.message}`);
        }
    }

    /**
     * Formatea horario para visualización
     * @param {Array} blocks - Bloques de horario
     * @returns {Object} - Horario formateado
     */
    formatSchedule(blocks) {
        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const schedule = {};

        days.forEach((day, index) => {
            schedule[day] = blocks
                .filter(block => block.day_of_week === index + 1)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map(block => ({
                    id: block.id,
                    time: `${block.start_time} - ${block.end_time}`,
                    subject: block.school_subjects?.name || 'Sin materia',
                    teacher: `${block.users?.first_name || ''} ${block.users?.last_name || ''}`.trim(),
                    group: block.course_groups?.name || 'Sin grupo',
                    classroom: block.classroom || 'Sin aula'
                }));
        });

        return schedule;
    }

    /**
     * Obtiene estadísticas del horario
     * @param {string} courseId - ID del curso
     * @param {number} academicYear - Año académico
     * @returns {Promise<Object>} - Estadísticas del horario
     */
    async getScheduleStatistics(courseId, academicYear) {
        try {
            const { data: blocks, error } = await supabaseAdmin
                .from('schedule_blocks')
                .select(`
                    *,
                    course_schedules!inner (course_id, academic_year)
                `)
                .eq('course_schedules.course_id', courseId)
                .eq('course_schedules.academic_year', academicYear)
                .eq('is_active', true);

            if (error) throw error;

            const stats = {
                totalBlocks: blocks.length,
                totalHours: 0,
                subjectsCount: new Set(blocks.map(b => b.subject_id)).size,
                teachersCount: new Set(blocks.map(b => b.teacher_id)).size,
                daysUsed: new Set(blocks.map(b => b.day_of_week)).size,
                classroomsUsed: new Set(blocks.filter(b => b.classroom).map(b => b.classroom)).size
            };

            // Calcular horas totales
            blocks.forEach(block => {
                const start = new Date(`2000-01-01T${block.start_time}`);
                const end = new Date(`2000-01-01T${block.end_time}`);
                const hours = (end - start) / (1000 * 60 * 60);
                stats.totalHours += hours;
            });

            return stats;
        } catch (error) {
            throw new Error(`Error al obtener estadísticas del horario: ${error.message}`);
        }
    }
}

module.exports = new ScheduleManager();
