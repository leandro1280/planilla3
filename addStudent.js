// addStudent.js

document.addEventListener('DOMContentLoaded', () => {
    const formAgregarAlumno = document.getElementById('formAgregarAlumno');
    const cursoAlumnoSelect = document.getElementById('cursoAlumno');

    // Llenar el select de cursos en el modal con los cursos disponibles
    llenarSelectCursos(cursoAlumnoSelect);

    // Manejar el envío del formulario para añadir alumno
    if (formAgregarAlumno) {
        formAgregarAlumno.addEventListener('submit', (e) => {
            e.preventDefault();
            const nombre = document.getElementById('nombreAlumno').value.trim();
            const cursoSeleccionado = document.getElementById('cursoAlumno').value.trim().toLowerCase();

            if (nombre === '' || cursoSeleccionado === '') {
                alert('Por favor, completa todos los campos.');
                return;
            }

            if (cursoSeleccionado === 'nuevo') {
                const inputNuevoCurso = document.getElementById('inputNuevoCurso');
                const nuevoCurso = inputNuevoCurso.value.trim().toLowerCase();
                if (nuevoCurso === '') {
                    alert('Por favor, ingresa el nombre del nuevo curso.');
                    return;
                }
                agregarNuevoCurso(nuevoCurso, nombre);
            } else {
                agregarAlumno(nombre, cursoSeleccionado);
            }

            // Cerrar el modal
            const agregarAlumnoModal = bootstrap.Modal.getInstance(document.getElementById('agregarAlumnoModal'));
            agregarAlumnoModal.hide();

            // Limpiar el formulario
            formAgregarAlumno.reset();

            // Remover el input de nuevo curso si existe
            const inputNuevoCurso = document.getElementById('inputNuevoCurso');
            if (inputNuevoCurso) {
                inputNuevoCurso.remove();
            }
        });
    }
});

// Función para llenar el select de cursos en el modal
function llenarSelectCursos(selectElement) {
    if (!selectElement) return;

    // Acceder a gradesData
    if (typeof window.gradesData === 'undefined') {
        window.gradesData = JSON.parse(localStorage.getItem('gradesData')) || {};
    }

    let cursos = Object.keys(window.gradesData);

    // Si gradesData está vacío, usar los cursos de materiasPorCurso
    if (cursos.length === 0) {
        cursos = Object.keys(window.materiasPorCurso);
    }

    cursos.sort();

    let opciones = '<option value="">Selecciona un curso</option>';
    cursos.forEach(curso => {
        opciones += `<option value="${curso}">${curso.toUpperCase()}</option>`;
    });

    // Opción para añadir a un nuevo curso
    opciones += `<option value="nuevo">Nuevo Curso</option>`;

    selectElement.innerHTML = opciones;

    // Manejar la selección de "Nuevo Curso"
    selectElement.addEventListener('change', () => {
        if (selectElement.value === 'nuevo') {
            // Mostrar un input para ingresar el nuevo curso
            let inputNuevoCurso = document.getElementById('inputNuevoCurso');
            if (!inputNuevoCurso) {
                inputNuevoCurso = document.createElement('input');
                inputNuevoCurso.type = 'text';
                inputNuevoCurso.id = 'inputNuevoCurso';
                inputNuevoCurso.classList.add('form-control', 'mt-2');
                inputNuevoCurso.placeholder = 'Ingrese el nombre del nuevo curso';
                selectElement.parentNode.appendChild(inputNuevoCurso);
            }
        } else {
            // Remover el input de nuevo curso si existe
            const inputNuevoCurso = document.getElementById('inputNuevoCurso');
            if (inputNuevoCurso) {
                inputNuevoCurso.remove();
            }
        }
    });
}

// Función para agregar un nuevo alumno a un curso existente
function agregarAlumno(nombre, curso) {
    // Validar si el curso existe en gradesData
    if (!window.gradesData[curso]) {
        window.gradesData[curso] = {};
    }

    // Validar si el alumno ya existe en el curso
    if (window.gradesData[curso][nombre]) {
        alert('El alumno ya existe en este curso.');
        return;
    }

    // Añadir el alumno al curso existente
    window.gradesData[curso][nombre] = {};

    // Asegurar que window.materiasPorCurso[curso] esté definido
    if (!window.materiasPorCurso[curso]) {
        alert(`No se han definido materias para el curso "${curso.toUpperCase()}".`);
        return;
    }

    window.materiasPorCurso[curso].forEach(materia => {
        window.gradesData[curso][nombre][materia] = {
            'TEA 1': '',
            'TEP 1': '',
            'TED 1': '',
            'Nota 1': '',
            'Asistencia 1': '',
            'TEA 2': '',
            'TEP 2': '',
            'TED 2': '',
            'Nota 2': '',
            'Asistencia 2': '',
        };
    });

    // Guardar en localStorage
    guardarDatosEnLocalStorage();

    // Reconstruir alumnosData
    rebuildAlumnosData();

    // Actualizar cursos disponibles
    window.cursosDisponibles = Object.keys(window.gradesData);

    // Actualizar la interfaz de usuario
    displayCursoSelection();

    alert(`Alumno "${nombre}" añadido correctamente al curso "${curso.toUpperCase()}".`);
}

// Función para agregar un nuevo curso y un alumno inicial
function agregarNuevoCurso(nuevoCurso, nombreAlumno) {
    // Validar si el nuevo curso ya existe
    if (window.gradesData[nuevoCurso]) {
        alert('El curso ya existe. Por favor, selecciona otro nombre.');
        return;
    }

    // Añadir el nuevo curso con materias vacías o predeterminadas
    window.gradesData[nuevoCurso] = {};

    // Definir materias para el nuevo curso
    const materiasDefinidas = prompt('Ingrese las materias para el nuevo curso separadas por comas (e.g., MAT, FIS, BIO):');
    if (!materiasDefinidas) {
        alert('Debe definir al menos una materia para el nuevo curso.');
        delete window.gradesData[nuevoCurso];
        return;
    }

    const materiasArray = materiasDefinidas.split(',').map(m => m.trim().toUpperCase()).filter(m => m !== '');
    if (materiasArray.length === 0) {
        alert('Debe definir al menos una materia válida para el nuevo curso.');
        delete window.gradesData[nuevoCurso];
        return;
    }

    // Añadir las materias al objeto global
    window.materiasPorCurso[nuevoCurso] = materiasArray;

    // Añadir el alumno al nuevo curso
    window.gradesData[nuevoCurso][nombreAlumno] = {};
    materiasArray.forEach(materia => {
        window.gradesData[nuevoCurso][nombreAlumno][materia] = {
            'TEA 1': '',
            'TEP 1': '',
            'TED 1': '',
            'Nota 1': '',
            'Asistencia 1': '',
            'TEA 2': '',
            'TEP 2': '',
            'TED 2': '',
            'Nota 2': '',
            'Asistencia 2': '',
        };
    });

    // Guardar en localStorage
    guardarDatosEnLocalStorage();

    // Reconstruir alumnosData
    rebuildAlumnosData();

    // Actualizar cursos disponibles
    window.cursosDisponibles = Object.keys(window.gradesData);

    // Actualizar la interfaz de usuario
    displayCursoSelection();

    alert(`Nuevo curso "${nuevoCurso.toUpperCase()}" creado y alumno "${nombreAlumno}" añadido correctamente.`);
}

// Función para guardar gradesData en localStorage
function guardarDatosEnLocalStorage() {
    localStorage.setItem('gradesData', JSON.stringify(window.gradesData));
    console.log('Datos actualizados en localStorage.');
}

// Asegúrate de que las funciones 'rebuildAlumnosData' y 'displayCursoSelection' están disponibles en el ámbito global o importadas correctamente si están en archivos separados.

