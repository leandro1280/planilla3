// ========================================
// CONFIGURACIÓN DE CLOUDINARY
// ========================================

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
} = process.env;

// Verificar si Cloudinary está habilitado
const cloudEnabled = !!CLOUDINARY_CLOUD_NAME && !!CLOUDINARY_API_KEY && !!CLOUDINARY_API_SECRET;

if (cloudEnabled) {
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true,
    });
    console.log("☁️  Cloudinary habilitado:", CLOUDINARY_CLOUD_NAME);
} else {
    console.warn("⚠️  Cloudinary deshabilitado: faltan credenciales .env");
}

// ========================================
// FUNCIONES DE UPLOAD
// ========================================

/**
 * Subir buffer a Cloudinary
 */
const uploadBufferToCloudinary = (buffer, folder, publicId = null) => {
    return new Promise((resolve, reject) => {
        if (!cloudEnabled) {
            return reject(new Error('Cloudinary no está configurado'));
        }

        const uploadOptions = {
            folder: `planilla3/${folder}`,
            resource_type: 'auto', // Detecta automáticamente el tipo
            overwrite: true,
        };

        if (publicId) {
            uploadOptions.public_id = publicId;
        }

        cloudinary.uploader.upload_stream(
            uploadOptions,
            (err, result) => {
                if (err || !result) {
                    return reject(err || new Error('Upload failed'));
                }
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                    format: result.format,
                    bytes: result.bytes
                });
            }
        ).end(buffer);
    });
};

/**
 * Subir archivo desde path
 */
const uploadFileToCloudinary = (filePath, folder, publicId = null) => {
    return new Promise((resolve, reject) => {
        if (!cloudEnabled) {
            return reject(new Error('Cloudinary no está configurado'));
        }

        const uploadOptions = {
            folder: `planilla3/${folder}`,
            resource_type: 'auto',
            overwrite: true,
        };

        if (publicId) {
            uploadOptions.public_id = publicId;
        }

        cloudinary.uploader.upload(filePath, uploadOptions, (err, result) => {
            if (err || !result) {
                return reject(err || new Error('Upload failed'));
            }
            resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                bytes: result.bytes
            });
        });
    });
};

/**
 * Eliminar archivo de Cloudinary
 */
const deleteFromCloudinary = (publicId) => {
    return new Promise((resolve, reject) => {
        if (!cloudEnabled) {
            return reject(new Error('Cloudinary no está configurado'));
        }

        cloudinary.uploader.destroy(publicId, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
};

/**
 * Obtener URL de transformación
 */
const getTransformedUrl = (publicId, transformations = {}) => {
    if (!cloudEnabled) {
        return null;
    }

    return cloudinary.url(publicId, {
        ...transformations,
        secure: true
    });
};

module.exports = {
    cloudinary,
    cloudEnabled,
    uploadBufferToCloudinary,
    uploadFileToCloudinary,
    deleteFromCloudinary,
    getTransformedUrl
};
