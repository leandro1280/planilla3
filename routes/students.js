const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const Student = require('../models/Student');
const { supabaseAdmin } = require('../config/database');

// Ruta para mostrar la página de estudiantes
router.get('/', authMiddleware, requireRole(['director', 'preceptor', 'professor']), (req, res) => {
    res.render('pages/students/index', {
        title: 'Estudiantes',
        user: req.session.user,
        school: req.session.school,
        layout: 'main'
    });
});

// Ruta para mostrar el formulario de agregar estudiante manualmente
router.get('/add', authMiddleware, requireRole(['director', 'preceptor']), (req, res) => {
    res.render('pages/students/manual-add', {
        title: 'Agregar Estudiante',
        user: req.session.user,
        school: req.session.school,
        layout: 'main'
    });
});

// Ruta para mostrar el formulario de importación masiva
router.get('/bulk-import', authMiddleware, requireRole(['director', 'preceptor']), (req, res) => {
    res.render('pages/students/bulk-import', {
        title: 'Importación Masiva',
        user: req.session.user,
        school: req.session.school,
        layout: 'main'
    });
});

// API para importación masiva de estudiantes
router.post('/api/bulk-import', authMiddleware, requireRole(['director', 'preceptor']), async (req, res) => {
    try {
        const { courseId, students, skipDuplicates } = req.body;
        const schoolId = req.session.school?.id;
        
        if (!schoolId) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de escuela requerido' 
            });
        }
        
        if (!courseId || !students || !Array.isArray(students)) {
            return res.status(400).json({ 
                success: false,
                error: 'Datos de importación inválidos' 
            });
        }
        
        // Verificar que el curso pertenezca a la escuela
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('id', courseId)
            .eq('school_id', schoolId)
            .single();
            
        if (courseError || !course) {
            return res.status(404).json({ 
                success: false,
                error: 'Curso no encontrado' 
            });
        }
        
        // Filtrar estudiantes válidos
        const validStudents = students.filter(s => s.isValid);
        
        if (validStudents.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No hay estudiantes válidos para importar' 
            });
        }
        
        // Verificar duplicados si se requiere
        let studentsToInsert = validStudents;
        if (skipDuplicates) {
            const { data: existingStudents, error: existingError } = await supabaseAdmin
                .from('students')
                .select('first_name, last_name')
                .eq('school_id', schoolId);
                
            if (existingError) throw existingError;
            
            studentsToInsert = validStudents.filter(student => {
                return !existingStudents.some(existing => 
                    existing.first_name.toLowerCase() === student.firstName.toLowerCase() &&
                    existing.last_name.toLowerCase() === student.lastName.toLowerCase()
                );
            });
        }
        
        // Preparar datos para inserción
        const studentsData = studentsToInsert.map(student => ({
            school_id: schoolId,
            course_id: courseId,
            dni: student.dni || null,
            first_name: student.firstName,
            last_name: student.lastName,
            full_name: student.fullName,
            is_active: true,
            created_at: new Date().toISOString()
        }));
        
        // Insertar estudiantes en lotes
        const batchSize = 50;
        let insertedCount = 0;
        
        for (let i = 0; i < studentsData.length; i += batchSize) {
            const batch = studentsData.slice(i, i + batchSize);
            
            const { data, error } = await supabaseAdmin
                .from('students')
                .insert(batch)
                .select();
                
            if (error) {
                console.error(`Error insertando lote ${Math.floor(i/batchSize) + 1}:`, error);
                throw error;
            }
            
            insertedCount += data.length;
        }
        
        res.json({
            success: true,
            imported: insertedCount,
            skipped: validStudents.length - insertedCount,
            total: students.length
        });
        
    } catch (error) {
        console.error('❌ Error en importación masiva:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// API para obtener estudiantes
router.get('/api', authMiddleware, requireRole(['director', 'preceptor', 'professor']), async (req, res) => {
    try {
        const { schoolId } = req.query;
        const schoolIdFromSession = req.session.school?.id;
        
        console.log('🔍 Debug session info:');
        console.log('  - User ID:', req.session.user?.id);
        console.log('  - School ID from query:', schoolId);
        console.log('  - School ID from session:', schoolIdFromSession);
        console.log('  - School object:', req.session.school);
        
        const finalSchoolId = schoolId || schoolIdFromSession;
        if (!finalSchoolId) {
            return res.status(400).json({ 
                success: false,
                error: 'Debes seleccionar una escuela antes de ver los estudiantes.',
                action: 'select_school',
                redirectTo: '/schools/select',
                debug: {
                    userId: req.session.user?.id,
                    schoolIdFromQuery: schoolId,
                    schoolIdFromSession: schoolIdFromSession,
                    hasSchoolInSession: !!req.session.school
                }
            });
        }

        console.log('🔍 Obteniendo estudiantes para escuela:', finalSchoolId);

        // Obtener estudiantes de la escuela
        const students = await Student.findBySchoolId(finalSchoolId);
        
        console.log(`✅ Encontrados ${students.length} estudiantes`);

        res.json({
            success: true,
            students: students,
            total: students.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo estudiantes:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// API para obtener un estudiante específico
router.get('/api/:id', authMiddleware, requireRole(['director', 'preceptor', 'professor']), async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findById(id);
        
        if (!student) {
            return res.status(404).json({ 
                success: false,
                error: 'Estudiante no encontrado' 
            });
        }

        res.json({
            success: true,
            student: student
        });
    } catch (error) {
        console.error('❌ Error obteniendo estudiante:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// API para crear un estudiante
router.post('/api', authMiddleware, requireRole(['director', 'preceptor']), async (req, res) => {
    try {
        const { schoolId, courseId, ...studentData } = req.body;
        const schoolIdFromSession = req.session.school?.id;
        
        const finalSchoolId = schoolId || schoolIdFromSession;
        if (!finalSchoolId) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de escuela requerido' 
            });
        }

        console.log('🔍 Creando estudiante:', studentData);

        const student = await Student.create({
            ...studentData,
            school_id: finalSchoolId,
            course_id: courseId
        });

        console.log('✅ Estudiante creado:', student.id);

        res.json({
            success: true,
            student: student
        });
    } catch (error) {
        console.error('❌ Error creando estudiante:', error);
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// API para actualizar un estudiante
router.put('/api/:id', authMiddleware, requireRole(['director', 'preceptor']), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        console.log('🔍 Actualizando estudiante:', id, updateData);

        const student = await Student.update(id, updateData);

        console.log('✅ Estudiante actualizado');

        res.json({
            success: true,
            student: student
        });
    } catch (error) {
        console.error('❌ Error actualizando estudiante:', error);
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// API para eliminar un estudiante
router.delete('/api/:id', authMiddleware, requireRole(['director']), async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🔍 Eliminando estudiante:', id);

        await Student.delete(id);

        console.log('✅ Estudiante eliminado');

        res.json({
            success: true,
            message: 'Estudiante eliminado correctamente'
        });
    } catch (error) {
        console.error('❌ Error eliminando estudiante:', error);
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// API para importación masiva automática (sin selector de curso)
router.post('/api/bulk-import-auto', authMiddleware, requireRole(['director', 'preceptor']), async (req, res) => {
    try {
        const { students, skipDuplicates, autoDetectCourses, separateByGroups } = req.body;
        const schoolId = req.session.school?.id;
        
        if (!schoolId) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de escuela requerido' 
            });
        }
        
        if (!students || !Array.isArray(students)) {
            return res.status(400).json({ 
                success: false,
                error: 'Datos de importación inválidos' 
            });
        }
        
        // Filtrar estudiantes válidos
        const validStudents = students.filter(s => s.isValid);
        
        if (validStudents.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No hay estudiantes válidos para importar' 
            });
        }
        
        // Agrupar estudiantes por curso detectado
        const studentsByCourse = {};
        validStudents.forEach(student => {
            if (student.detectedCourse) {
                const courseKey = `${student.detectedCourse.year}|${student.detectedCourse.division}|${student.detectedCourse.shift}`;
                if (!studentsByCourse[courseKey]) {
                    studentsByCourse[courseKey] = [];
                }
                studentsByCourse[courseKey].push(student);
            }
        });
        
        let totalImported = 0;
        const results = [];
        
        // Procesar cada curso
        for (const [courseKey, courseStudents] of Object.entries(studentsByCourse)) {
            const [year, division, shift] = courseKey.split('|');
            
            // Buscar el curso en la base de datos
            const { data: course, error: courseError } = await supabaseAdmin
                .from('courses')
                .select('id')
                .eq('school_id', schoolId)
                .eq('year', year)
                .eq('division', division)
                .eq('shift', shift)
                .single();
                
            if (courseError || !course) {
                console.warn(`Curso no encontrado: ${year} ${division} ${shift}`);
                continue;
            }
            
            // Preparar datos para inserción
            const studentsData = courseStudents.map(student => ({
                school_id: schoolId,
                course_id: course.id,
                dni: student.dni || null,
                first_name: student.firstName,
                last_name: student.lastName,
                full_name: student.fullName,
                is_active: true,
                created_at: new Date().toISOString()
            }));
            
            // Insertar estudiantes en lotes
            const batchSize = 50;
            let insertedCount = 0;
            
            for (let i = 0; i < studentsData.length; i += batchSize) {
                const batch = studentsData.slice(i, i + batchSize);
                
                const { data, error } = await supabaseAdmin
                    .from('students')
                    .insert(batch)
                    .select();
                    
                if (error) {
                    console.error(`Error insertando lote ${Math.floor(i/batchSize) + 1}:`, error);
                    continue;
                }
                
                insertedCount += data.length;
            }
            
            totalImported += insertedCount;
            results.push({
                course: `${year} ${division} ${shift}`,
                imported: insertedCount
            });
        }
        
        res.json({
            success: true,
            imported: totalImported,
            total: students.length,
            results: results
        });
        
    } catch (error) {
        console.error('❌ Error en importación masiva automática:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;
