const express = require('express');
const router = express.Router();

// GET /dashboard - Página principal del dashboard
router.get('/', async (req, res) => {
  try {
    res.render('pages/dashboard/index', {
      title: 'Dashboard',
      user: req.session.user,
      school: req.session.school
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar el dashboard'
    });
  }
});

// GET /dashboard/stats - Estadísticas generales
router.get('/stats', async (req, res) => {
  try {
    // Por ahora, datos de ejemplo
    const stats = {
      totalStudents: 0,
      totalCourses: 0,
      totalGrades: 0,
      averageTEA: 0,
      averageTEP: 0,
      averageTED: 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;