const express = require('express');
const School = require('../models/School');
const Student = require('../models/Student');
const { supabase } = require('../config/database');

const router = express.Router();

// GET /dashboard - Dashboard principal
router.get('/', async (req, res) => {
  try {
    const schoolId = req.session.school?.id;
    
    if (!schoolId) {
      return res.render('dashboard/no-school', {
        title: 'Dashboard',
        message: 'No tienes una escuela asignada. Contacta al administrador.'
      });
    }

    // Obtener estadísticas de la escuela
    const school = await School.findById(schoolId);
    const stats = await school.getStats();

    // Obtener cursos del año actual
    const currentYear = new Date().getFullYear();
    const courses = await school.getCourses(currentYear);

    // Obtener estadísticas de calificaciones por curso
    const courseStats = await Promise.all(
      courses.map(async (course) => {
        const students = await Student.findByCourse(course.id);
        const { data: grades } = await supabase
          .from('grades')
          .select('*')
          .eq('course_id', course.id)
          .eq('academic_year', currentYear);

        const teaCount = grades?.filter(g => g.tea_grade).length || 0;
        const tepCount = grades?.filter(g => g.tep_grade).length || 0;
        const tedCount = grades?.filter(g => g.ted_grade).length || 0;
        const totalGrades = grades?.length || 0;

        return {
          ...course,
          student_count: students.length,
          total_grades: totalGrades,
          tea_percentage: totalGrades > 0 ? ((teaCount / totalGrades) * 100).toFixed(1) : 0,
          tep_percentage: totalGrades > 0 ? ((tepCount / totalGrades) * 100).toFixed(1) : 0,
          ted_percentage: totalGrades > 0 ? ((tedCount / totalGrades) * 100).toFixed(1) : 0
        };
      })
    );

    // Obtener estadísticas generales de calificaciones
    const { data: allGrades } = await supabase
      .from('grades')
      .select('*')
      .eq('academic_year', currentYear)
      .in('student_id', 
        (await supabase
          .from('students')
          .select('id')
          .eq('school_id', schoolId)
        ).data?.map(s => s.id) || []
      );

    const generalStats = {
      total_grades: allGrades?.length || 0,
      tea_count: allGrades?.filter(g => g.tea_grade).length || 0,
      tep_count: allGrades?.filter(g => g.tep_grade).length || 0,
      ted_count: allGrades?.filter(g => g.ted_grade).length || 0
    };

    generalStats.tea_percentage = generalStats.total_grades > 0 
      ? ((generalStats.tea_count / generalStats.total_grades) * 100).toFixed(1) 
      : 0;
    generalStats.tep_percentage = generalStats.total_grades > 0 
      ? ((generalStats.tep_count / generalStats.total_grades) * 100).toFixed(1) 
      : 0;
    generalStats.ted_percentage = generalStats.total_grades > 0 
      ? ((generalStats.ted_count / generalStats.total_grades) * 100).toFixed(1) 
      : 0;

    res.render('dashboard/index', {
      title: 'Dashboard',
      school,
      stats,
      courses: courseStats,
      generalStats,
      currentYear
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error al cargar el dashboard',
      error: { status: 500, message: error.message }
    });
  }
});

// GET /dashboard/stats - Estadísticas detalladas (AJAX)
router.get('/stats', async (req, res) => {
  try {
    const schoolId = req.session.school?.id;
    const { year = new Date().getFullYear(), semester } = req.query;

    if (!schoolId) {
      return res.status(400).json({ error: 'No hay escuela seleccionada' });
    }

    // Obtener estadísticas por materia
    const { data: subjects } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('code');

    const subjectStats = await Promise.all(
      subjects.map(async (subject) => {
        let query = supabase
          .from('grades')
          .select('*')
          .eq('subject_id', subject.id)
          .eq('academic_year', year);

        if (semester) {
          query = query.eq('semester', semester);
        }

        const { data: grades } = await query;

        const teaCount = grades?.filter(g => g.tea_grade).length || 0;
        const tepCount = grades?.filter(g => g.tep_grade).length || 0;
        const tedCount = grades?.filter(g => g.ted_grade).length || 0;
        const totalGrades = grades?.length || 0;

        return {
          subject,
          total_grades: totalGrades,
          tea_count: teaCount,
          tep_count: tepCount,
          ted_count: tedCount,
          tea_percentage: totalGrades > 0 ? ((teaCount / totalGrades) * 100).toFixed(1) : 0,
          tep_percentage: totalGrades > 0 ? ((tepCount / totalGrades) * 100).toFixed(1) : 0,
          ted_percentage: totalGrades > 0 ? ((tedCount / totalGrades) * 100).toFixed(1) : 0
        };
      })
    );

    res.json({
      subjectStats: subjectStats.filter(s => s.total_grades > 0),
      year: parseInt(year),
      semester: semester ? parseInt(semester) : null
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;