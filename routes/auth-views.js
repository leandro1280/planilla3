// ========================================
// RUTAS DE VISTAS DE AUTENTICACIÓN
// ========================================

const express = require('express');
const router = express.Router();

// ========================================
// RUTAS DE VISTAS
// ========================================

/**
 * @route GET /auth/login
 * @desc Mostrar página de login
 * @access Public
 */
router.get('/login', (req, res) => {
    // Si ya está logueado, redirigir al dashboard
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    
    res.render('pages/auth/login', {
        title: 'Iniciar Sesión',
        layout: 'main'
    });
});

/**
 * @route GET /auth/register
 * @desc Mostrar página de registro
 * @access Public
 */
router.get('/register', (req, res) => {
    // Si ya está logueado, redirigir al dashboard
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    
    res.render('pages/auth/register', {
        title: 'Registrarse',
        layout: 'main'
    });
});

/**
 * @route GET /auth/initial-config
 * @desc Mostrar página de configuración inicial
 * @access Private (solo para directores)
 */
router.get('/initial-config', (req, res) => {
    // Si no está logueado, redirigir al login
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    
    // Si no es director, redirigir al dashboard
    if (req.session.user.role !== 'director') {
        return res.redirect('/dashboard');
    }
    
    res.render('pages/auth/initial-config', {
        title: 'Configuración Inicial',
        layout: 'main'
    });
});

/**
 * @route GET /auth/logout
 * @desc Cerrar sesión y redirigir
 * @access Private
 */
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.redirect('/');
    });
});

module.exports = router;
