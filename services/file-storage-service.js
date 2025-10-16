// ========================================
// SERVICIO DE ALMACENAMIENTO DE ARCHIVOS
// ========================================

const { uploadBufferToCloudinary, deleteFromCloudinary, getTransformedUrl } = require('../config/cloudinary');
const path = require('path');
const fs = require('fs').promises;

class FileStorageService {
    /**
     * Subir archivo de estudiantes
     */
    static async uploadStudentFile(file, schoolId, courseId) {
        try {
            const folder = `schools/${schoolId}/courses/${courseId}/students`;
            const publicId = `students_${schoolId}_${courseId}_${Date.now()}`;
            
            const result = await uploadBufferToCloudinary(file.buffer, folder, publicId);
            
            return {
                success: true,
                file: {
                    originalName: file.originalname,
                    cloudUrl: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    size: result.bytes,
                    uploadedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            throw new Error(`Error subiendo archivo de estudiantes: ${error.message}`);
        }
    }

    /**
     * Subir archivo de calificaciones
     */
    static async uploadGradesFile(file, schoolId, courseId, period) {
        try {
            const folder = `schools/${schoolId}/courses/${courseId}/grades/${period}`;
            const publicId = `grades_${schoolId}_${courseId}_${period}_${Date.now()}`;
            
            const result = await uploadBufferToCloudinary(file.buffer, folder, publicId);
            
            return {
                success: true,
                file: {
                    originalName: file.originalname,
                    cloudUrl: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    size: result.bytes,
                    period: period,
                    uploadedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            throw new Error(`Error subiendo archivo de calificaciones: ${error.message}`);
        }
    }

    /**
     * Subir reporte generado
     */
    static async uploadReport(reportBuffer, reportType, schoolId, metadata = {}) {
        try {
            const folder = `schools/${schoolId}/reports/${reportType}`;
            const publicId = `${reportType}_${schoolId}_${Date.now()}`;
            
            const result = await uploadBufferToCloudinary(reportBuffer, folder, publicId);
            
            return {
                success: true,
                report: {
                    type: reportType,
                    cloudUrl: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    size: result.bytes,
                    metadata: metadata,
                    generatedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            throw new Error(`Error subiendo reporte: ${error.message}`);
        }
    }

    /**
     * Subir imagen de perfil
     */
    static async uploadProfileImage(file, userId) {
        try {
            const folder = `users/${userId}/profile`;
            const publicId = `profile_${userId}`;
            
            const result = await uploadBufferToCloudinary(file.buffer, folder, publicId);
            
            return {
                success: true,
                image: {
                    cloudUrl: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    size: result.bytes,
                    uploadedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            throw new Error(`Error subiendo imagen de perfil: ${error.message}`);
        }
    }

    /**
     * Eliminar archivo
     */
    static async deleteFile(publicId) {
        try {
            const result = await deleteFromCloudinary(publicId);
            
            return {
                success: true,
                result: result
            };
        } catch (error) {
            throw new Error(`Error eliminando archivo: ${error.message}`);
        }
    }

    /**
     * Obtener URL de descarga
     */
    static getDownloadUrl(publicId, format = 'original') {
        try {
            let transformations = {};
            
            if (format === 'thumbnail') {
                transformations = {
                    width: 200,
                    height: 200,
                    crop: 'fill',
                    quality: 'auto'
                };
            } else if (format === 'medium') {
                transformations = {
                    width: 800,
                    height: 600,
                    crop: 'limit',
                    quality: 'auto'
                };
            }
            
            return getTransformedUrl(publicId, transformations);
        } catch (error) {
            throw new Error(`Error generando URL: ${error.message}`);
        }
    }

    /**
     * Obtener información del archivo
     */
    static async getFileInfo(publicId) {
        try {
            const { cloudinary } = require('../config/cloudinary');
            
            const result = await cloudinary.api.resource(publicId);
            
            return {
                success: true,
                info: {
                    publicId: result.public_id,
                    format: result.format,
                    size: result.bytes,
                    width: result.width,
                    height: result.height,
                    createdAt: result.created_at,
                    secureUrl: result.secure_url
                }
            };
        } catch (error) {
            throw new Error(`Error obteniendo información del archivo: ${error.message}`);
        }
    }

    /**
     * Limpiar archivos antiguos
     */
    static async cleanupOldFiles(folder, daysOld = 30) {
        try {
            const { cloudinary } = require('../config/cloudinary');
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: `planilla3/${folder}`,
                max_results: 500
            });
            
            const oldFiles = result.resources.filter(resource => {
                const createdDate = new Date(resource.created_at);
                return createdDate < cutoffDate;
            });
            
            const deletePromises = oldFiles.map(file => 
                deleteFromCloudinary(file.public_id)
            );
            
            const results = await Promise.allSettled(deletePromises);
            
            return {
                success: true,
                deleted: results.filter(r => r.status === 'fulfilled').length,
                failed: results.filter(r => r.status === 'rejected').length
            };
        } catch (error) {
            throw new Error(`Error limpiando archivos antiguos: ${error.message}`);
        }
    }
}

module.exports = FileStorageService;

