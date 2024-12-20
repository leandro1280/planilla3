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
    const studentFilterContainer = document.getElementById('studentFilterContainer');
    const studentSelector = document.getElementById('studentSelector');

    let gradesData = JSON.parse(localStorage.getItem('gradesData')) || {};
    let materiasPorCurso = JSON.parse(localStorage.getItem('materiasPorCurso')) || {};

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

    function showMessage(message, type = 'info') {
        messageContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
            </div>
        `;
    }

    function clearMessage() {
        messageContainer.innerHTML = '';
    }

    function initializeDynamicSelectors() {
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
                populateCourseSelector();
            } else {
                additionalFilters.style.display = 'none';
                resetAdditionalFilters();
            }
        });

        cycleSelector.addEventListener('change', () => {
            populateCourseSelector();
            populateSubjectSelector();
        });

        noteTypeSelector.addEventListener('change', () => {
            populateSubjectSelector();
        });

        courseSelector.addEventListener('change', () => {
            populateSubjectSelector();
        });

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
            courseSelector.innerHTML += `<option value="${curso}">${curso.toUpperCase()}</option>`;
        });
    }

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

        const materiasArray = Array.from(materiasSet).sort();
        materiasArray.forEach(materia => {
            subjectSelector.innerHTML += `<option value="${materia}">${materia}</option>`;
        });
    }

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

    function resetAdditionalFilters() {
        noteTypeSelector.value = 'numerica';
        cycleSelector.value = '';
        courseSelector.innerHTML = '<option value="">-- Seleccionar --</option>';
        courseSelector.disabled = true;
        subjectSelector.innerHTML = '<option value="">-- Seleccionar --</option>';
    }

    applyFilterButton.addEventListener('click', () => {
        const selectedData = dataSelector.value;
        const noteType = noteTypeSelector.value;
        const cycle = cycleSelector.value;
        const selectedCourses = Array.from(courseSelector.selectedOptions).map(option => option.value);
        const selectedSubjects = Array.from(subjectSelector.selectedOptions).map(option => option.value);
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

        if ((selectedData !== 'alumno') && selectedSubjects.length === 0) {
            showMessage('Por favor, selecciona al menos una materia.', 'warning');
            return;
        }

        if (selectedData === 'alumno' && !selectedStudent) {
            showMessage('Por favor, selecciona un alumno.', 'warning');
            return;
        }

        const chartsContainer = document.getElementById('chartsContainer');
        chartsContainer.innerHTML = '';
        clearMessage();

        if (selectedData === 'alumno') {
            // Notas por Alumno
            if (noteType === 'tea_tep_ted') {
                showMessage('Las notas TEA/TEP/TED no son numéricas. Selecciona "Nota Numérica".', 'warning');
                return;
            }

            const alumnoNotas = getAlumnoNotas(selectedStudent);
            // Filtrar las notas por las materias seleccionadas (si se desea)
            const filteredNotas = {};
            Object.keys(alumnoNotas).forEach(clave => {
                const materiaClave = clave.split(' ')[0]; 
                if (selectedSubjects.length === 0 || selectedSubjects.includes(materiaClave)) {
                    filteredNotas[clave] = alumnoNotas[clave];
                }
            });

            if (Object.keys(filteredNotas).length === 0) {
                showMessage('No hay notas para las materias seleccionadas.', 'info');
                return;
            }

            const canvas = document.createElement('canvas');
            chartsContainer.appendChild(canvas);

            const chartLabels = Object.keys(filteredNotas);
            const chartDatasets = [{
                label: 'Nota',
                data: Object.values(filteredNotas),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                fill: true
            }];

            const chartTitle = `Notas de ${selectedStudent} en sus Materias`;
            renderChart(canvas, chartLabels, chartDatasets, chartTypeSelector.value, chartTitle);

        } else {
            // Porcentajes Generales o Por Materia (TEA/TEP/TED)
            if (noteType === 'numerica') {
                showMessage('Las notas numéricas no aplican para porcentajes TEA/TEP/TED. Selecciona TEA/TEP/TED.', 'warning');
                return;
            }

            selectedSubjects.forEach(materia => {
                const teaData = [];
                const tepData = [];
                const tedData = [];

                selectedCourses.forEach(curso => {
                    const porcentaje = calculateGeneralPercentages(curso, materia);
                    teaData.push(parseFloat(porcentaje.TEA));
                    tepData.push(parseFloat(porcentaje.TEP));
                    tedData.push(parseFloat(porcentaje.TED));
                });

                const chartLabels = selectedCourses.map(c => c.toUpperCase());
                const chartDatasets = [
                    {
                        label: 'TEA',
                        data: teaData,
                        backgroundColor: '#00BFFF' 
                    },
                    {
                        label: 'TEP',
                        data: tepData,
                        backgroundColor: '#FFA500' 
                    },
                    {
                        label: 'TED',
                        data: tedData,
                        backgroundColor: '#EE82EE'
                    }
                    
                ];

                const chartTitle = `Porcentajes Generales en ${materia} por Curso (${cycle.replace('-', ' ').toUpperCase()})`;

                const canvas = document.createElement('canvas');
                canvas.style.marginBottom = '50px';
                chartsContainer.appendChild(canvas);

                renderChart(canvas, chartLabels, chartDatasets, chartTypeSelector.value, chartTitle);
            });
        }
    });

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

    function renderChart(canvas, labels, datasets, type, title) {
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
                        suggestedMax: (type === 'radar' || type === 'line') ? 10 : 100
                    }
                }
            },
        };

        if (type === 'line' || type === 'radar') {
            config.data.datasets.forEach(dataset => {
                dataset.fill = (type === 'radar');
                if (dataset.borderColor) {
                    dataset.borderWidth = 2;
                } else {
                    const bg = dataset.backgroundColor;
                    dataset.borderColor = (Array.isArray(bg) ? bg[0] : bg).replace('0.6', '1');
                    dataset.borderWidth = 2;
                }
            });
        }

        new Chart(canvas, config);
        clearMessage();
    }

    exportChartPDFButton.addEventListener('click', () => {
        const chartsContainer = document.getElementById('chartsContainer');
        if (!chartsContainer.querySelector('canvas')) {
            showMessage('No hay gráficos para exportar.', 'warning');
            return;
        }

        // Capturar todo el contenedor con todos los gráficos
        html2canvas(chartsContainer).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            doc.save('graficos.pdf');
            showMessage('Gráficos exportados exitosamente a PDF.', 'success');
        }).catch(error => {
            console.error('Error al exportar a PDF:', error);
            showMessage('Hubo un error al exportar los gráficos a PDF.', 'danger');
        });
    });

    // Inicializar los selectores al cargar
    initializeDynamicSelectors();
});

