const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/database');

// Ruta para mostrar la página de gestión de cursos
router.get('/manage', authMiddleware, requireRole(['director', 'preceptor']), (req, res) => {
    res.render('pages/courses/flexible-manage', {
        title: 'Gestionar Cursos',
        user: req.session.user,
        school: req.session.school,
        layout: 'main'
    });
});

// API para obtener cursos de la escuela
router.get('/api', authMiddleware, requireRole(['director', 'preceptor', 'professor']), async (req, res) => {
    try {
        const schoolId = req.session.school?.id;
        
        if (!schoolId) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de escuela requerido' 
            });
        }

        const { data: courses, error } = await supabaseAdmin
            .from('courses')
            .select(`
                *,
                students(count)
            `)
            .eq('school_id', schoolId)
            .order('year', { ascending: true })
            .order('division', { ascending: true });

        if (error) {
            throw error;
        }

        // Formatear datos para incluir conteo de estudiantes
        const formattedCourses = courses.map(course => ({
            ...course,
            student_count: course.students?.[0]?.count || 0
        }));

        res.json({
            success: true,
            courses: formattedCourses
        });

    } catch (error) {
        console.error('❌ Error obteniendo cursos:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// API para crear un nuevo curso
router.post('/api', authMiddleware, requireRole(['director', 'preceptor']), async (req, res) => {
    try {
        const schoolId = req.session.school?.id;
        const courseData = req.body;
        
        if (!schoolId) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de escuela requerido' 
            });
        }

        // Validar datos requeridos
        if (!courseData.year || !courseData.division || !courseData.shift || !courseData.academic_year) {
            return res.status(400).json({ 
                success: false,
                error: 'Faltan datos requeridos: año, división, turno y año académico' 
            });
        }

        // Verificar que no exista un curso duplicado
        const { data: existingCourse, error: checkError } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('school_id', schoolId)
            .eq('year', courseData.year.toString())
            .eq('division', courseData.division)
            .eq('shift', courseData.shift)
            .eq('academic_year', courseData.academic_year)
            .single();

        if (existingCourse) {
            return res.status(400).json({ 
                success: false,
                error: 'Ya existe un curso con estas características' 
            });
        }

        // Crear el curso
        const { data: course, error } = await supabaseAdmin
            .from('courses')
            .insert({
                school_id: schoolId,
                year: courseData.year.toString(),
                division: courseData.division,
                shift: courseData.shift,
                group_name: courseData.group || null,
                cycle: courseData.cycle || 'basico',
                academic_year: courseData.academic_year || new Date().getFullYear(),
                max_students: courseData.maxStudents || courseData.max_students || 30,
                specialization: courseData.specialization || null,
                capacity: courseData.capacity || null,
                description: courseData.description || null,
                is_active: courseData.isActive !== undefined ? courseData.isActive : true,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            success: true,
            course: course
        });

    } catch (error) {
        console.error('❌ Error creando curso:', error);
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// API para actualizar un curso
router.put('/api/:id', authMiddleware, requireRole(['director', 'preceptor']), async (req, res) => {
    try {
        const courseId = req.params.id;
        const schoolId = req.session.school?.id;
        const courseData = req.body;
        
        if (!schoolId) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de escuela requerido' 
            });
        }

        // Verificar que el curso pertenezca a la escuela
        const { data: existingCourse, error: checkError } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('id', courseId)
            .eq('school_id', schoolId)
            .single();

        if (checkError || !existingCourse) {
            return res.status(404).json({ 
                success: false,
                error: 'Curso no encontrado' 
            });
        }

        // Actualizar el curso
        const { data: course, error } = await supabaseAdmin
            .from('courses')
            .update({
                year: courseData.year,
                division: courseData.division?.toUpperCase(),
                group_name: courseData.group || null,
                shift: courseData.shift,
                academic_year: courseData.academic_year,
                max_students: courseData.maxStudents || courseData.max_students,
                is_active: courseData.isActive !== undefined ? courseData.isActive : true,
                specialization: courseData.specialization || null,
                capacity: courseData.capacity || null,
                description: courseData.description || null,
                is_active: courseData.is_active !== undefined ? courseData.is_active : true,
                updated_at: new Date().toISOString()
            })
            .eq('id', courseId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            course: course
        });

    } catch (error) {
        console.error('❌ Error actualizando curso:', error);
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// API para eliminar un curso
router.delete('/api/:id', authMiddleware, requireRole(['director']), async (req, res) => {
    try {
        const courseId = req.params.id;
        const schoolId = req.session.school?.id;
        
        if (!schoolId) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de escuela requerido' 
            });
        }

        // Verificar que el curso pertenezca a la escuela
        const { data: existingCourse, error: checkError } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('id', courseId)
            .eq('school_id', schoolId)
            .single();

        if (checkError || !existingCourse) {
            return res.status(404).json({ 
                success: false,
                error: 'Curso no encontrado' 
            });
        }

        // Verificar si el curso tiene estudiantes
        const { data: students, error: studentsError } = await supabaseAdmin
            .from('students')
            .select('id')
            .eq('course_id', courseId)
            .limit(1);

        if (studentsError) {
            throw studentsError;
        }

        if (students && students.length > 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No se puede eliminar un curso que tiene estudiantes asignados' 
            });
        }

        // Eliminar el curso
        const { error } = await supabaseAdmin
            .from('courses')
            .delete()
            .eq('id', courseId);

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            message: 'Curso eliminado correctamente'
        });

    } catch (error) {
        console.error('❌ Error eliminando curso:', error);
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// API para crear curso automáticamente
router.post('/api/auto-create', authMiddleware, requireRole(['director', 'preceptor']), async (req, res) => {
    try {
        const schoolId = req.session.school?.id;
        const { year, division, shift, academic_year } = req.body;
        
        if (!schoolId) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de escuela requerido' 
            });
        }
        
        // Verificar si el curso ya existe
        const { data: existingCourse, error: checkError } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('school_id', schoolId)
            .eq('year', year.toString())
            .eq('division', division)
            .eq('shift', shift)
            .eq('academic_year', academic_year)
            .single();
            
        if (existingCourse) {
            return res.json({
                success: true,
                course: existingCourse,
                message: 'Curso ya existe'
            });
        }
        
        // Crear el curso
        const { data: course, error } = await supabaseAdmin
            .from('courses')
            .insert({
                school_id: schoolId,
                year: year.toString(),
                division: division,
                shift: shift,
                cycle: 'basico',
                academic_year: academic_year,
                max_students: 30,
                is_active: true,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) throw error;
        
        res.json({
            success: true,
            course: course
        });
        
    } catch (error) {
        console.error('❌ Error creando curso automáticamente:', error);
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;
