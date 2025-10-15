// Sistema de Gestión de Notas Escolares - JavaScript principal
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema de Gestión de Notas cargado');
    
    // Inicializar tooltips de Bootstrap si están disponibles
    if (typeof bootstrap !== 'undefined') {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Funciones de utilidad
    window.utils = {
        // Mostrar mensaje de éxito
        showSuccess: function(message) {
            this.showAlert(message, 'success');
        },
        
        // Mostrar mensaje de error
        showError: function(message) {
            this.showAlert(message, 'danger');
        },
        
        // Mostrar mensaje de información
        showInfo: function(message) {
            this.showAlert(message, 'info');
        },
        
        // Mostrar alerta genérica
        showAlert: function(message, type = 'info') {
            const alertContainer = document.getElementById('alert-container') || this.createAlertContainer();
            
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
            alertDiv.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            alertContainer.appendChild(alertDiv);
            
            // Auto-remover después de 5 segundos
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        },
        
        // Crear contenedor de alertas si no existe
        createAlertContainer: function() {
            const container = document.createElement('div');
            container.id = 'alert-container';
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            container.style.maxWidth = '400px';
            document.body.appendChild(container);
            return container;
        },
        
        // Formatear fecha
        formatDate: function(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-AR');
        },
        
        // Formatear número
        formatNumber: function(number, decimals = 2) {
            return parseFloat(number).toFixed(decimals);
        }
    };
    
    // Manejar formularios con validación
    const forms = document.querySelectorAll('.needs-validation');
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
    
    // Confirmación para acciones destructivas
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-confirm]')) {
            const message = e.target.getAttribute('data-confirm');
            if (!confirm(message)) {
                e.preventDefault();
            }
        }
    });
    
    // Inicializar funcionalidad específica de login si estamos en la página de login
    if (document.getElementById('loginForm')) {
        initLoginForm();
    }
    
    console.log('✅ Sistema inicializado correctamente');
});

// Función específica para el formulario de login
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        });
    }

    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Show loading state
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Iniciando sesión...';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(this);
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.get('email'),
                        password: formData.get('password'),
                        rememberMe: formData.get('rememberMe') === 'on'
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Success - redirect to dashboard
                    window.location.href = '/dashboard';
                } else {
                    // Show error
                    showAlert(data.error || 'Error al iniciar sesión', 'danger');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Error de conexión. Intenta de nuevo.', 'danger');
            } finally {
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Función para mostrar alertas
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        <i class="bi bi-exclamation-triangle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}
