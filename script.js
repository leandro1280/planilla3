// script.js

// Declaración global de variables
let inputCSV;
let cursoContainer;
let alumnoContainer;
let planillaContainer;
let exportarCompletaButton;
let exportarParcialButton;
let exportarExcelButton;
let limpiarAvancesButton;
let exportarTodoExcelButton;
let formAgregarAlumnoButton;

// Variables globales para almacenar datos
window.alumnosData = []; // Datos de los alumnos
window.cursosDisponibles = []; // Cursos disponibles
window.cursoSeleccionado = ''; // Curso seleccionado
window.materiasPorCurso = {}; // Materias por curso
window.gradesData = {}; // Objeto para almacenar notas y cruces

// Definición de ciclos y cursos por ciclo
const cursosCicloBasico = [
    '1ro 1ra', '1ro 2da', '1ro 3ra',
    '2do 1ra', '2do 2da', '2do 3ra',
    '3ro 1ra', '3ro 2da'
];

const cursosCicloSuperior = [
    '4to 1ra', '4to 2da',
    '5to 1ra', '5to 2da',
    '6to 1ra', '6to 2da'
];

// Definición de materias por curso
window.materiasPorCurso = {
    '1ro 1ra': ['CNT', 'CS', 'CCD', 'ART', 'EFC', 'IGS', 'MTM', 'PLG'],
    '1ro 2da': ['CNT', 'CS', 'CCD', 'ART', 'EFC', 'IGS', 'MTM', 'PLG'],
    '1ro 3ra': ['CNT', 'CS', 'CCD', 'ART', 'EFC', 'IGS', 'MTM', 'PLG'],
    '2do 1ra': ['BLG', 'ART', 'IGS', 'CCD', 'EFC', 'FQA', 'GGF', 'HTR', 'MTM', 'PLG'],
    '2do 2da': ['BLG', 'ART', 'IGS', 'CCD', 'EFC', 'FQA', 'GGF', 'HTR', 'MTM', 'PLG'],
    '2do 3ra': ['BLG', 'ART', 'IGS', 'CCD', 'EFC', 'FQA', 'GGF', 'HTR', 'MTM', 'PLG'],
    '3ro 1ra': ['BLG', 'ART', 'IGS', 'CCD', 'EFC', 'FQA', 'GGF', 'HTR', 'MTM', 'PLG'],
    '3ro 2da': ['BLG', 'ART', 'IGS', 'CCD', 'EFC', 'FQA', 'GGF', 'HTR', 'MTM', 'PLG'],
    '4to 1ra': ['INT FISICA', 'BLG', 'NTICX', 'IGS', 'PSI', 'EFC', 'SYA', 'GGF', 'HTR', 'MCS', 'LIT'],
    '4to 2da': ['INT FISICA', 'BLG', 'NTICX', 'IGS', 'PSI', 'EFC', 'SYA', 'GGF', 'HTR', 'MCS', 'LIT'],
    '5to 1ra': ['CCS', 'ECO', 'INT QUI', 'PYC', 'IGS', 'SOC', 'EFC', 'GGF', 'HTR', 'MCS', 'LIT'],
    '5to 2da': ['CCS', 'ECO', 'INT QUI', 'PYC', 'IGS', 'SOC', 'EFC', 'GGF', 'HTR', 'MCS', 'LIT'],
    '6to 1ra': ['PIC', 'TYC', 'FILO', 'ARTE', 'IGS', 'EFC', 'GGF', 'HTR', 'MCS', 'LIT'],
    '6to 2da': ['PIC', 'TYC', 'FILO', 'ARTE', 'IGS', 'EFC', 'GGF', 'HTR', 'MCS', 'LIT'],
};

// Event Listener para DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Asignar las referencias a elementos del DOM
    inputCSV = document.getElementById('inputCSV');
    cursoContainer = document.getElementById('curso-container');
    alumnoContainer = document.getElementById('alumno-container');
    planillaContainer = document.getElementById('planilla-container');
    exportarCompletaButton = document.getElementById('exportarCompleta');
    exportarParcialButton = document.getElementById('exportarParcial');
    exportarExcelButton = document.getElementById('exportarExcel');
    limpiarAvancesButton = document.getElementById('limpiarAvances');
    exportarTodoExcelButton = document.getElementById('exportarTodoExcel');
    formAgregarAlumnoButton = document.getElementById('FormAgregarAlumno');

    // Añadir event listeners
    if (inputCSV) {
        inputCSV.addEventListener('change', handleFileSelect);
    }
    if (exportarCompletaButton) {
        exportarCompletaButton.addEventListener('click', () => exportToPDF('completa'));
    }
    if (exportarParcialButton) {
        exportarParcialButton.addEventListener('click', () => exportToPDF('parcial'));
    }
    if (exportarExcelButton) {
        exportarExcelButton.addEventListener('click', exportToExcel);
    }
    if (limpiarAvancesButton) {
        limpiarAvancesButton.addEventListener('click', limpiarDatos);
    }
    if (exportarTodoExcelButton) {
        exportarTodoExcelButton.addEventListener('click', exportarTodoExcel);
    }

    // Cargar avances al iniciar
    cargarAvances();

    // Calcular y mostrar porcentajes generales al cargar
    calcularPorcentajesGenerales();

    // Si hay datos guardados, inicializar cursos y alumnos
    if (localStorage.getItem('gradesData')) {
        rebuildAlumnosData();
        window.cursosDisponibles = Object.keys(window.gradesData);
        displayCursoSelection();
    }
});

// Función para manejar la selección de archivo CSV
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const contents = e.target.result;
            parseCSV(contents);
        };
        reader.readAsText(file);
    }
}

// Función para parsear el contenido del CSV
function parseCSV(contents) {
    const rows = contents.split('\n').map(r => r.trim()).filter(r => r);

    // Ignorar la línea de encabezado si existe
    let dataRows = rows;
    if (rows[0].includes(';')) {
        dataRows = rows.slice(1); // Si hay encabezado, lo ignoramos
    }

    const data = dataRows.map(row => {
        const cols = row.split(';').map(c => c.trim()); // Usamos punto y coma como separador
        if (cols.length >= 2) {
            return {
                Curso: cols[0].toLowerCase().trim(),
                Nombre: cols[1]
            };
        } else {
            return null; // Ignorar filas que no tienen al menos dos columnas
        }
    }).filter(item => item !== null);

    window.alumnosData = data;
    window.cursosDisponibles = [...new Set(window.alumnosData.map(a => a.Curso))];

    // Inicializar gradesData con los datos del CSV
    window.gradesData = {};
    window.alumnosData.forEach(alumno => {
        if (!window.gradesData[alumno.Curso]) {
            window.gradesData[alumno.Curso] = {};
        }
        if (!window.gradesData[alumno.Curso][alumno.Nombre]) {
            window.gradesData[alumno.Curso][alumno.Nombre] = {};
            // Inicializar materias
            const materias = window.materiasPorCurso[alumno.Curso];
            if (materias) {
                materias.forEach(materia => {
                    window.gradesData[alumno.Curso][alumno.Nombre][materia] = {
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
            }
        }
    });

    // Guardar en localStorage
    guardarAvances();

    displayCursoSelection();
}

// Función para reconstruir alumnosData a partir de gradesData
function rebuildAlumnosData() {
    window.alumnosData = [];
    for (const curso in window.gradesData) {
        for (const alumno in window.gradesData[curso]) {
            window.alumnosData.push({
                Curso: curso,
                Nombre: alumno
            });
        }
    }
}

// Función para cargar los avances desde localStorage
function cargarAvances() {
    const datosGuardados = JSON.parse(localStorage.getItem('gradesData'));
    if (!datosGuardados) return;

    window.gradesData = datosGuardados;

    // Reconstruir alumnosData
    rebuildAlumnosData();

    // Actualizar cursos disponibles
    window.cursosDisponibles = Object.keys(window.gradesData);

    // Actualizar la selección de cursos
    displayCursoSelection();

    // Cargar las notas en la planilla si está visible
    if (window.cursoSeleccionado) {
        cargarNotasEnPlanilla();
    }
}

// Función para cargar las notas en la planilla
function cargarNotasEnPlanilla() {
    // Solo cargar si el curso seleccionado está presente en gradesData
    if (!window.gradesData[window.cursoSeleccionado]) return;

    // Obtener todas las filas de la tabla
    const filas = Array.from(planillaContainer.querySelectorAll('tbody tr'));

    filas.forEach(fila => {
        const alumnoNombre = fila.dataset.alumno || 'Desconocido';
        const materia = fila.dataset.materia || 'Desconocida';

        if (window.gradesData[window.cursoSeleccionado][alumnoNombre] && window.gradesData[window.cursoSeleccionado][alumnoNombre][materia]) {
            const notasGuardadas = window.gradesData[window.cursoSeleccionado][alumnoNombre][materia];

            // Obtener las celdas correspondientes
            const celdas = fila.querySelectorAll('td');

            if (celdas.length >= 12) {
                // TEA 1
                const celdaTEA1 = celdas[2];
                const celdaTEP1 = celdas[3];
                const celdaTED1 = celdas[4];
                const inputNota1 = celdas[5].querySelector('input');
                // Asistencia 1: celdas[6]

                if (notasGuardadas['TEA 1']) celdaTEA1.textContent = notasGuardadas['TEA 1'];
                if (notasGuardadas['TEP 1']) celdaTEP1.textContent = notasGuardadas['TEP 1'];
                if (notasGuardadas['TED 1']) celdaTED1.textContent = notasGuardadas['TED 1'];
                if (inputNota1) inputNota1.value = notasGuardadas['Nota 1'] || '';

                // TEA 2
                const celdaTEA2 = celdas[7];
                const celdaTEP2 = celdas[8];
                const celdaTED2 = celdas[9];
                const inputNota2 = celdas[10].querySelector('input');
                // Asistencia 2: celdas[11]

                if (notasGuardadas['TEA 2']) celdaTEA2.textContent = notasGuardadas['TEA 2'];
                if (notasGuardadas['TEP 2']) celdaTEP2.textContent = notasGuardadas['TEP 2'];
                if (notasGuardadas['TED 2']) celdaTED2.textContent = notasGuardadas['TED 2'];
                if (inputNota2) inputNota2.value = notasGuardadas['Nota 2'] || '';
            }
        }
    });

    console.log('Notas cargadas en la planilla desde gradesData.');
}

// Función para mostrar la selección de cursos
function displayCursoSelection() {
    cursoContainer.innerHTML = '';
    const label = document.createElement('label');
    label.textContent = 'Selecciona el curso:';
    label.classList.add('form-label');

    const select = document.createElement('select');
    select.classList.add('form-select');

    if (window.cursosDisponibles.length === 0) {
        select.innerHTML = '<option value="">No hay cursos disponibles</option>';
        select.disabled = true;
    } else {
        select.innerHTML = window.cursosDisponibles.map(curso => `<option value="${curso}">${curso.toUpperCase()}</option>`).join('');
        select.disabled = false;
    }

    cursoContainer.appendChild(label);
    cursoContainer.appendChild(select);

    select.addEventListener('change', () => {
        window.cursoSeleccionado = select.value.toLowerCase().trim();
        const alumnosDelCurso = window.alumnosData.filter(a => a.Curso === window.cursoSeleccionado);
        displayAlumnoSelection(alumnosDelCurso);
        const alumnosFiltrados = alumnosDelCurso;
        displayPlanilla(alumnosFiltrados);
        // Llamar a las funciones de cálculo de porcentajes
        calcularPorcentajesGenerales();
    });

    // Seleccionar el primer curso por defecto si hay cursos disponibles
    if (window.cursosDisponibles.length > 0) {
        select.value = window.cursosDisponibles[0];
        select.dispatchEvent(new Event('change'));
    }
}

// Función para mostrar la selección de alumnos
function displayAlumnoSelection(alumnos) {
    alumnoContainer.innerHTML = '';
    const label = document.createElement('label');
    label.textContent = 'Selecciona el alumno:';
    label.classList.add('form-label');

    const select = document.createElement('select');
    select.classList.add('form-select');

    select.innerHTML = '<option value="">Todos los alumnos</option>' + alumnos.map(alumno => `<option value="${alumno.Nombre}">${alumno.Nombre}</option>`).join('');

    alumnoContainer.appendChild(label);
    alumnoContainer.appendChild(select);

    select.addEventListener('change', () => {
        const alumnoSeleccionado = select.value;
        let alumnosFiltrados = alumnos;
        if (alumnoSeleccionado) {
            alumnosFiltrados = alumnos.filter(a => a.Nombre === alumnoSeleccionado);
        }
        displayPlanilla(alumnosFiltrados);
        // Llamar a las funciones de cálculo de porcentajes
        calcularPorcentajesGenerales();
    });
}

// Función para mostrar la planilla de notas
function displayPlanilla(alumnos) {
    planillaContainer.innerHTML = '';

    // Crear contenedor de la planilla
    const planilla = document.createElement('div');
    planilla.classList.add('planilla');

    // Título de la planilla
    const titulo = document.createElement('h3');
    titulo.textContent = `Planilla de ${window.cursoSeleccionado.toUpperCase()}`;
    planilla.appendChild(titulo);

    // Verificar que el curso tiene materias definidas
    if (!window.materiasPorCurso[window.cursoSeleccionado]) {
        alert(`No hay materias definidas para el curso ${window.cursoSeleccionado.toUpperCase()}`);
        return;
    }

    // Crear la tabla de la planilla
    const tabla = document.createElement('table');
    tabla.classList.add('table', 'table-bordered', 'tabla-planilla');
    tabla.id = 'planilla-table'; // Asignar un ID para facilitar la selección

    // Crear el encabezado de la tabla
    const thead = document.createElement('thead');
    thead.classList.add('table-dark');
    const encabezadoFila = document.createElement('tr');

    // Agregar columnas al encabezado
    const columnas = ['Alumno', 'Materia', 'TEA 1', 'TEP 1', 'TED 1', 'Nota 1', 'Asistencia 1', 'TEA 2', 'TEP 2', 'TED 2', 'Nota 2', 'Asistencia 2'];

    columnas.forEach(columna => {
        const th = document.createElement('th');
        th.textContent = columna;
        encabezadoFila.appendChild(th);
    });

    thead.appendChild(encabezadoFila);
    tabla.appendChild(thead);

    // Crear el cuerpo de la tabla
    const tbody = document.createElement('tbody');

    // Por cada alumno y por cada materia, crear una fila
    alumnos.forEach(alumno => {
        window.materiasPorCurso[window.cursoSeleccionado].forEach((materia) => {
            const fila = document.createElement('tr');
            fila.dataset.alumno = alumno.Nombre;
            fila.dataset.materia = materia.toUpperCase();

            // Celda para el nombre del alumno y checkbox
            const celdaNombre = document.createElement('td');
            // Repetir el nombre del alumno en cada fila
            const contenedorNombre = document.createElement('div');
            contenedorNombre.style.display = 'flex';
            contenedorNombre.style.alignItems = 'center';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('form-check-input', 'checkbox-alumno');
            checkbox.checked = true; // Seleccionado por defecto

            const nombreTexto = document.createElement('span');
            nombreTexto.textContent = ' ' + alumno.Nombre;

            contenedorNombre.appendChild(checkbox);
            contenedorNombre.appendChild(nombreTexto);

            celdaNombre.appendChild(contenedorNombre);
            celdaNombre.classList.add('celda-nombre');

            fila.appendChild(celdaNombre);

            // Celda para la materia
            const celdaMateria = document.createElement('td');
            celdaMateria.textContent = materia;
            celdaMateria.dataset.materia = materia.toUpperCase(); // Almacenar el nombre en mayúsculas

            fila.appendChild(celdaMateria);

            // Crear celdas para TEA, TEP, TED, Nota y Asistencia
            columnas.slice(2).forEach(columna => {
                const celda = document.createElement('td');

                if (columna.startsWith('TEA')) {
                    // Asignar clase para TEA
                    celda.classList.add('celda-tea');
                } else if (columna.startsWith('TEP')) {
                    // Asignar clase para TEP
                    celda.classList.add('celda-tep');
                } else if (columna.startsWith('TED')) {
                    // Asignar clase para TED
                    celda.classList.add('celda-ted');
                } else if (columna.startsWith('Nota')) {
                    const inputNota = document.createElement('input');
                    inputNota.type = 'number';
                    inputNota.classList.add('form-control', 'input-nota');
                    inputNota.min = 1;
                    inputNota.max = 10;
                    inputNota.dataset.tipo = columna; // 'Nota 1' o 'Nota 2'

                    // Cargar nota desde gradesData si existe
                    const alumnoNombre = alumno.Nombre;
                    const materiaUpper = materia.toUpperCase();
                    if (window.gradesData[window.cursoSeleccionado] && window.gradesData[window.cursoSeleccionado][alumnoNombre] && window.gradesData[window.cursoSeleccionado][alumnoNombre][materiaUpper]) {
                        inputNota.value = window.gradesData[window.cursoSeleccionado][alumnoNombre][materiaUpper][columna] || '';
                    }

                    // Agregar evento para actualizar las cruces y guardar avances
                    inputNota.addEventListener('input', () => {
                        actualizarCruces(fila, inputNota);
                        // Guardar avances cada vez que se actualiza una nota
                        guardarAvances();
                        // Calcular y mostrar porcentajes
                        calcularPorcentajesGenerales();
                    });

                    celda.appendChild(inputNota);
                } else {
                    // Asistencia u otras columnas (puedes agregar lógica si es necesario)
                    // Por ahora, dejar en blanco o agregar una celda de asistencia editable si lo deseas
                }

                fila.appendChild(celda);
            });

            // Verificación de la estructura de la fila
            if (fila.children.length !== columnas.length) {
                console.error(`Fila mal estructurada para el alumno ${alumno.Nombre} y materia ${materia}. Esperado ${columnas.length} celdas, pero recibió ${fila.children.length}.`);
            }

            tbody.appendChild(fila);
        });
    });

    tabla.appendChild(tbody);
    planilla.appendChild(tabla);
    planillaContainer.appendChild(planilla);

    // Cargar las notas en la planilla
    cargarNotasEnPlanilla();
}

// Función para actualizar las cruces de TEA, TEP y TED
function actualizarCruces(fila, inputNota) {
    const nota = parseInt(inputNota.value);
    const tipoNota = inputNota.dataset.tipo; // 'Nota 1' o 'Nota 2'

    if (isNaN(nota)) {
        limpiarCruces(fila, tipoNota);
        return;
    }

    // Obtener las celdas relevantes usando clases
    const celdas = fila.querySelectorAll('td');

    let celdaTEA, celdaTEP, celdaTED;

    if (tipoNota === 'Nota 1') {
        celdaTEA = celdas[2];
        celdaTEP = celdas[3];
        celdaTED = celdas[4];
    } else if (tipoNota === 'Nota 2') {
        celdaTEA = celdas[7];
        celdaTEP = celdas[8];
        celdaTED = celdas[9];
    }

    if (!celdaTEA || !celdaTEP || !celdaTED) {
        console.error('No se encontraron las celdas TEA, TEP o TED en la fila.');
        return;
    }

    // Limpiar cruces anteriores
    celdaTEA.textContent = '';
    celdaTEP.textContent = '';
    celdaTED.textContent = '';

    // Marcar la celda correspondiente
    let cruz = '';
    if (nota >= 1 && nota <= 3) {
        celdaTED.textContent = 'X';
        cruz = 'TED';
    } else if (nota >= 4 && nota <= 6) {
        celdaTEP.textContent = 'X';
        cruz = 'TEP';
    } else if (nota >= 7 && nota <= 10) {
        celdaTEA.textContent = 'X';
        cruz = 'TEA';
    } else {
        // Nota fuera de rango, limpiar celdas
        console.warn('Nota fuera de rango para:', tipoNota, 'Nota ingresada:', nota);
    }

    // Actualizar gradesData con la nueva nota y cruces
    const alumno = fila.dataset.alumno || 'Desconocido';
    const materia = fila.dataset.materia || 'Desconocida';

    if (!window.gradesData[window.cursoSeleccionado]) {
        window.gradesData[window.cursoSeleccionado] = {};
    }
    if (!window.gradesData[window.cursoSeleccionado][alumno]) {
        window.gradesData[window.cursoSeleccionado][alumno] = {};
    }
    if (!window.gradesData[window.cursoSeleccionado][alumno][materia]) {
        window.gradesData[window.cursoSeleccionado][alumno][materia] = {};
    }

    window.gradesData[window.cursoSeleccionado][alumno][materia][tipoNota] = nota.toString();
    window.gradesData[window.cursoSeleccionado][alumno][materia][`TEA ${tipoNota.slice(-1)}`] = (cruz === 'TEA') ? 'X' : '';
    window.gradesData[window.cursoSeleccionado][alumno][materia][`TEP ${tipoNota.slice(-1)}`] = (cruz === 'TEP') ? 'X' : '';
    window.gradesData[window.cursoSeleccionado][alumno][materia][`TED ${tipoNota.slice(-1)}`] = (cruz === 'TED') ? 'X' : '';

    // Guardar avances
    guardarAvances();

    // Recalcular y mostrar todos los porcentajes
    calcularPorcentajesGenerales();
}

// Función para limpiar las cruces de TEA, TEP y TED
function limpiarCruces(fila, tipoNota) {
    const celdas = fila.querySelectorAll('td');

    let celdaTEA, celdaTEP, celdaTED;

    if (tipoNota === 'Nota 1') {
        celdaTEA = celdas[2];
        celdaTEP = celdas[3];
        celdaTED = celdas[4];
    } else if (tipoNota === 'Nota 2') {
        celdaTEA = celdas[7];
        celdaTEP = celdas[8];
        celdaTED = celdas[9];
    }

    if (celdaTEA) celdaTEA.textContent = '';
    if (celdaTEP) celdaTEP.textContent = '';
    if (celdaTED) celdaTED.textContent = '';
}

// Función para guardar los avances en localStorage
function guardarAvances() {
    // Guardar gradesData en localStorage
    localStorage.setItem('gradesData', JSON.stringify(window.gradesData));
    console.log('Avances guardados en localStorage.');
}

// Función para limpiar los datos guardados
function limpiarDatos() {
    if (confirm('¿Estás seguro de que deseas limpiar todos los datos guardados? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('gradesData');
        location.reload(); // Recargar la página para reflejar los cambios
    }
}


// Función para calcular y mostrar todos los porcentajes
function calcularPorcentajesGenerales() {
    calcularPorcentajesPlgLitPorCurso();
    calcularPorcentajesMtmMcsPorCurso();
    calcularPorcentajesMtmCicloBasico();
    calcularPorcentajesPlgCicloBasico();
    calcularPorcentajesTeaTepTedPorCurso();
    calcularPorcentajesTepTeaTedCicloBasico();
    calcularPorcentajesMcsCicloSuperior();
    calcularPorcentajesLitCicloSuperior();
    calcularPorcentajesTedTeaTepCicloSuperior();
    calcularPorcentajesTedTeaTepTodaEscuela();
    calcularPorcentajesMateriaPorCurso('BLG');
 calcularPorcentajesMateriaCicloBasico('BLG');
 calcularPorcentajesMateriaCicloSuperior('BLG');
 calcularPorcentajesMateriaTodaEscuela('BLG');

 calcularPorcentajesMateriaPorCurso('HTR');
 calcularPorcentajesMateriaCicloBasico('HTR');
 calcularPorcentajesMateriaCicloSuperior('HTR');
calcularPorcentajesMateriaTodaEscuela('HTR');
}

// 1. Contador de PLG/LIT según corresponda por curso
function calcularPorcentajesPlgLitPorCurso() {
    if (!cursoSeleccionado) return;

    const datosCurso = gradesData[cursoSeleccionado];
    if (!datosCurso) return;

    let totalTEA = 0;
    let totalTEP = 0;
    let totalTED = 0;
    let totalNotas = 0;

    for (const alumno in datosCurso) {
        const materias = datosCurso[alumno];
        for (const materia in materias) {
            if (materia === 'PLG' || materia === 'LIT') {
                const notasMateria = materias[materia];
                // Contar TEA, TEP y TED de Nota 1
                if (notasMateria['Nota 1']) {
                    totalNotas++;
                    if (notasMateria['TEA 1'] === 'X') totalTEA++;
                    if (notasMateria['TEP 1'] === 'X') totalTEP++;
                    if (notasMateria['TED 1'] === 'X') totalTED++;
                }
                // Contar TEA, TEP y TED de Nota 2
                if (notasMateria['Nota 2']) {
                    totalNotas++;
                    if (notasMateria['TEA 2'] === 'X') totalTEA++;
                    if (notasMateria['TEP 2'] === 'X') totalTEP++;
                    if (notasMateria['TED 2'] === 'X') totalTED++;
                }
            }
        }
    }

    // Calcular porcentajes
    const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

    // Mostrar resultados
    mostrarPorcentajesPlgLitPorCursoUI(porcentajeTEA, porcentajeTEP, porcentajeTED);
}

function mostrarPorcentajesPlgLitPorCursoUI(porcentajeTEA, porcentajeTEP, porcentajeTED) {
    const contenedor = document.getElementById('porcentajes-plg-lit-curso');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${porcentajeTEA}%</p>
            <p class="card-text">TEP: ${porcentajeTEP}%</p>
            <p class="card-text">TED: ${porcentajeTED}%</p>
        `;
    }
}

// 2. Contador de MTM/MCS según corresponda por curso
function calcularPorcentajesMtmMcsPorCurso() {
    if (!cursoSeleccionado) return;

    const datosCurso = gradesData[cursoSeleccionado];
    if (!datosCurso) return;

    let totalTEA = 0;
    let totalTEP = 0;
    let totalTED = 0;
    let totalNotas = 0;

    for (const alumno in datosCurso) {
        const materias = datosCurso[alumno];
        for (const materia in materias) {
            if (materia === 'MTM' || materia === 'MCS') {
                const notasMateria = materias[materia];
                // Contar TEA, TEP y TED de Nota 1
                if (notasMateria['Nota 1']) {
                    totalNotas++;
                    if (notasMateria['TEA 1'] === 'X') totalTEA++;
                    if (notasMateria['TEP 1'] === 'X') totalTEP++;
                    if (notasMateria['TED 1'] === 'X') totalTED++;
                }
                // Contar TEA, TEP y TED de Nota 2
                if (notasMateria['Nota 2']) {
                    totalNotas++;
                    if (notasMateria['TEA 2'] === 'X') totalTEA++;
                    if (notasMateria['TEP 2'] === 'X') totalTEP++;
                    if (notasMateria['TED 2'] === 'X') totalTED++;
                }
            }
        }
    }

    // Calcular porcentajes
    const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

    // Mostrar resultados
    mostrarPorcentajesMtmMcsPorCursoUI(porcentajeTEA, porcentajeTEP, porcentajeTED);
}

function mostrarPorcentajesMtmMcsPorCursoUI(porcentajeTEA, porcentajeTEP, porcentajeTED) {
    const contenedor = document.getElementById('porcentajes-mtm-mcs-curso');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${porcentajeTEA}%</p>
            <p class="card-text">TEP: ${porcentajeTEP}%</p>
            <p class="card-text">TED: ${porcentajeTED}%</p>
        `;
    }
}

// 3. Contador de MTM de Ciclo Básico
function calcularPorcentajesMtmCicloBasico() {
    if (!cursoSeleccionado) return;

    const datosCurso = gradesData[cursoSeleccionado];
    if (!datosCurso) return;

    let totalTEA = 0;
    let totalTEP = 0;
    let totalTED = 0;
    let totalNotas = 0;

    for (const alumno in datosCurso) {
        const materias = datosCurso[alumno];
        for (const materia in materias) {
            if (materia === 'MTM') {
                const notasMateria = materias[materia];
                // Contar TEA, TEP y TED de Nota 1
                if (notasMateria['Nota 1']) {
                    totalNotas++;
                    if (notasMateria['TEA 1'] === 'X') totalTEA++;
                    if (notasMateria['TEP 1'] === 'X') totalTEP++;
                    if (notasMateria['TED 1'] === 'X') totalTED++;
                }
                // Contar TEA, TEP y TED de Nota 2
                if (notasMateria['Nota 2']) {
                    totalNotas++;
                    if (notasMateria['TEA 2'] === 'X') totalTEA++;
                    if (notasMateria['TEP 2'] === 'X') totalTEP++;
                    if (notasMateria['TED 2'] === 'X') totalTED++;
                }
            }
        }
    }

    // Calcular porcentajes
    const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

    // Mostrar resultados
    mostrarPorcentajesMtmCicloBasicoUI(porcentajeTEA, porcentajeTEP, porcentajeTED);
}

function mostrarPorcentajesMtmCicloBasicoUI(porcentajeTEA, porcentajeTEP, porcentajeTED) {
    const contenedor = document.getElementById('porcentajes-mtm-ciclo-basico');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${porcentajeTEA}%</p>
            <p class="card-text">TEP: ${porcentajeTEP}%</p>
            <p class="card-text">TED: ${porcentajeTED}%</p>
        `;
    }
}

// 4. Contador de PLG de Ciclo Básico
function calcularPorcentajesPlgCicloBasico() {
    if (!cursoSeleccionado) return;

    const datosCurso = gradesData[cursoSeleccionado];
    if (!datosCurso) return;

    let totalTEA = 0;
    let totalTEP = 0;
    let totalTED = 0;
    let totalNotas = 0;

    for (const alumno in datosCurso) {
        const materias = datosCurso[alumno];
        for (const materia in materias) {
            if (materia === 'PLG') {
                const notasMateria = materias[materia];
                // Contar TEA, TEP y TED de Nota 1
                if (notasMateria['Nota 1']) {
                    totalNotas++;
                    if (notasMateria['TEA 1'] === 'X') totalTEA++;
                    if (notasMateria['TEP 1'] === 'X') totalTEP++;
                    if (notasMateria['TED 1'] === 'X') totalTED++;
                }
                // Contar TEA, TEP y TED de Nota 2
                if (notasMateria['Nota 2']) {
                    totalNotas++;
                    if (notasMateria['TEA 2'] === 'X') totalTEA++;
                    if (notasMateria['TEP 2'] === 'X') totalTEP++;
                    if (notasMateria['TED 2'] === 'X') totalTED++;
                }
            }
        }
    }

    // Calcular porcentajes
    const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

    // Mostrar resultados
    mostrarPorcentajesPlgCicloBasicoUI(porcentajeTEA, porcentajeTEP, porcentajeTED);
}

function mostrarPorcentajesPlgCicloBasicoUI(porcentajeTEA, porcentajeTEP, porcentajeTED) {
    const contenedor = document.getElementById('porcentajes-plg-ciclo-basico');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${porcentajeTEA}%</p>
            <p class="card-text">TEP: ${porcentajeTEP}%</p>
            <p class="card-text">TED: ${porcentajeTED}%</p>
        `;
    }
}

// 5. Contador de TEA, TEP y TED por curso
function calcularPorcentajesTeaTepTedPorCurso() {
    if (!cursoSeleccionado) return;

    const datosCurso = gradesData[cursoSeleccionado];
    if (!datosCurso) return;

    let totalTEA = 0;
    let totalTEP = 0;
    let totalTED = 0;
    let totalNotas = 0;

    for (const alumno in datosCurso) {
        const materias = datosCurso[alumno];
        for (const materia in materias) {
            const notasMateria = materias[materia];

            // Contar TEA, TEP y TED de Nota 1
            if (notasMateria['Nota 1']) {
                totalNotas++;
                if (notasMateria['TEA 1'] === 'X') totalTEA++;
                if (notasMateria['TEP 1'] === 'X') totalTEP++;
                if (notasMateria['TED 1'] === 'X') totalTED++;
            }

            // Contar TEA, TEP y TED de Nota 2
            if (notasMateria['Nota 2']) {
                totalNotas++;
                if (notasMateria['TEA 2'] === 'X') totalTEA++;
                if (notasMateria['TEP 2'] === 'X') totalTEP++;
                if (notasMateria['TED 2'] === 'X') totalTED++;
            }
        }
    }

    // Calcular porcentajes
    const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

    // Mostrar resultados
    mostrarPorcentajesTeaTepTedPorCursoUI(porcentajeTEA, porcentajeTEP, porcentajeTED);
}

function mostrarPorcentajesTeaTepTedPorCursoUI(porcentajeTEA, porcentajeTEP, porcentajeTED) {
    const contenedor = document.getElementById('porcentajes-tea-tep-ted-curso');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${porcentajeTEA}%</p>
            <p class="card-text">TEP: ${porcentajeTEP}%</p>
            <p class="card-text">TED: ${porcentajeTED}%</p>
        `;
    }
}

// 6. Contador de TEA, TEP y TED de Ciclo Básico
function calcularPorcentajesTepTeaTedCicloBasico() {
    let totalTEA = 0;
    let totalTEP = 0;
    let totalTED = 0;
    let totalNotas = 0;

    cursosCicloBasico.forEach(curso => {
        const datosCurso = gradesData[curso.toLowerCase()];
        if (!datosCurso) return;

        for (const alumno in datosCurso) {
            const materias = datosCurso[alumno];
            for (const materia in materias) {
                const notasMateria = materias[materia];

                // Contar TEA, TEP y TED de Nota 1
                if (notasMateria['Nota 1']) {
                    totalNotas++;
                    if (notasMateria['TEA 1'] === 'X') totalTEA++;
                    if (notasMateria['TEP 1'] === 'X') totalTEP++;
                    if (notasMateria['TED 1'] === 'X') totalTED++;
                }

                // Contar TEA, TEP y TED de Nota 2
                if (notasMateria['Nota 2']) {
                    totalNotas++;
                    if (notasMateria['TEA 2'] === 'X') totalTEA++;
                    if (notasMateria['TEP 2'] === 'X') totalTEP++;
                    if (notasMateria['TED 2'] === 'X') totalTED++;
                }
            }
        }
    });

    // Calcular porcentajes
    const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

    // Mostrar resultados
    mostrarPorcentajesTepTeaTedCicloBasicoUI(porcentajeTEA, porcentajeTEP, porcentajeTED);
}

function mostrarPorcentajesTepTeaTedCicloBasicoUI(porcentajeTEA, porcentajeTEP, porcentajeTED) {
    const contenedor = document.getElementById('porcentajes-tea-tep-ted-ciclo-basico');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${porcentajeTEA}%</p>
            <p class="card-text">TEP: ${porcentajeTEP}%</p>
            <p class="card-text">TED: ${porcentajeTED}%</p>
        `;
    }
}

// 7. Contador de MCS de Ciclo Superior
function calcularPorcentajesMcsCicloSuperior() {
    if (!cursoSeleccionado) return;

    const datosCurso = gradesData[cursoSeleccionado];
    if (!datosCurso) return;

    let totalTEA = 0;
    let totalTEP = 0;
    let totalTED = 0;
    let totalNotas = 0;

    for (const alumno in datosCurso) {
        const materias = datosCurso[alumno];
        for (const materia in materias) {
            if (materia === 'MCS') {
                const notasMateria = materias[materia];
                // Contar TEA, TEP y TED de Nota 1
                if (notasMateria['Nota 1']) {
                    totalNotas++;
                    if (notasMateria['TEA 1'] === 'X') totalTEA++;
                    if (notasMateria['TEP 1'] === 'X') totalTEP++;
                    if (notasMateria['TED 1'] === 'X') totalTED++;
                }
                // Contar TEA, TEP y TED de Nota 2
                if (notasMateria['Nota 2']) {
                    totalNotas++;
                    if (notasMateria['TEA 2'] === 'X') totalTEA++;
                    if (notasMateria['TEP 2'] === 'X') totalTEP++;
                    if (notasMateria['TED 2'] === 'X') totalTED++;
                }
            }
        }
    }

    // Calcular porcentajes
    const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

    // Mostrar resultados
    mostrarPorcentajesMcsCicloSuperiorUI(porcentajeTEA, porcentajeTEP, porcentajeTED);
}

function mostrarPorcentajesMcsCicloSuperiorUI(porcentajeTEA, porcentajeTEP, porcentajeTED) {
    const contenedor = document.getElementById('porcentajes-mcs-ciclo-superior');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${porcentajeTEA}%</p>
            <p class="card-text">TEP: ${porcentajeTEP}%</p>
            <p class="card-text">TED: ${porcentajeTED}%</p>
        `;
    }
}

// 8. Contador de LIT de Ciclo Superior
function calcularPorcentajesLitCicloSuperior() {
    if (!cursoSeleccionado) return;

    const datosCurso = gradesData[cursoSeleccionado];
    if (!datosCurso) return;

    let totalTEA = 0;
    let totalTEP = 0;
    let totalTED = 0;
    let totalNotas = 0;

    for (const alumno in datosCurso) {
        const materias = datosCurso[alumno];
        for (const materia in materias) {
            if (materia === 'LIT') {
                const notasMateria = materias[materia];
                // Contar TEA, TEP y TED de Nota 1
                if (notasMateria['Nota 1']) {
                    totalNotas++;
                    if (notasMateria['TEA 1'] === 'X') totalTEA++;
                    if (notasMateria['TEP 1'] === 'X') totalTEP++;
                    if (notasMateria['TED 1'] === 'X') totalTED++;
                }
                // Contar TEA, TEP y TED de Nota 2
                if (notasMateria['Nota 2']) {
                    totalNotas++;
                    if (notasMateria['TEA 2'] === 'X') totalTEA++;
                    if (notasMateria['TEP 2'] === 'X') totalTEP++;
                    if (notasMateria['TED 2'] === 'X') totalTED++;
                }
            }
        }
    }

    // Calcular porcentajes
    const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

    // Mostrar resultados
    mostrarPorcentajesLitCicloSuperiorUI(porcentajeTEA, porcentajeTEP, porcentajeTED);
}

function mostrarPorcentajesLitCicloSuperiorUI(porcentajeTEA, porcentajeTEP, porcentajeTED) {
    const contenedor = document.getElementById('porcentajes-lit-ciclo-superior');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${porcentajeTEA}%</p>
            <p class="card-text">TEP: ${porcentajeTEP}%</p>
            <p class="card-text">TED: ${porcentajeTED}%</p>
        `;
    }
}

// 9. Contador de TEA, TEP y TED de Ciclo Superior
function calcularPorcentajesTedTeaTepCicloSuperior() {
    let totalTEA = 0;
    let totalTEP = 0;
    let totalTED = 0;
    let totalNotas = 0;

    cursosCicloSuperior.forEach(curso => {
        const datosCurso = gradesData[curso.toLowerCase()];
        if (!datosCurso) return;

        for (const alumno in datosCurso) {
            const materias = datosCurso[alumno];
            for (const materia in materias) {
                const notasMateria = materias[materia];

                // Contar TEA, TEP y TED de Nota 1
                if (notasMateria['Nota 1']) {
                    totalNotas++;
                    if (notasMateria['TEA 1'] === 'X') totalTEA++;
                    if (notasMateria['TEP 1'] === 'X') totalTEP++;
                    if (notasMateria['TED 1'] === 'X') totalTED++;
                }

                // Contar TEA, TEP y TED de Nota 2
                if (notasMateria['Nota 2']) {
                    totalNotas++;
                    if (notasMateria['TEA 2'] === 'X') totalTEA++;
                    if (notasMateria['TEP 2'] === 'X') totalTEP++;
                    if (notasMateria['TED 2'] === 'X') totalTED++;
                }
            }
        }
    });

    // Calcular porcentajes
    const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

    // Mostrar resultados
    mostrarPorcentajesTedTeaTepCicloSuperiorUI(porcentajeTEA, porcentajeTEP, porcentajeTED);
}

function mostrarPorcentajesTedTeaTepCicloSuperiorUI(porcentajeTEA, porcentajeTEP, porcentajeTED) {
    const contenedor = document.getElementById('porcentajes-tea-tep-ted-ciclo-superior');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${porcentajeTEA}%</p>
            <p class="card-text">TEP: ${porcentajeTEP}%</p>
            <p class="card-text">TED: ${porcentajeTED}%</p>
        `;
    }
}

// 10. Contador de TEA, TEP y TED de toda la escuela
function calcularPorcentajesTedTeaTepTodaEscuela() {
    let totalTEA = 0;
    let totalTEP = 0;
    let totalTED = 0;
    let totalNotas = 0;

    for (const curso in gradesData) {
        const datosCurso = gradesData[curso];
        for (const alumno in datosCurso) {
            const materias = datosCurso[alumno];
            for (const materia in materias) {
                const notasMateria = materias[materia];

                // Contar TEA, TEP y TED de Nota 1
                if (notasMateria['Nota 1']) {
                    totalNotas++;
                    if (notasMateria['TEA 1'] === 'X') totalTEA++;
                    if (notasMateria['TEP 1'] === 'X') totalTEP++;
                    if (notasMateria['TED 1'] === 'X') totalTED++;
                }

                // Contar TEA, TEP y TED de Nota 2
                if (notasMateria['Nota 2']) {
                    totalNotas++;
                    if (notasMateria['TEA 2'] === 'X') totalTEA++;
                    if (notasMateria['TEP 2'] === 'X') totalTEP++;
                    if (notasMateria['TED 2'] === 'X') totalTED++;
                }
            }
        }
    }

    // Calcular porcentajes
    const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
    const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

    // Mostrar resultados
    mostrarPorcentajesTedTeaTepTodaEscuelaUI(porcentajeTEA, porcentajeTEP, porcentajeTED);
}

function mostrarPorcentajesTedTeaTepTodaEscuelaUI(porcentajeTEA, porcentajeTEP, porcentajeTED) {
    const contenedor = document.getElementById('porcentajes-tea-tep-ted-escuela');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${porcentajeTEA}%</p>
            <p class="card-text">TEP: ${porcentajeTEP}%</p>
            <p class="card-text">TED: ${porcentajeTED}%</p>
        `;
    }
}

// Funciones de exportación
function exportToPDF(tipo) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Seleccionar el contenido a exportar
    const planilla = document.getElementById('planilla-container');

    // Usar html2canvas para capturar el contenido
    html2canvas(planilla).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        doc.save(`${tipo}_planilla.pdf`);
    }).catch(error => {
        console.error('Error al exportar a PDF:', error);
        alert('Hubo un error al exportar a PDF. Por favor, intenta nuevamente.');
    });
}

function exportToExcel() {
    const table = document.getElementById('planilla-table');
    if (!table) {
        alert('No hay una planilla para exportar.');
        return;
    }

    const workbook = XLSX.utils.table_to_book(table, { sheet: "Planilla" });
    XLSX.writeFile(workbook, 'planilla_notas.xlsx');
}


const verGraficosButton = document.getElementById('verGraficosButton');
if (verGraficosButton) {
    verGraficosButton.addEventListener('click', () => {
        // Abrir la página de gráficos en una nueva pestaña
        window.open('graphs.html', '_blank');
    });
}


// Funciones genéricas para materias específicas (BLG, HTR)

// MATERIA POR CURSO
function calcularPorcentajesMateriaPorCurso(materia) {
    if (!cursoSeleccionado || !gradesData[cursoSeleccionado]) {
        mostrarPorcentajesMateria('curso', materia, '0', '0', '0');
        return;
    }

    const datosCurso = gradesData[cursoSeleccionado];
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;

    for (const alumno in datosCurso) {
        const mats = datosCurso[alumno];
        if (mats[materia]) {
            const notasMateria = mats[materia];
            if (notasMateria['Nota 1']) {
                totalNotas++;
                if (notasMateria['TEA 1'] === 'X') totalTEA++;
                if (notasMateria['TEP 1'] === 'X') totalTEP++;
                if (notasMateria['TED 1'] === 'X') totalTED++;
            }
            if (notasMateria['Nota 2']) {
                totalNotas++;
                if (notasMateria['TEA 2'] === 'X') totalTEA++;
                if (notasMateria['TEP 2'] === 'X') totalTEP++;
                if (notasMateria['TED 2'] === 'X') totalTED++;
            }
        }
    }

    const tea = totalNotas ? ((totalTEA/totalNotas)*100).toFixed(2) : '0';
    const tep = totalNotas ? ((totalTEP/totalNotas)*100).toFixed(2) : '0';
    const ted = totalNotas ? ((totalTED/totalNotas)*100).toFixed(2) : '0';

    mostrarPorcentajesMateria('curso', materia, tea, tep, ted);
}

// MATERIA CICLO BASICO
function calcularPorcentajesMateriaCicloBasico(materia) {
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;
    cursosCicloBasico.forEach(curso => {
        const datosCurso = gradesData[curso.toLowerCase()];
        if (!datosCurso) return;
        for (const alumno in datosCurso) {
            const mats = datosCurso[alumno];
            if (mats[materia]) {
                const notasMateria = mats[materia];
                if (notasMateria['Nota 1']) {
                    totalNotas++;
                    if (notasMateria['TEA 1']==='X') totalTEA++;
                    if (notasMateria['TEP 1']==='X') totalTEP++;
                    if (notasMateria['TED 1']==='X') totalTED++;
                }
                if (notasMateria['Nota 2']) {
                    totalNotas++;
                    if (notasMateria['TEA 2']==='X') totalTEA++;
                    if (notasMateria['TEP 2']==='X') totalTEP++;
                    if (notasMateria['TED 2']==='X') totalTED++;
                }
            }
        }
    });

    const tea=totalNotas?((totalTEA/totalNotas)*100).toFixed(2):'0';
    const tep=totalNotas?((totalTEP/totalNotas)*100).toFixed(2):'0';
    const ted=totalNotas?((totalTED/totalNotas)*100).toFixed(2):'0';

    mostrarPorcentajesMateria('ciclo-basico', materia, tea, tep, ted);
}

// MATERIA CICLO SUPERIOR
function calcularPorcentajesMateriaCicloSuperior(materia) {
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;

    cursosCicloSuperior.forEach(curso => {
        const datosCurso=gradesData[curso.toLowerCase()];
        if(!datosCurso) return;
        for(const alumno in datosCurso){
            const mats=datosCurso[alumno];
            if(mats[materia]){
                const notasMateria=mats[materia];
                if(notasMateria['Nota 1']){
                    totalNotas++;
                    if(notasMateria['TEA 1']==='X') totalTEA++;
                    if(notasMateria['TEP 1']==='X') totalTEP++;
                    if(notasMateria['TED 1']==='X') totalTED++;
                }
                if(notasMateria['Nota 2']){
                    totalNotas++;
                    if(notasMateria['TEA 2']==='X') totalTEA++;
                    if(notasMateria['TEP 2']==='X') totalTEP++;
                    if(notasMateria['TED 2']==='X') totalTED++;
                }
            }
        }
    });

    const tea=totalNotas?((totalTEA/totalNotas)*100).toFixed(2):'0';
    const tep=totalNotas?((totalTEP/totalNotas)*100).toFixed(2):'0';
    const ted=totalNotas?((totalTED/totalNotas)*100).toFixed(2):'0';

    mostrarPorcentajesMateria('ciclo-superior', materia, tea, tep, ted);
}

// MATERIA TODA LA ESCUELA
function calcularPorcentajesMateriaTodaEscuela(materia) {
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;

    for(const curso in gradesData){
        const datosCurso=gradesData[curso];
        for(const alumno in datosCurso){
            const mats=datosCurso[alumno];
            if(mats[materia]){
                const notasMateria=mats[materia];
                if(notasMateria['Nota 1']){
                    totalNotas++;
                    if(notasMateria['TEA 1']==='X') totalTEA++;
                    if(notasMateria['TEP 1']==='X') totalTEP++;
                    if(notasMateria['TED 1']==='X') totalTED++;
                }
                if(notasMateria['Nota 2']){
                    totalNotas++;
                    if(notasMateria['TEA 2']==='X') totalTEA++;
                    if(notasMateria['TEP 2']==='X') totalTEP++;
                    if(notasMateria['TED 2']==='X') totalTED++;
                }
            }
        }
    }

    const tea=totalNotas?((totalTEA/totalNotas)*100).toFixed(2):'0';
    const tep=totalNotas?((totalTEP/totalNotas)*100).toFixed(2):'0';
    const ted=totalNotas?((totalTED/totalNotas)*100).toFixed(2):'0';

    mostrarPorcentajesMateria('escuela', materia, tea, tep, ted);
}

// Mostrar porcentajes genérico
function mostrarPorcentajesMateria(contexto, materia, tea, tep, ted) {
    const contenedor = document.getElementById(`porcentajes-${materia.toLowerCase()}-${contexto}`);
    if(contenedor){
        contenedor.innerHTML=`
            <p class="card-text">TEA: ${tea}%</p>
            <p class="card-text">TEP: ${tep}%</p>
            <p class="card-text">TED: ${ted}%</p>
        `;
    }
}


