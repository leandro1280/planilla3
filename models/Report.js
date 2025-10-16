// ========================================
// MODELO DE REPORTES
// ========================================

const { supabase } = require('../config/database');

class Report {
    constructor(data) {
        this.id = data.id;
        this.school_id = data.school_id;
        this.report_type = data.report_type;
        this.title = data.title;
        this.description = data.description;
        this.parameters = data.parameters;
        this.file_path = data.file_path;
        this.file_format = data.file_format;
        this.file_size = data.file_size;
        this.status = data.status;
        this.created_by = data.created_by;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ========================================
    // MÉTODOS ESTÁTICOS
    // ========================================

    /**
     * Crear nuevo reporte
     */
    static async create(reportData) {
        try {
            const { data, error } = await supabase
                .from('reports')
                .insert([reportData])
                .select()
                .single();

            if (error) throw error;
            return new Report(data);
        } catch (error) {
            throw new Error(`Error creando reporte: ${error.message}`);
        }
    }

    /**
     * Obtener reporte por ID
     */
    static async findById(reportId) {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('id', reportId)
                .single();

            if (error) throw error;
            return data ? new Report(data) : null;
        } catch (error) {
            throw new Error(`Error obteniendo reporte: ${error.message}`);
        }
    }

    /**
     * Obtener reportes por escuela
     */
    static async findBySchool(schoolId, reportType = null) {
        try {
            let query = supabase
                .from('reports')
                .select('*')
                .eq('school_id', schoolId);

            if (reportType) {
                query = query.eq('report_type', reportType);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data.map(report => new Report(report));
        } catch (error) {
            throw new Error(`Error obteniendo reportes: ${error.message}`);
        }
    }

    /**
     * Obtener historial de reportes
     */
    static async getHistory(schoolId, limit = 50) {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select(`
                    *,
                    users (first_name, last_name)
                `)
                .eq('school_id', schoolId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data.map(report => new Report(report));
        } catch (error) {
            throw new Error(`Error obteniendo historial: ${error.message}`);
        }
    }

    /**
     * Actualizar reporte
     */
    static async update(reportId, updateData) {
        try {
            const { data, error } = await supabase
                .from('reports')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reportId)
                .select()
                .single();

            if (error) throw error;
            return new Report(data);
        } catch (error) {
            throw new Error(`Error actualizando reporte: ${error.message}`);
        }
    }

    /**
     * Eliminar reporte
     */
    static async delete(reportId) {
        try {
            const { error } = await supabase
                .from('reports')
                .delete()
                .eq('id', reportId);

            if (error) throw error;
            return true;
        } catch (error) {
            throw new Error(`Error eliminando reporte: ${error.message}`);
        }
    }

    // ========================================
    // MÉTODOS DE INSTANCIA
    // ========================================

    /**
     * Verificar si el reporte está listo
     */
    isReady() {
        return this.status === 'completed' && this.file_path;
    }

    /**
     * Obtener URL de descarga
     */
    getDownloadUrl() {
        if (!this.isReady()) return null;
        return `/api/reports/${this.id}/download`;
    }

    /**
     * Obtener información del archivo
     */
    getFileInfo() {
        return {
            path: this.file_path,
            format: this.file_format,
            size: this.file_size,
            downloadUrl: this.getDownloadUrl()
        };
    }
}

module.exports = Report;
