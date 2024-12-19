// graphs.js

document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const dataSelector = document.getElementById('dataSelector');
    const chartTypeSelector = document.getElementById('chartTypeSelector');
    const renderChartButton = document.getElementById('renderChartButton');
    const additionalFilters = document.getElementById('additionalFilters');
    const noteTypeSelector = document.getElementById('noteTypeSelector');
    const cycleSelector = document.getElementById('cycleSelector');
    const courseSelector = document.getElementById('courseSelector');
    const subjectSelector = document.getElementById('subjectSelector');
    const applyFilterButton = document.getElementById('applyFilterButton');
    const exportChartPDFButton = document.getElementById('exportChartPDFButton');
    const messageContainer = document.getElementById('messageContainer');
    const myChartCanvas = document.getElementById('myChart');
    const studentFilterContainer = document.getElementById('studentFilterContainer');
    const studentSelector = document.getElementById('studentSelector');

    let currentChart = null;

    // Cargar datos de localStorage
    let gradesData = JSON.parse(localStorage.getItem('gradesData')) || {};
    let materiasPorCurso = JSON.parse(localStorage.getItem('materiasPorCurso')) || {};

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

    // Definición de materias por curso (si no están ya definidas en localStorage)
    if (Object.keys(materiasPorCurso).length === 0) {
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
        localStorage.setItem('materiasPorCurso', JSON.stringify(materiasPorCurso));
    }

    // Función para mostrar mensajes
    function showMessage(message, type = 'info') {
        messageContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
            </div>
        `;
    }

    // Función para limpiar mensajes
    function clearMessage() {
        messageContainer.innerHTML = '';
    }

    // Inicializar Selectores Dinámicos
    function initializeDynamicSelectors() {
        // Mostrar u ocultar el contenedor de filtro de alumno según la selección de datos
        dataSelector.addEventListener('change', () => {
            const selectedData = dataSelector.value;
            if (selectedData === 'alumno') {
                studentFilterContainer.style.display = 'block';
                populateStudentSelector();
            } else {
                studentFilterContainer.style.display = 'none';
                studentSelector.innerHTML = '<option value="">-- Seleccionar --</option>';
            }

            if (selectedData) {
                additionalFilters.style.display = 'block';
                populateCourseSelector(); // Actualizar cursos según ciclo seleccionado
            } else {
                additionalFilters.style.display = 'none';
                resetAdditionalFilters();
            }
        });

        // Manejar la selección del ciclo para actualizar los cursos disponibles
        cycleSelector.addEventListener('change', () => {
            populateCourseSelector();
            populateSubjectSelector();
        });

        // Manejar la selección de tipo de nota para ajustar el selector de materias
        noteTypeSelector.addEventListener('change', () => {
            populateSubjectSelector();
        });

        // Manejar la selección de cursos para actualizar las materias disponibles
        courseSelector.addEventListener('change', () => {
            populateSubjectSelector();
        });

        // Manejar la selección de datos a graficar para ajustar los filtros
        dataSelector.addEventListener('change', () => {
            const selectedData = dataSelector.value;
            if (selectedData === 'alumno') {
                studentFilterContainer.style.display = 'block';
                populateStudentSelector();
            } else {
                studentFilterContainer.style.display = 'none';
                studentSelector.innerHTML = '<option value="">-- Seleccionar --</option>';
            }
        });
    }

    // Función para llenar el selector de cursos
    function populateCourseSelector() {
        courseSelector.innerHTML = '';
        const selectedCycle = cycleSelector.value;

        if (!selectedCycle) {
            courseSelector.innerHTML = '<option value="">-- Seleccionar Ciclo Primero --</option>';
            courseSelector.disabled = true;
            return;
        }

        const cursos = selectedCycle === 'ciclo-basico' ? cursosCicloBasico : cursosCicloSuperior;
        const cursosDisponibles = cursos.filter(curso => materiasPorCurso[curso]);

        if (cursosDisponibles.length === 0) {
            courseSelector.innerHTML = '<option value="">No hay cursos disponibles para el ciclo seleccionado</option>';
            courseSelector.disabled = true;
            return;
        }

        courseSelector.disabled = false;

        cursosDisponibles.forEach(curso => {
            const cursoKey = curso.toLowerCase();
            courseSelector.innerHTML += `<option value="${curso}">${curso.toUpperCase()}</option>`;
        });
    }

    // Función para llenar el selector de materias
    function populateSubjectSelector() {
        subjectSelector.innerHTML = '<option value="">-- Seleccionar --</option>';
        const selectedCycle = cycleSelector.value;
        const selectedCourses = Array.from(courseSelector.selectedOptions).map(option => option.value);

        if (!selectedCycle || selectedCourses.length === 0) {
            return;
        }

        let materiasSet = new Set();

        selectedCourses.forEach(curso => {
            const materias = materiasPorCurso[curso] || [];
            materias.forEach(materia => {
                materiasSet.add(materia.toUpperCase());
            });
        });

        // Convertir a array y ordenar
        const materiasArray = Array.from(materiasSet).sort();

        materiasArray.forEach(materia => {
            subjectSelector.innerHTML += `<option value="${materia}">${materia}</option>`;
        });
    }

    // Función para llenar el selector de alumnos
    function populateStudentSelector() {
        studentSelector.innerHTML = '<option value="">-- Seleccionar --</option>';
        let todosAlumnos = new Set();

        for (const curso in gradesData) {
            for (const alumno in gradesData[curso]) {
                todosAlumnos.add(alumno);
            }
        }

        const alumnosArray = Array.from(todosAlumnos).sort();

        alumnosArray.forEach(alumno => {
            studentSelector.innerHTML += `<option value="${alumno}">${alumno}</option>`;
        });
    }

    // Función para resetear los filtros adicionales
    function resetAdditionalFilters() {
        noteTypeSelector.value = 'numerica';
        cycleSelector.value = '';
        courseSelector.innerHTML = '<option value="">-- Seleccionar --</option>';
        courseSelector.disabled = true;
        subjectSelector.innerHTML = '<option value="">-- Seleccionar --</option>';
    }

    // Manejar el botón para aplicar los filtros y generar el gráfico
    applyFilterButton.addEventListener('click', () => {
        const selectedData = dataSelector.value;
        const noteType = noteTypeSelector.value;
        const cycle = cycleSelector.value;
        const selectedCourses = Array.from(courseSelector.selectedOptions).map(option => option.value);
        const subject = subjectSelector.value;
        const selectedStudent = studentSelector.value;

        // Validaciones
        if (!selectedData) {
            showMessage('Por favor, selecciona los datos a graficar.', 'warning');
            return;
        }

        if ((selectedData !== 'alumno') && !cycle) {
            showMessage('Por favor, selecciona un ciclo.', 'warning');
            return;
        }

        if ((selectedData !== 'alumno') && selectedCourses.length === 0) {
            showMessage('Por favor, selecciona al menos un curso.', 'warning');
            return;
        }

        if ((selectedData !== 'alumno') && !subject) {
            showMessage('Por favor, selecciona una materia.', 'warning');
            return;
        }

        if (selectedData === 'alumno' && !selectedStudent) {
            showMessage('Por favor, selecciona un alumno.', 'warning');
            return;
        }

        // Procesar y obtener los datos para el gráfico
        let chartLabels = [];
        let chartDatasets = [];
        let chartTitle = '';

        if (selectedData === 'general') {
            // Porcentajes Generales
            if (noteType === 'numerica') {
                showMessage('Las notas numéricas no están disponibles para porcentajes generales. Selecciona TEA/TEP/TED.', 'warning');
                return;
            }

            if (cycle === 'ciclo-basico' || cycle === 'ciclo-superior') {
                selectedCourses.forEach(curso => {
                    const porcentaje = calculateGeneralPercentages(curso, subject);
                    chartDatasets.push({
                        label: curso.toUpperCase(),
                        data: [porcentaje.TEA, porcentaje.TEP, porcentaje.TED],
                        backgroundColor: generateColors(3)
                    });
                });

                chartLabels = ['TEA', 'TEP', 'TED'];
                chartTitle = `Porcentajes Generales en ${subject} por Curso (${cycle.replace('-', ' ').toUpperCase()})`;
            }
        } else if (selectedData === 'materia') {
            // Porcentajes por Materia
            if (noteType === 'numerica') {
                showMessage('Las notas numéricas no están disponibles para porcentajes por materia. Selecciona TEA/TEP/TED.', 'warning');
                return;
            }

            selectedCourses.forEach(curso => {
                const porcentaje = calculateGeneralPercentages(curso, subject);
                chartDatasets.push({
                    label: curso.toUpperCase(),
                    data: [porcentaje.TEA, porcentaje.TEP, porcentaje.TED],
                    backgroundColor: generateColors(3)
                });
            });

            chartLabels = ['TEA', 'TEP', 'TED'];
            chartTitle = `Porcentajes en ${subject} por Curso (${cycle.replace('-', ' ').toUpperCase()})`;
        } else if (selectedData === 'alumno') {
            // Notas por Alumno
            if (noteType === 'tea_tep_ted') {
                showMessage('Las notas TEA/TEP/TED no son numéricas. Selecciona "Nota Numérica" para este tipo de datos.', 'warning');
                return;
            }

            const alumnoNotas = getAlumnoNotas(selectedStudent);
            chartLabels = Object.keys(alumnoNotas);
            chartDatasets.push({
                label: 'Nota',
                data: Object.values(alumnoNotas),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                fill: true
            });

            chartTitle = `Notas de ${selectedStudent} en sus Materias`;
        }

        // Verificar si hay datos para graficar
        if ((selectedData !== 'alumno') && chartDatasets.length === 0) {
            showMessage('No hay datos para mostrar en el gráfico seleccionado.', 'info');
            return;
        }

        // Renderizar el gráfico
        renderChart(chartLabels, chartDatasets, chartTypeSelector.value, chartTitle);
    });

    // Función para calcular porcentajes generales
    function calculateGeneralPercentages(curso, materia) {
        let totalTEA = 0, totalTEP = 0, totalTED = 0, totalNotas = 0;
        const cursoKey = curso.toLowerCase();

        if (!gradesData[cursoKey]) return { TEA: 0, TEP: 0, TED: 0 };

        const datosCurso = gradesData[cursoKey];
        for (const alumno in datosCurso) {
            const materias = datosCurso[alumno];
            if (!materias[materia]) continue;

            const notasMateria = materias[materia];
            ['Nota 1', 'Nota 2'].forEach(notaKey => {
                if (notasMateria[notaKey]) {
                    totalNotas++;
                    if (notasMateria[`TEA ${notaKey.slice(-1)}`] === 'X') totalTEA++;
                    if (notasMateria[`TEP ${notaKey.slice(-1)}`] === 'X') totalTEP++;
                    if (notasMateria[`TED ${notaKey.slice(-1)}`] === 'X') totalTED++;
                }
            });
        }

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { TEA: porcentajeTEA, TEP: porcentajeTEP, TED: porcentajeTED };
    }

    // Función para obtener las notas de un alumno individual
    function getAlumnoNotas(alumno) {
        let notas = {};

        for (const curso in gradesData) {
            const datosCurso = gradesData[curso];
            if (datosCurso[alumno]) {
                const materias = datosCurso[alumno];
                for (const materia in materias) {
                    const notasMateria = materias[materia];
                    ['Nota 1', 'Nota 2'].forEach(notaKey => {
                        if (notasMateria[notaKey]) {
                            const clave = materia + (notaKey === 'Nota 1' ? ' 1' : ' 2');
                            notas[clave] = parseFloat(notasMateria[notaKey]) || 0;
                        }
                    });
                }
            }
        }

        return notas;
    }

    // Función para renderizar el gráfico
    function renderChart(labels, datasets, type, title) {
        // Limpiar el gráfico existente si hay uno
        if (currentChart) {
            currentChart.destroy();
        }

        // Configuración del gráfico
        const config = {
            type: type,
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: title
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        // Ajustar el rango de acuerdo al tipo de dato
                        suggestedMax: type === 'radar' || type === 'line' ? 10 : 100
                    }
                }
            },
        };

        // Para gráficos de línea y radar con múltiples datasets, ajustar opciones
        if (type === 'line' || type === 'radar') {
            config.data.datasets.forEach(dataset => {
                dataset.fill = type === 'radar' ? true : false;
                dataset.borderColor = dataset.backgroundColor.replace('0.6', '1');
                dataset.borderWidth = 2;
            });
        }

        // Crear el gráfico
        currentChart = new Chart(myChartCanvas, config);

        clearMessage();
    }

    // Función para generar colores aleatorios
    function generateColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const r = Math.floor(Math.random() * 255);
            const g = Math.floor(Math.random() * 255);
            const b = Math.floor(Math.random() * 255);
            colors.push(`rgba(${r}, ${g}, ${b}, 0.6)`);
        }
        return colors;
    }

    // Manejar el botón para exportar el gráfico a PDF
    exportChartPDFButton.addEventListener('click', () => {
        if (!currentChart) {
            showMessage('No hay un gráfico para exportar.', 'warning');
            return;
        }

        html2canvas(myChartCanvas).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const imgWidth = 190; // Margen de 10 unidades en cada lado
            const pageHeight = doc.internal.pageSize.height;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            doc.save('grafico.pdf');
            showMessage('Gráfico exportado exitosamente a PDF.', 'success');
        }).catch(error => {
            console.error('Error al exportar a PDF:', error);
            showMessage('Hubo un error al exportar el gráfico a PDF.', 'danger');
        });
    });

    // Inicializar Selectores Dinámicos al cargar la página
    initializeDynamicSelectors();
});
