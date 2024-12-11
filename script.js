let inputCSV;
let cursoContainer;
let alumnoContainer;
let planillaContainer;
let exportarCompletaButton;
let exportarParcialButton;
let exportarExcelButton;
let limpiarAvancesButton;

// Variables globales para almacenar datos
let alumnosData = []; // Datos de los alumnos
let cursosDisponibles = []; // Cursos disponibles
let cursoSeleccionado = ''; // Curso seleccionado
let materiasPorCurso = {}; // Materias por curso
let gradesData = {}; // Objeto para almacenar notas y cruces

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
materiasPorCurso = {
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
    inputCSV = document.getElementById('inputCSV');
    cursoContainer = document.getElementById('curso-container');
    alumnoContainer = document.getElementById('alumno-container');
    planillaContainer = document.getElementById('planilla-container');
    exportarCompletaButton = document.getElementById('exportarCompleta');
    exportarParcialButton = document.getElementById('exportarParcial');
    exportarExcelButton = document.getElementById('exportarExcel');
    limpiarAvancesButton = document.getElementById('limpiarAvances');

    inputCSV.addEventListener('change', handleFileSelect);
    exportarCompletaButton.addEventListener('click', () => exportToPDF('completa'));
    exportarParcialButton.addEventListener('click', () => exportToPDF('parcial'));
    exportarExcelButton.addEventListener('click', exportToExcel);
    limpiarAvancesButton.addEventListener('click', limpiarDatos);

    cargarAvances();
    calcularPorcentajesGenerales();
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            parseCSV(e.target.result);
        };
        reader.readAsText(file);
    }
}

function parseCSV(contents) {
    const rows = contents.split('\n').map(r => r.trim()).filter(r => r);
    let dataRows = rows;
    if (rows[0].includes(';')) {
        dataRows = rows.slice(1);
    }

    const data = dataRows.map(row => {
        const cols = row.split(';').map(c => c.trim());
        if (cols.length >= 2) {
            return {
                Curso: cols[0].toLowerCase().trim(),
                Nombre: cols[1]
            };
        } else {
            return null;
        }
    }).filter(item => item !== null);

    alumnosData = data;
    cursosDisponibles = [...new Set(alumnosData.map(a => a.Curso))];

    displayCursoSelection();
}

function displayCursoSelection() {
    cursoContainer.innerHTML = '';
    const label = document.createElement('label');
    label.textContent = 'Selecciona el curso:';
    label.classList.add('form-label');

    const select = document.createElement('select');
    select.classList.add('form-select');

    if (cursosDisponibles.length === 0) {
        select.innerHTML = '<option value="">No hay cursos disponibles</option>';
        select.disabled = true;
    } else {
        select.innerHTML = cursosDisponibles.map(curso => `<option value="${curso}">${curso.toUpperCase()}</option>`).join('');
        select.disabled = false;
    }

    cursoContainer.appendChild(label);
    cursoContainer.appendChild(select);

    select.addEventListener('change', () => {
        cursoSeleccionado = select.value.toLowerCase().trim();
        const alumnosDelCurso = alumnosData.filter(a => a.Curso === cursoSeleccionado);
        displayAlumnoSelection(alumnosDelCurso);
        displayPlanilla(alumnosDelCurso);
        calcularPorcentajesGenerales();
    });

    if (cursosDisponibles.length > 0) {
        select.value = cursosDisponibles[0];
        select.dispatchEvent(new Event('change'));
    }
}

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
        calcularPorcentajesGenerales();
    });
}

function displayPlanilla(alumnos) {
    planillaContainer.innerHTML = '';

    const planilla = document.createElement('div');
    planilla.classList.add('planilla');

    const titulo = document.createElement('h3');
    titulo.textContent = cursoSeleccionado ? `Planilla de ${cursoSeleccionado.toUpperCase()}` : 'Planilla';
    planilla.appendChild(titulo);

    if (cursoSeleccionado && !materiasPorCurso[cursoSeleccionado]) {
        alert(`No hay materias definidas para el curso ${cursoSeleccionado.toUpperCase()}`);
        planillaContainer.appendChild(planilla);
        return;
    }

    if (cursoSeleccionado && materiasPorCurso[cursoSeleccionado]) {
        const tabla = document.createElement('table');
        tabla.classList.add('table', 'table-bordered', 'tabla-planilla');
        tabla.id = 'planilla-table';

        const thead = document.createElement('thead');
        thead.classList.add('table-dark');
        const encabezadoFila = document.createElement('tr');

        const columnas = ['Alumno', 'Materia', 'TEA 1', 'TEP 1', 'TED 1', 'Nota 1', 'Asistencia 1', 'TEA 2', 'TEP 2', 'TED 2', 'Nota 2', 'Asistencia 2'];

        columnas.forEach(columna => {
            const th = document.createElement('th');
            th.textContent = columna;
            encabezadoFila.appendChild(th);
        });

        thead.appendChild(encabezadoFila);
        tabla.appendChild(thead);

        const tbody = document.createElement('tbody');

        alumnos.forEach(alumno => {
            materiasPorCurso[cursoSeleccionado].forEach((materia) => {
                const fila = document.createElement('tr');
                fila.dataset.alumno = alumno.Nombre;
                fila.dataset.materia = materia.toUpperCase();

                const celdaNombre = document.createElement('td');
                const contenedorNombre = document.createElement('div');
                contenedorNombre.style.display = 'flex';
                contenedorNombre.style.alignItems = 'center';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.classList.add('form-check-input', 'checkbox-alumno');
                checkbox.checked = true;

                const nombreTexto = document.createElement('span');
                nombreTexto.textContent = ' ' + alumno.Nombre;

                contenedorNombre.appendChild(checkbox);
                contenedorNombre.appendChild(nombreTexto);

                celdaNombre.appendChild(contenedorNombre);
                celdaNombre.classList.add('celda-nombre');
                fila.appendChild(celdaNombre);

                const celdaMateria = document.createElement('td');
                celdaMateria.textContent = materia;
                celdaMateria.dataset.materia = materia.toUpperCase();
                fila.appendChild(celdaMateria);

                columnas.slice(2).forEach(columna => {
                    const celda = document.createElement('td');

                    if (columna.startsWith('TEA')) celda.classList.add('celda-tea');
                    else if (columna.startsWith('TEP')) celda.classList.add('celda-tep');
                    else if (columna.startsWith('TED')) celda.classList.add('celda-ted');

                    if (columna.startsWith('Nota')) {
                        const inputNota = document.createElement('input');
                        inputNota.type = 'number';
                        inputNota.classList.add('form-control', 'input-nota');
                        inputNota.min = 1;
                        inputNota.max = 10;
                        inputNota.dataset.tipo = columna;

                        const alumnoNombre = alumno.Nombre;
                        const materiaUpper = materia.toUpperCase();
                        if (gradesData[cursoSeleccionado] && gradesData[cursoSeleccionado][alumnoNombre] && gradesData[cursoSeleccionado][alumnoNombre][materiaUpper]) {
                            inputNota.value = gradesData[cursoSeleccionado][alumnoNombre][materiaUpper][columna] || '';
                        }

                        inputNota.addEventListener('input', () => {
                            actualizarCruces(fila, inputNota);
                            guardarAvances();
                            calcularPorcentajesGenerales();
                        });

                        celda.appendChild(inputNota);
                    }

                    fila.appendChild(celda);
                });

                if (fila.children.length !== columnas.length) {
                    console.error(`Fila mal estructurada para el alumno ${alumno.Nombre} y materia ${materia}. Esperado ${columnas.length} celdas, pero recibió ${fila.children.length}.`);
                }

                tbody.appendChild(fila);
            });
        });

        tabla.appendChild(tbody);
        planilla.appendChild(tabla);
    }

    planillaContainer.appendChild(planilla);
    cargarAvances();
}

function actualizarCruces(fila, inputNota) {
    const nota = parseInt(inputNota.value);
    const tipoNota = inputNota.dataset.tipo;

    if (isNaN(nota)) {
        limpiarCruces(fila, tipoNota);
        return;
    }

    const celdas = fila.querySelectorAll('td');
    let celdaTEA, celdaTEP, celdaTED;

    if (tipoNota === 'Nota 1') {
        celdaTEA = celdas[2];
        celdaTEP = celdas[3];
        celdaTED = celdas[4];
    } else {
        celdaTEA = celdas[7];
        celdaTEP = celdas[8];
        celdaTED = celdas[9];
    }

    if (!celdaTEA || !celdaTEP || !celdaTED) {
        console.error('No se encontraron las celdas TEA, TEP o TED en la fila.');
        return;
    }

    celdaTEA.textContent = '';
    celdaTEP.textContent = '';
    celdaTED.textContent = '';

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
    }

    const alumno = fila.dataset.alumno || 'Desconocido';
    const materia = fila.dataset.materia || 'Desconocida';

    if (!gradesData[cursoSeleccionado]) {
        gradesData[cursoSeleccionado] = {};
    }
    if (!gradesData[cursoSeleccionado][alumno]) {
        gradesData[cursoSeleccionado][alumno] = {};
    }
    if (!gradesData[cursoSeleccionado][alumno][materia]) {
        gradesData[cursoSeleccionado][alumno][materia] = {};
    }

    gradesData[cursoSeleccionado][alumno][materia][tipoNota] = nota.toString();
    gradesData[cursoSeleccionado][alumno][materia][`TEA ${tipoNota.slice(-1)}`] = (cruz === 'TEA') ? 'X' : '';
    gradesData[cursoSeleccionado][alumno][materia][`TEP ${tipoNota.slice(-1)}`] = (cruz === 'TEP') ? 'X' : '';
    gradesData[cursoSeleccionado][alumno][materia][`TED ${tipoNota.slice(-1)}`] = (cruz === 'TED') ? 'X' : '';

    guardarAvances();
    calcularPorcentajesGenerales();
}

function limpiarCruces(fila, tipoNota) {
    const celdas = fila.querySelectorAll('td');
    let celdaTEA, celdaTEP, celdaTED;

    if (tipoNota === 'Nota 1') {
        celdaTEA = celdas[2];
        celdaTEP = celdas[3];
        celdaTED = celdas[4];
    } else {
        celdaTEA = celdas[7];
        celdaTEP = celdas[8];
        celdaTED = celdas[9];
    }

    if (celdaTEA) celdaTEA.textContent = '';
    if (celdaTEP) celdaTEP.textContent = '';
    if (celdaTED) celdaTED.textContent = '';
}

function guardarAvances() {
    localStorage.setItem('gradesData', JSON.stringify(gradesData));
    console.log('Avances guardados en localStorage.');
}

function cargarAvances() {
    const datosGuardados = JSON.parse(localStorage.getItem('gradesData'));
    if (!datosGuardados) return;

    gradesData = datosGuardados;

    if (!cursoSeleccionado || !gradesData[cursoSeleccionado]) return;

    const filas = Array.from(planillaContainer.querySelectorAll('tbody tr'));

    filas.forEach(fila => {
        const alumnoNombre = fila.dataset.alumno || 'Desconocido';
        const materia = fila.dataset.materia || 'Desconocida';

        if (gradesData[cursoSeleccionado][alumnoNombre] && gradesData[cursoSeleccionado][alumnoNombre][materia]) {
            const notasGuardadas = gradesData[cursoSeleccionado][alumnoNombre][materia];
            const celdas = fila.querySelectorAll('td');

            if (celdas.length >= 12) {
                const celdaTEA1 = celdas[2];
                const celdaTEP1 = celdas[3];
                const celdaTED1 = celdas[4];
                const inputNota1 = celdas[5].querySelector('input');
                if (notasGuardadas['TEA 1']) celdaTEA1.textContent = notasGuardadas['TEA 1'];
                if (notasGuardadas['TEP 1']) celdaTEP1.textContent = notasGuardadas['TEP 1'];
                if (notasGuardadas['TED 1']) celdaTED1.textContent = notasGuardadas['TED 1'];
                if (inputNota1) inputNota1.value = notasGuardadas['Nota 1'] || '';

                const celdaTEA2 = celdas[7];
                const celdaTEP2 = celdas[8];
                const celdaTED2 = celdas[9];
                const inputNota2 = celdas[10].querySelector('input');
                if (notasGuardadas['TEA 2']) celdaTEA2.textContent = notasGuardadas['TEA 2'];
                if (notasGuardadas['TEP 2']) celdaTEP2.textContent = notasGuardadas['TEP 2'];
                if (notasGuardadas['TED 2']) celdaTED2.textContent = notasGuardadas['TED 2'];
                if (inputNota2) inputNota2.value = notasGuardadas['Nota 2'] || '';
            }
        }
    });

    console.log('Avances cargados desde localStorage.');
}

function limpiarDatos() {
    if (confirm('¿Estás seguro de que deseas limpiar todos los datos guardados? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('gradesData');
        location.reload();
    }
}

function calcularPorcentajesGenerales() {
    // Por Curso
    calcularPorcentajesPlgLitPorCurso();
    calcularPorcentajesMtmMcsPorCurso();
    calcularPorcentajesTeaTepTedPorCurso();

    // Por Ciclo Básico
    calcularPorcentajesMtmCicloBasico();
    calcularPorcentajesPlgCicloBasico();
    calcularPorcentajesTepTeaTedCicloBasico();

    // Por Ciclo Superior (MCS, LIT, TEA/TEP/TED)
    calcularPorcentajesMcsCicloSuperior();
    calcularPorcentajesLitCicloSuperior();
    calcularPorcentajesTedTeaTepCicloSuperior();

    // Toda la Escuela
    calcularPorcentajesTedTeaTepTodaEscuela();

      // BLG
      calcularPorcentajesMateriaPorCurso('BLG');
      calcularPorcentajesMateriaCicloBasico('BLG');
      calcularPorcentajesMateriaCicloSuperior('BLG');
      calcularPorcentajesMateriaTodaEscuela('BLG');
  
      // HTR
      calcularPorcentajesMateriaPorCurso('HTR');
      calcularPorcentajesMateriaCicloBasico('HTR');
      calcularPorcentajesMateriaCicloSuperior('HTR');
      calcularPorcentajesMateriaTodaEscuela('HTR');
  
      // GGF
      calcularPorcentajesMateriaPorCurso('GGF');
      calcularPorcentajesMateriaCicloBasico('GGF');
      calcularPorcentajesMateriaCicloSuperior('GGF');
      calcularPorcentajesMateriaTodaEscuela('GGF');
  
      // CCD (solo por curso y ciclo superior, sin ciclo básico ni toda la escuela)
      calcularPorcentajesMateriaPorCurso('CCD');
      calcularPorcentajesMateriaCicloSuperior('CCD');  
  }
  

// 1. PLG/LIT por Curso
function calcularPorcentajesPlgLitPorCurso() {
    // Por curso: usar gradesData[cursoSeleccionado], si no hay cursoSeleccionado o no datos, mostrar 0%
    if (!cursoSeleccionado || !gradesData[cursoSeleccionado]) {
        mostrarPorcentajesPlgLitPorCursoUI('0', '0', '0');
        return;
    }

    const datosCurso = gradesData[cursoSeleccionado];
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;

    for (const alumno in datosCurso) {
        const materias = datosCurso[alumno];
        for (const materia in materias) {
            if (materia === 'PLG' || materia === 'LIT') {
                const notasMateria = materias[materia];
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
    }

    const porcentajeTEA = totalNotas?((totalTEA/totalNotas)*100).toFixed(2):'0';
    const porcentajeTEP = totalNotas?((totalTEP/totalNotas)*100).toFixed(2):'0';
    const porcentajeTED = totalNotas?((totalTED/totalNotas)*100).toFixed(2):'0';

    mostrarPorcentajesPlgLitPorCursoUI(porcentajeTEA, porcentajeTEP, porcentajeTED);
}

function mostrarPorcentajesPlgLitPorCursoUI(tea, tep, ted) {
    const contenedor = document.getElementById('porcentajes-plg-lit-curso');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${tea}%</p>
            <p class="card-text">TEP: ${tep}%</p>
            <p class="card-text">TED: ${ted}%</p>
        `;
    }
}

// 2. MTM/MCS por Curso
function calcularPorcentajesMtmMcsPorCurso() {
    if (!cursoSeleccionado || !gradesData[cursoSeleccionado]) {
        mostrarPorcentajesMtmMcsPorCursoUI('0', '0', '0');
        return;
    }

    const datosCurso = gradesData[cursoSeleccionado];
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;

    for (const alumno in datosCurso) {
        const materias = datosCurso[alumno];
        for (const materia in materias) {
            if (materia === 'MTM' || materia === 'MCS') {
                const notasMateria = materias[materia];
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
    }

    const porcentajeTEA = totalNotas?((totalTEA/totalNotas)*100).toFixed(2):'0';
    const porcentajeTEP = totalNotas?((totalTEP/totalNotas)*100).toFixed(2):'0';
    const porcentajeTED = totalNotas?((totalTED/totalNotas)*100).toFixed(2):'0';

    mostrarPorcentajesMtmMcsPorCursoUI(porcentajeTEA, porcentajeTEP, porcentajeTED);
}

function mostrarPorcentajesMtmMcsPorCursoUI(tea, tep, ted) {
    const contenedor = document.getElementById('porcentajes-mtm-mcs-curso');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${tea}%</p>
            <p class="card-text">TEP: ${tep}%</p>
            <p class="card-text">TED: ${ted}%</p>
        `;
    }
}

// 3. MTM de Ciclo Básico
function calcularPorcentajesMtmCicloBasico() {
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;

    cursosCicloBasico.forEach(curso => {
        const datosCurso = gradesData[curso.toLowerCase()];
        if (!datosCurso) return;

        for (const alumno in datosCurso) {
            const materias = datosCurso[alumno];
            for (const materia in materias) {
                if (materia === 'MTM') {
                    const notasMateria = materias[materia];
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
        }
    });

    const porcentajeTEA = totalNotas?((totalTEA/totalNotas)*100).toFixed(2):'0';
    const porcentajeTEP = totalNotas?((totalTEP/totalNotas)*100).toFixed(2):'0';
    const porcentajeTED = totalNotas?((totalTED/totalNotas)*100).toFixed(2):'0';

    mostrarPorcentajesMtmCicloBasicoUI(porcentajeTEA, porcentajeTEP, porcentajeTED);
}

function mostrarPorcentajesMtmCicloBasicoUI(tea, tep, ted) {
    const contenedor = document.getElementById('porcentajes-mtm-ciclo-basico');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${tea}%</p>
            <p class="card-text">TEP: ${tep}%</p>
            <p class="card-text">TED: ${ted}%</p>
        `;
    }
}

// 4. PLG de Ciclo Básico
function calcularPorcentajesPlgCicloBasico() {
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;

    cursosCicloBasico.forEach(curso => {
        const datosCurso = gradesData[curso.toLowerCase()];
        if (!datosCurso) return;
        for (const alumno in datosCurso) {
            const materias = datosCurso[alumno];
            for (const materia in materias) {
                if (materia === 'PLG') {
                    const notasMateria = materias[materia];
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
        }
    });

    const porcentajeTEA = totalNotas?((totalTEA/totalNotas)*100).toFixed(2):'0';
    const porcentajeTEP = totalNotas?((totalTEP/totalNotas)*100).toFixed(2):'0';
    const porcentajeTED = totalNotas?((totalTED/totalNotas)*100).toFixed(2):'0';

    mostrarPorcentajesPlgCicloBasicoUI(porcentajeTEA, porcentajeTEP, porcentajeTED);
}

function mostrarPorcentajesPlgCicloBasicoUI(tea, tep, ted) {
    const contenedor = document.getElementById('porcentajes-plg-ciclo-basico');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${tea}%</p>
            <p class="card-text">TEP: ${tep}%</p>
            <p class="card-text">TED: ${ted}%</p>
        `;
    }
}

// 5. TEA, TEP y TED por curso
function calcularPorcentajesTeaTepTedPorCurso() {
    if (!cursoSeleccionado || !gradesData[cursoSeleccionado]) {
        mostrarPorcentajesTeaTepTedPorCursoUI('0','0','0');
        return;
    }

    const datosCurso = gradesData[cursoSeleccionado];
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;

    for (const alumno in datosCurso) {
        const materias = datosCurso[alumno];
        for (const materia in materias) {
            const notasMateria = materias[materia];
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

    const tea = totalNotas?((totalTEA/totalNotas)*100).toFixed(2):'0';
    const tep = totalNotas?((totalTEP/totalNotas)*100).toFixed(2):'0';
    const ted = totalNotas?((totalTED/totalNotas)*100).toFixed(2):'0';

    mostrarPorcentajesTeaTepTedPorCursoUI(tea, tep, ted);
}

function mostrarPorcentajesTeaTepTedPorCursoUI(tea, tep, ted) {
    const contenedor = document.getElementById('porcentajes-tea-tep-ted-curso');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${tea}%</p>
            <p class="card-text">TEP: ${tep}%</p>
            <p class="card-text">TED: ${ted}%</p>
        `;
    }
}

// 6. TEA, TEP y TED de Ciclo Básico
function calcularPorcentajesTepTeaTedCicloBasico() {
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;

    cursosCicloBasico.forEach(curso => {
        const datosCurso = gradesData[curso.toLowerCase()];
        if(!datosCurso) return;

        for(const alumno in datosCurso) {
            const materias = datosCurso[alumno];
            for(const materia in materias) {
                const notasMateria = materias[materia];
                if (notasMateria['Nota 1']) {
                    totalNotas++;
                    if(notasMateria['TEA 1']==='X') totalTEA++;
                    if(notasMateria['TEP 1']==='X') totalTEP++;
                    if(notasMateria['TED 1']==='X') totalTED++;
                }
                if (notasMateria['Nota 2']) {
                    totalNotas++;
                    if(notasMateria['TEA 2']==='X') totalTEA++;
                    if(notasMateria['TEP 2']==='X') totalTEP++;
                    if(notasMateria['TED 2']==='X') totalTED++;
                }
            }
        }
    });

    const tea = totalNotas?((totalTEA/totalNotas)*100).toFixed(2):'0';
    const tep = totalNotas?((totalTEP/totalNotas)*100).toFixed(2):'0';
    const ted = totalNotas?((totalTED/totalNotas)*100).toFixed(2):'0';

    mostrarPorcentajesTepTeaTedCicloBasicoUI(tea,tep,ted);
}

function mostrarPorcentajesTepTeaTedCicloBasicoUI(tea, tep, ted) {
    const contenedor = document.getElementById('porcentajes-tea-tep-ted-ciclo-basico');
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${tea}%</p>
            <p class="card-text">TEP: ${tep}%</p>
            <p class="card-text">TED: ${ted}%</p>
        `;
    }
}

// 7. MCS de Ciclo Superior (acumula todos los cursos del ciclo superior)
function calcularPorcentajesMcsCicloSuperior() {
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;

    cursosCicloSuperior.forEach(curso => {
        const datosCurso = gradesData[curso.toLowerCase()];
        if(!datosCurso) return;

        for(const alumno in datosCurso) {
            const materias = datosCurso[alumno];
            for(const materia in materias) {
                if (materia==='MCS') {
                    const notasMateria=materias[materia];
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
    });

    const tea=totalNotas?((totalTEA/totalNotas)*100).toFixed(2):'0';
    const tep=totalNotas?((totalTEP/totalNotas)*100).toFixed(2):'0';
    const ted=totalNotas?((totalTED/totalNotas)*100).toFixed(2):'0';

    mostrarPorcentajesMcsCicloSuperiorUI(tea,tep,ted);
}

function mostrarPorcentajesMcsCicloSuperiorUI(tea, tep, ted) {
    const contenedor = document.getElementById('porcentajes-mcs-ciclo-superior');
    if (contenedor) {
        contenedor.innerHTML=`
            <p class="card-text">TEA: ${tea}%</p>
            <p class="card-text">TEP: ${tep}%</p>
            <p class="card-text">TED: ${ted}%</p>
        `;
    }
}

// 8. LIT de Ciclo Superior
function calcularPorcentajesLitCicloSuperior() {
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;

    cursosCicloSuperior.forEach(curso => {
        const datosCurso = gradesData[curso.toLowerCase()];
        if(!datosCurso) return;

        for(const alumno in datosCurso) {
            const materias = datosCurso[alumno];
            for(const materia in materias) {
                if(materia==='LIT'){
                    const notasMateria=materias[materia];
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
    });

    const tea=totalNotas?((totalTEA/totalNotas)*100).toFixed(2):'0';
    const tep=totalNotas?((totalTEP/totalNotas)*100).toFixed(2):'0';
    const ted=totalNotas?((totalTED/totalNotas)*100).toFixed(2):'0';

    mostrarPorcentajesLitCicloSuperiorUI(tea,tep,ted);
}

function mostrarPorcentajesLitCicloSuperiorUI(tea, tep, ted) {
    const contenedor = document.getElementById('porcentajes-lit-ciclo-superior');
    if(contenedor){
        contenedor.innerHTML=`
            <p class="card-text">TEA: ${tea}%</p>
            <p class="card-text">TEP: ${tep}%</p>
            <p class="card-text">TED: ${ted}%</p>
        `;
    }
}

// 9. TEA, TEP y TED de Ciclo Superior
function calcularPorcentajesTedTeaTepCicloSuperior() {
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;

    cursosCicloSuperior.forEach(curso=>{
        const datosCurso=gradesData[curso.toLowerCase()];
        if(!datosCurso) return;

        for(const alumno in datosCurso){
            const materias=datosCurso[alumno];
            for(const materia in materias){
                const notasMateria=materias[materia];
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

    mostrarPorcentajesTedTeaTepCicloSuperiorUI(tea,tep,ted);
}

function mostrarPorcentajesTedTeaTepCicloSuperiorUI(tea, tep, ted) {
    const contenedor=document.getElementById('porcentajes-tea-tep-ted-ciclo-superior');
    if(contenedor){
        contenedor.innerHTML=`
            <p class="card-text">TEA: ${tea}%</p>
            <p class="card-text">TEP: ${tep}%</p>
            <p class="card-text">TED: ${ted}%</p>
        `;
    }
}

// 10. TEA, TEP y TED de Toda la Escuela
function calcularPorcentajesTedTeaTepTodaEscuela() {
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;

    for(const curso in gradesData){
        const datosCurso=gradesData[curso];
        for(const alumno in datosCurso){
            const materias=datosCurso[alumno];
            for(const materia in materias){
                const notasMateria=materias[materia];
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

    mostrarPorcentajesTedTeaTepTodaEscuelaUI(tea,tep,ted);
}

function mostrarPorcentajesTedTeaTepTodaEscuelaUI(tea, tep, ted) {
    const contenedor=document.getElementById('porcentajes-tea-tep-ted-escuela');
    if(contenedor){
        contenedor.innerHTML=`
            <p class="card-text">TEA: ${tea}%</p>
            <p class="card-text">TEP: ${tep}%</p>
            <p class="card-text">TED: ${ted}%</p>
        `;
    }
}

function exportToPDF(tipo) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const planilla = document.getElementById('planilla-container');
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


// Funciones genéricas para GGF y CCD
// Siguen la misma lógica utilizada con las otras materias (BLG, HTR)

// GGF (Geografía): Por curso, ciclo básico, ciclo superior, toda la escuela
function calcularPorcentajesGgfPorCurso() {
    if (!cursoSeleccionado || !gradesData[cursoSeleccionado]) {
        mostrarPorcentajesMateria('curso', 'GGF', '0', '0', '0');
        return;
    }

    const datosCurso = gradesData[cursoSeleccionado];
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;

    for (const alumno in datosCurso) {
        const mats = datosCurso[alumno];
        if (mats['GGF']) {
            const notasMateria = mats['GGF'];
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

    const tea = totalNotas?((totalTEA/totalNotas)*100).toFixed(2):'0';
    const tep = totalNotas?((totalTEP/totalNotas)*100).toFixed(2):'0';
    const ted = totalNotas?((totalTED/totalNotas)*100).toFixed(2):'0';

    mostrarPorcentajesMateria('curso', 'GGF', tea, tep, ted);
}

function calcularPorcentajesGgfCicloBasico() {
    let totalTEA=0, totalTEP=0, totalTED=0, totalNotas=0;
    cursosCicloBasico.forEach(curso => {
        const datosCurso=gradesData[curso.toLowerCase()];
        if(!datosCurso) return;
        for(const alumno in datosCurso){
            const mats=datosCurso[alumno];
            if(mats['GGF']){
                const notasMateria=mats['GGF'];
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

    mostrarPorcentajesMateria('ciclo-basico','GGF',tea,tep,ted);
}

function calcularPorcentajesGgfCicloSuperior() {
    let totalTEA=0,totalTEP=0,totalTED=0,totalNotas=0;
    cursosCicloSuperior.forEach(curso=>{
        const datosCurso=gradesData[curso.toLowerCase()];
        if(!datosCurso) return;
        for(const alumno in datosCurso){
            const mats=datosCurso[alumno];
            if(mats['GGF']){
                const notasMateria=mats['GGF'];
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

    mostrarPorcentajesMateria('ciclo-superior','GGF',tea,tep,ted);
}

function calcularPorcentajesGgfTodaEscuela() {
    let totalTEA=0,totalTEP=0,totalTED=0,totalNotas=0;

    for(const curso in gradesData){
        const datosCurso=gradesData[curso];
        for(const alumno in datosCurso){
            const mats=datosCurso[alumno];
            if(mats['GGF']){
                const notasMateria=mats['GGF'];
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

    mostrarPorcentajesMateria('escuela','GGF',tea,tep,ted);
}

// CCD (Construcción de Ciudadanía): Solo por Curso y Ciclo Superior (no ciclo básico, no toda la escuela)
function calcularPorcentajesCcdPorCurso() {
    if(!cursoSeleccionado || !gradesData[cursoSeleccionado]) {
        mostrarPorcentajesMateria('curso','CCD','0','0','0');
        return;
    }

    const datosCurso=gradesData[cursoSeleccionado];
    let totalTEA=0,totalTEP=0,totalTED=0,totalNotas=0;

    for(const alumno in datosCurso){
        const mats=datosCurso[alumno];
        if(mats['CCD']){
            const notasMateria=mats['CCD'];
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

    const tea=totalNotas?((totalTEA/totalNotas)*100).toFixed(2):'0';
    const tep=totalNotas?((totalTEP/totalNotas)*100).toFixed(2):'0';
    const ted=totalNotas?((totalTED/totalNotas)*100).toFixed(2):'0';

    mostrarPorcentajesMateria('curso','CCD',tea,tep,ted);
}

function calcularPorcentajesCcdCicloSuperior() {
    let totalTEA=0,totalTEP=0,totalTED=0,totalNotas=0;

    cursosCicloSuperior.forEach(curso=>{
        const datosCurso=gradesData[curso.toLowerCase()];
        if(!datosCurso) return;

        for(const alumno in datosCurso){
            const mats=datosCurso[alumno];
            if(mats['CCD']){
                const notasMateria=mats['CCD'];
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

    mostrarPorcentajesMateria('ciclo-superior','CCD',tea,tep,ted);
}

// Nota: No se crean funciones para CCD Ciclo Básico ni CCD Toda la Escuela, ya que no se solicitan.

// Función genérica para mostrar porcentajes (reutilizable)
function mostrarPorcentajesMateria(contexto, materia, tea, tep, ted) {
    const contenedor = document.getElementById(`porcentajes-${materia.toLowerCase()}-${contexto}`);
    if (contenedor) {
        contenedor.innerHTML = `
            <p class="card-text">TEA: ${tea}%</p>
            <p class="card-text">TEP: ${tep}%</p>
            <p class="card-text">TED: ${ted}%</p>
        `;
    }
}

