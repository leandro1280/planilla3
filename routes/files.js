const express = require('express');
const router = express.Router();
const multer = require('multer');
const FileController = require('../controllers/file-controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Configuración de multer para almacenamiento en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB (límite de Cloudinary)
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls', '.csv', '.txt', '.pdf'];
        const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
        
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no soportado'), false);
        }
    }
});

/**
 * @route GET /files/upload
 * @desc Mostrar página de carga de archivos
 * @access Private
 */
router.get('/upload', authMiddleware, requireRole(['director', 'preceptor']), (req, res) => {
    res.render('pages/files/upload', {
        title: 'Cargar Archivos',
        school: req.session.school,
        user: req.session.user
    });
});

/**
 * @route POST /files/upload
 * @desc Procesar archivo subido
 * @access Private
 */
router.post('/upload', authMiddleware, requireRole(['director', 'preceptor']), upload.single('file'), FileController.processFile);

/**
 * @route POST /files/validate
 * @desc Validar archivo sin procesarlo
 * @access Private
 */
router.post('/validate', authMiddleware, requireRole(['director', 'preceptor']), upload.single('file'), FileController.validateFile);

/**
 * @route GET /files/download/:fileId
 * @desc Descargar archivo procesado
 * @access Private
 */
router.get('/download/:fileId', authMiddleware, FileController.downloadFile);

module.exports = router;