document.addEventListener('DOMContentLoaded', () => {
    // Obtener referencias a los elementos del DOM
    const tipoGraficoSelect = document.getElementById('tipoGraficoSelect');
    const cicloSelect = document.getElementById('cicloSelect');
    const cursoSelect = document.getElementById('cursoSelect');
    const alumnoSelect = document.getElementById('alumnoSelect');
    const materiaSelect = document.getElementById('materiaSelect');

    const seleccionCicloContainer = document.getElementById('seleccionCicloContainer');
    const seleccionCursoContainer = document.getElementById('seleccionCursoContainer');
    const seleccionAlumnoContainer = document.getElementById('seleccionAlumnoContainer');
    const seleccionMateriaContainer = document.getElementById('seleccionMateriaContainer');

    const exportarPDFButton = document.getElementById('exportarPDFButton');
    const graficosContainer = document.getElementById('graficosContainer');

    // Variable para almacenar los gráficos actuales
    let charts = [];

    // Cargar gradesData desde localStorage
    const gradesData = JSON.parse(localStorage.getItem('gradesData')) || {};

    // Verificar si hay datos
    if (Object.keys(gradesData).length === 0) {
        alert('No hay datos para mostrar en los gráficos.');
        return;
    }

    // Definir los ciclos y cursos por ciclo (debe coincidir con script.js)
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

    // Definición de materias por curso (debe coincidir con script.js)
    const materiasPorCurso = {
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

    function getDistinctColor(etiqueta) {
        const colores = {
            'TEA': 'rgba(255, 99, 132, 0.6)',      // Rojo
            'TEP': 'rgba(54, 162, 235, 0.6)',      // Azul
            'TED': 'rgba(75, 192, 192, 0.6)',      // Verde
            'Notas': 'rgba(255, 206, 86, 0.6)'     // Amarillo (para gráficos de notas)
        };
        return colores[etiqueta] || 'rgba(153, 102, 255, 0.6)'; // Morado por defecto
    }

    // Inicializar los selectores
    inicializarSelectores();

    // Event Listeners
    tipoGraficoSelect.addEventListener('change', actualizarInterfaz);
    cicloSelect.addEventListener('change', actualizarSelectCursos);
    cursoSelect.addEventListener('change', actualizarSelectAlumnosYMaterias);
    alumnoSelect.addEventListener('change', actualizarGrafico);
    materiaSelect.addEventListener('change', actualizarGrafico);
    exportarPDFButton.addEventListener('click', exportarGraficoPDF);

    // Función para inicializar los selectores de tipo de gráfico
    function inicializarSelectores() {
        actualizarInterfaz();
    }

    // Función para actualizar la interfaz según el tipo de gráfico seleccionado
    function actualizarInterfaz() {
        const tipoGrafico = tipoGraficoSelect.value;

        // Resetear todos los contenedores
        seleccionCicloContainer.style.display = 'none';
        seleccionCursoContainer.style.display = 'none';
        seleccionAlumnoContainer.style.display = 'none';
        seleccionMateriaContainer.style.display = 'none';

        // Mostrar u ocultar selectores según el tipo de gráfico
        if (tipoGrafico === 'ciclo') {
            seleccionCicloContainer.style.display = 'block';
            cicloSelect.dispatchEvent(new Event('change')); // Trigger para mostrar cursos
        } else if (tipoGrafico === 'curso') {
            seleccionCicloContainer.style.display = 'block';
            seleccionCursoContainer.style.display = 'block';
            cicloSelect.dispatchEvent(new Event('change')); // Trigger para actualizar cursos
        } else if (tipoGrafico === 'alumno') {
            seleccionCicloContainer.style.display = 'block';
            seleccionCursoContainer.style.display = 'block';
            seleccionAlumnoContainer.style.display = 'block';
            cicloSelect.dispatchEvent(new Event('change')); // Trigger para actualizar cursos
        } else if (tipoGrafico === 'materia') {
            seleccionCicloContainer.style.display = 'block';
            seleccionCursoContainer.style.display = 'block';
            seleccionMateriaContainer.style.display = 'block';
            cicloSelect.dispatchEvent(new Event('change')); // Trigger para actualizar cursos
        } else if (tipoGrafico === 'general' || tipoGrafico === 'nota-alumno' || tipoGrafico === 'nota-materia') {
            // Para gráficos generales o de notas, mostrar selectores según necesidad
            if (tipoGrafico === 'nota-alumno') {
                seleccionCicloContainer.style.display = 'block';
                seleccionCursoContainer.style.display = 'block';
                seleccionAlumnoContainer.style.display = 'block';
            } else if (tipoGrafico === 'nota-materia') {
                seleccionCicloContainer.style.display = 'block';
                seleccionCursoContainer.style.display = 'block';
                seleccionMateriaContainer.style.display = 'block';
            }
            cicloSelect.dispatchEvent(new Event('change')); // Trigger para actualizar cursos
        }

        actualizarGrafico();
    }

    // Función para actualizar el selector de cursos según el ciclo seleccionado
    function actualizarSelectCursos() {
        const cicloSeleccionado = cicloSelect.value;
        let cursosFiltrados = [];

        if (cicloSeleccionado === 'ciclo-basico') {
            cursosFiltrados = cursosCicloBasico;
        } else if (cicloSeleccionado === 'ciclo-superior') {
            cursosFiltrados = cursosCicloSuperior;
        } else if (cicloSeleccionado === 'escuela') {
            cursosFiltrados = Object.keys(gradesData).map(curso => formatearCurso(curso));
        }

        // Limpiar y llenar el selector de cursos
        cursoSelect.innerHTML = '';
        if (cursosFiltrados.length === 0) {
            cursoSelect.innerHTML = '<option value="">No hay cursos disponibles</option>';
            cursoSelect.disabled = true;
        } else {
            cursoSelect.disabled = false;
            cursosFiltrados.forEach(curso => {
                cursoSelect.innerHTML += `<option value="${curso}">${curso.toUpperCase()}</option>`;
            });
            cursoSelect.value = cursosFiltrados[0];
            cursoSelect.dispatchEvent(new Event('change'));
        }
    }

    // Función para actualizar los selectores de alumnos y materias según el curso seleccionado
    function actualizarSelectAlumnosYMaterias() {
        const cicloSeleccionado = cicloSelect.value;
        const cursoSeleccionado = cursoSelect.value;

        if (!cursoSeleccionado) {
            alumnoSelect.innerHTML = '<option value="">No hay curso seleccionado</option>';
            materiaSelect.innerHTML = '<option value="">No hay curso seleccionado</option>';
            return;
        }

        const datosCurso = gradesData[cursoSeleccionado.toLowerCase()] || {};

        // Actualizar selector de alumnos
        const alumnos = Object.keys(datosCurso).sort();
        alumnoSelect.innerHTML = '<option value="">Todos los alumnos</option>';
        alumnos.forEach(alumno => {
            alumnoSelect.innerHTML += `<option value="${alumno}">${alumno}</option>`;
        });

        // Actualizar selector de materias
        const materias = materiasPorCurso[cursoSeleccionado] || [];
        materiaSelect.innerHTML = '<option value="">Selecciona una materia</option>';
        materias.forEach(materia => {
            materiaSelect.innerHTML += `<option value="${materia}">${materia.toUpperCase()}</option>`;
        });

        actualizarGrafico();
    }

    // Función para actualizar el gráfico basado en las selecciones actuales
    function actualizarGrafico() {
        const tipoGrafico = tipoGraficoSelect.value;
        const cicloSeleccionado = cicloSelect.value;
        const cursoSeleccionado = cursoSelect.value;
        const alumnoSeleccionado = alumnoSelect.value;
        const materiaSeleccionada = materiaSelect.value;

        // Limpiar los gráficos anteriores
        limpiarGraficos();

        // Calcular y crear gráficos según el tipo seleccionado
        if (tipoGrafico === 'general') {
            crearGraficoGeneral();
        } else if (tipoGrafico === 'ciclo') {
            crearGraficoPorCiclo(cicloSeleccionado);
        } else if (tipoGrafico === 'curso') {
            crearGraficoPorCurso(cursoSeleccionado);
        } else if (tipoGrafico === 'alumno') {
            crearGraficoPorAlumno(cicloSeleccionado, cursoSeleccionado, alumnoSeleccionado);
        } else if (tipoGrafico === 'materia') {
            crearGraficoPorMateria(cicloSeleccionado, cursoSeleccionado, materiaSeleccionada);
        } else if (tipoGrafico === 'nota-alumno') {
            crearGraficoNotasAlumno(cicloSeleccionado, cursoSeleccionado, alumnoSeleccionado);
        } else if (tipoGrafico === 'nota-materia') {
            crearGraficoNotasMateria(cicloSeleccionado, cursoSeleccionado, materiaSeleccionada);
        }
    }

    // Función para limpiar todos los gráficos anteriores
    function limpiarGraficos() {
        charts.forEach(chartInstance => {
            chartInstance.destroy();
        });
        charts = [];
        graficosContainer.innerHTML = '';
    }

    // Función para crear gráfico general (Toda la Escuela)
    function crearGraficoGeneral() {
        const datos = calcularPorcentajesTedTeaTepTodaEscuela();
        const titulo = 'TEA/TEP/TED - Toda la Escuela';
        const labels = datos.labels;
        const data = datos.data;

        crearChartCanvas(titulo, labels, data, ['TEA', 'TEP', 'TED'], 'bar');
        
    }

    // Función para crear gráfico por ciclo
    function crearGraficoPorCiclo(ciclo) {
        const datos = calcularPorcentajesTedTeaTepCiclo(ciclo);
        const titulo = `TEA/TEP/TED - ${formatearCicloTitulo(ciclo)}`;
        const labels = datos.labels;
        const data = datos.data;

        crearChartCanvas(titulo, labels, data, ['TEA', 'TEP', 'TED'], 'bar');
    }

    // Función para crear gráfico por curso
    function crearGraficoPorCurso(curso) {
        const datos = calcularPorcentajesTedTeaTepPorCurso(curso);
        const titulo = `TEA/TEP/TED - Curso ${curso.toUpperCase()}`;
        const labels = datos.labels;
        const data = datos.data;

        crearChartCanvas(titulo, labels, data, ['TEA', 'TEP', 'TED'], 'bar');
    }

    // Función para crear gráfico por alumno
    function crearGraficoPorAlumno(ciclo, curso, alumno) {
        const datos = calcularPorcentajesTedTeaTepPorAlumno(ciclo, curso, alumno);
        const titulo = alumno ? `TEA/TEP/TED - Alumno ${alumno} - Curso ${curso.toUpperCase()}` : 'TEA/TEP/TED - Todos los Alumnos';
        const labels = datos.labels;
        const data = datos.data;

        crearChartCanvas(titulo, labels, data, ['TEA', 'TEP', 'TED'], 'bar');
    }

    // Función para crear gráfico por materia
    function crearGraficoPorMateria(ciclo, curso, materia) {
        if (!materia) {
            alert('Por favor, selecciona una materia.');
            return;
        }
        const datos = calcularPorcentajesMateria(ciclo, curso, materia);
        const titulo = `TEA/TEP/TED - Materia ${materia.toUpperCase()} - Curso ${curso.toUpperCase()}`;
        const labels = datos.labels;
        const data = datos.data;

        crearChartCanvas(titulo, labels, data, ['TEA', 'TEP', 'TED'], 'bar');
    }

    // Función para crear gráfico de Notas Numéricas por Alumno
    function crearGraficoNotasAlumno(ciclo, curso, alumno) {
        const datos = calcularNotasNumericasAlumno(ciclo, curso, alumno);
        if (datos.labels.length === 0) {
            alert('No hay notas disponibles para el alumno seleccionado.');
            return;
        }
        const titulo = alumno ? `Notas Numéricas - Alumno ${alumno}` : 'Notas Numéricas - Todos los Alumnos';
        const labels = datos.labels;
        const data = datos.data;

        crearChartCanvas(titulo, labels, data, ['Notas'], 'line');
    }

    // Función para crear gráfico de Notas Numéricas por Materia
    function crearGraficoNotasMateria(ciclo, curso, materia) {
        if (!materia) {
            alert('Por favor, selecciona una materia.');
            return;
        }
        const datos = calcularNotasNumericasMateria(ciclo, curso, materia);
        if (datos.labels.length === 0) {
            alert('No hay notas disponibles para la materia seleccionada.');
            return;
        }
        const titulo = `Notas Numéricas - Materia ${materia.toUpperCase()}`;
        const labels = datos.labels;
        const data = datos.data;

        crearChartCanvas(titulo, labels, data, ['Notas'], 'line');
    }

   function crearChartCanvas(titulo, labels, data, etiquetas, tipo = 'bar') {
    // Crear un contenedor para el gráfico
    const contenedor = document.createElement('div');
    contenedor.classList.add('chart-container');

    // Crear un título para el gráfico
    const tituloGrafico = document.createElement('h3');
    tituloGrafico.textContent = titulo;
    contenedor.appendChild(tituloGrafico);

    // Crear el canvas
    const canvas = document.createElement('canvas');
    contenedor.appendChild(canvas);
    graficosContainer.appendChild(contenedor);

    // Determinar si es un gráfico de notas numéricas para ajustar la escala
    const esGraficoNota = tipo === 'line' && etiquetas.includes('Notas');

    // Crear el gráfico utilizando Chart.js
    const chart = new Chart(canvas.getContext('2d'), {
        type: tipo,
        data: {
            labels: labels,
            datasets: etiquetas.map((etiqueta) => ({
                label: etiqueta,
                data: data[0], // Ajusta según la estructura de tus datos
                backgroundColor: getDistinctColor(etiqueta),
                borderColor: getDistinctColor(etiqueta),
                borderWidth: 1,
                fill: tipo === 'line' ? false : true
            }))
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: titulo
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: esGraficoNota ? 10 : 100 // Escala de 1-10 para notas, 0-100 para porcentajes
                }
            }
        }
    });

    // Almacenar el gráfico para posible destrucción futura
    charts.push(chart);
}


    // Función para generar colores
    function generarColor(index) {
        const colores = [
            'rgba(255, 99, 132, 0.6)',   // Rojo
            'rgba(54, 162, 235, 0.6)',   // Azul
            'rgba(255, 206, 86, 0.6)',   // Amarillo
            'rgba(75, 192, 192, 0.6)',   // Verde
            'rgba(153, 102, 255, 0.6)',  // Morado
            'rgba(255, 159, 64, 0.6)',   // Naranja
            'rgba(199, 199, 199, 0.6)',  // Gris
            'rgba(83, 102, 255, 0.6)',   // Azul Claro
            'rgba(255, 99, 71, 0.6)',    // Tomate
            'rgba(60, 179, 113, 0.6)'    // Verde Medio
        ];
        return colores[index % colores.length];
    }

    // Función para exportar todos los gráficos a un solo PDF
    async function exportarGraficoPDF() {
        if (charts.length === 0) {
            alert('No hay gráficos para exportar.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });

        for (let i = 0; i < graficosContainer.children.length; i++) {
            const contenedor = graficosContainer.children[i];
            const canvas = contenedor.querySelector('canvas');
            const titulo = contenedor.querySelector('h3').textContent;

            await html2canvas(contenedor).then(canvasImg => {
                const imgData = canvasImg.toDataURL('image/png');
                const imgWidth = pdf.internal.pageSize.getWidth() - 40;
                const imgHeight = (canvasImg.height * imgWidth) / canvasImg.width;

                if (i > 0) {
                    pdf.addPage();
                }

                pdf.setFontSize(16);
                pdf.text(titulo, 20, 30);
                pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
            }).catch(error => {
                console.error('Error al capturar el gráfico:', error);
                alert('Hubo un error al exportar a PDF. Por favor, intenta nuevamente.');
            });
        }

        pdf.save('graficos.pdf');
    }

    // Funciones para calcular porcentajes (copiando lógica de script.js)

    // 1. Porcentajes TEA, TEP y TED de Toda la Escuela
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

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 2. Porcentajes TEA, TEP y TED por Ciclo
    function calcularPorcentajesTedTeaTepCiclo(ciclo) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        let cursosFiltrados = [];
        if (ciclo === 'ciclo-basico') {
            cursosFiltrados = cursosCicloBasico;
        } else if (ciclo === 'ciclo-superior') {
            cursosFiltrados = cursosCicloSuperior;
        }

        cursosFiltrados.forEach(curso => {
            const datosCurso = gradesData[curso.toLowerCase()];
            if (!datosCurso) return;

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
        });

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 3. Porcentajes TEA, TEP y TED por Curso
    function calcularPorcentajesTedTeaTepPorCurso(curso) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        const datosCurso = gradesData[curso.toLowerCase()];
        if (!datosCurso) {
            return { labels: ['TEA', 'TEP', 'TED'], data: [['0', '0', '0']] };
        }

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

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 4. Porcentajes TEA, TEP y TED por Alumno
    function calcularPorcentajesTedTeaTepPorAlumno(ciclo, curso, alumno) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        const datosCurso = gradesData[curso.toLowerCase()];
        if (!datosCurso || !datosCurso[alumno]) {
            return { labels: ['TEA', 'TEP', 'TED'], data: [['0', '0', '0']] };
        }

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

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 5. Porcentajes TEA, TEP y TED por Materia
    function calcularPorcentajesMateria(ciclo, curso, materia) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        let cursosFiltrados = [];
        if (ciclo === 'ciclo-basico') {
            cursosFiltrados = cursosCicloBasico;
        } else if (ciclo === 'ciclo-superior') {
            cursosFiltrados = cursosCicloSuperior;
        } else if (ciclo === 'escuela') {
            cursosFiltrados = Object.keys(gradesData).map(cursoItem => formatearCurso(cursoItem));
        }

        cursosFiltrados.forEach(cursoItem => {
            const datosCurso = gradesData[cursoItem.toLowerCase()];
            if (!datosCurso) return;

            for (const alumno in datosCurso) {
                const materias = datosCurso[alumno];
                if (materias[materia]) {
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
        });

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 6. Porcentajes TEA, TEP y TED para Toda la Escuela en Materia específica
    function calcularPorcentajesMateriaTodaEscuela(materia) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        for (const curso in gradesData) {
            const datosCurso = gradesData[curso];
            for (const alumno in datosCurso) {
                const materias = datosCurso[alumno];
                if (materias[materia]) {
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

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // Función para formatear el nombre del curso (mantener mayúsculas y minúsculas correctas)
    function formatearCurso(curso) {
        // Asumiendo que los cursos en gradesData están en minúsculas, convertirlos a como están en materiasPorCurso
        for (const key in materiasPorCurso) {
            if (key.toLowerCase() === curso.toLowerCase()) {
                return key;
            }
        }
        return curso;
    }

    // Función para formatear el título del ciclo
    function formatearCicloTitulo(ciclo) {
        if (ciclo === 'ciclo-basico') return 'Básico';
        if (ciclo === 'ciclo-superior') return 'Superior';
        if (ciclo === 'escuela') return 'Toda la Escuela';
        return '';
    }

    // Funciones para calcular Notas Numéricas por Alumno
    function calcularNotasNumericasAlumno(ciclo, curso, alumno) {
        let notas = [];
        let labels = [];

        let datosFiltrados = {};

        if (ciclo === 'escuela') {
            datosFiltrados = gradesData;
        } else {
            const cursosFiltrados = ciclo === 'ciclo-basico' ? cursosCicloBasico : cursosCicloSuperior;
            cursosFiltrados.forEach(cursoItem => {
                const datosCurso = gradesData[cursoItem.toLowerCase()];
                if (datosCurso) {
                    datosFiltrados[cursoItem.toLowerCase()] = datosCurso;
                }
            });
        }

        if (curso && datosFiltrados[curso.toLowerCase()]) {
            const datosCurso = datosFiltrados[curso.toLowerCase()];
            if (alumno) {
                if (datosCurso[alumno]) {
                    const materias = datosCurso[alumno];
                    for (const materiaKey in materias) {
                        const notasMateria = materias[materiaKey];
                        if (notasMateria['Nota 1']) {
                            notas.push(parseFloat(notasMateria['Nota 1']));
                            labels.push(`Nota 1 - ${materiaKey.toUpperCase()}`);
                        }
                        if (notasMateria['Nota 2']) {
                            notas.push(parseFloat(notasMateria['Nota 2']));
                            labels.push(`Nota 2 - ${materiaKey.toUpperCase()}`);
                        }
                    }
                }
            } else {
                // Todos los alumnos
                for (const alumnoKey in datosCurso) {
                    const materias = datosCurso[alumnoKey];
                    for (const materiaKey in materias) {
                        const notasMateria = materias[materiaKey];
                        if (notasMateria['Nota 1']) {
                            notas.push(parseFloat(notasMateria['Nota 1']));
                            labels.push(`Nota 1 - ${materiaKey.toUpperCase()}`);
                        }
                        if (notasMateria['Nota 2']) {
                            notas.push(parseFloat(notasMateria['Nota 2']));
                            labels.push(`Nota 2 - ${materiaKey.toUpperCase()}`);
                        }
                    }
                }
            }
        }

        return { labels: labels, data: [notas] };
    }

    // Funciones para calcular Notas Numéricas por Materia
    function calcularNotasNumericasMateria(ciclo, curso, materia) {
        let notas = [];
        let labels = [];

        let datosFiltrados = {};

        if (ciclo === 'escuela') {
            datosFiltrados = gradesData;
        } else {
            const cursosFiltrados = ciclo === 'ciclo-basico' ? cursosCicloBasico : cursosCicloSuperior;
            cursosFiltrados.forEach(cursoItem => {
                const datosCurso = gradesData[cursoItem.toLowerCase()];
                if (datosCurso) {
                    datosFiltrados[cursoItem.toLowerCase()] = datosCurso;
                }
            });
        }

        if (curso && datosFiltrados[curso.toLowerCase()]) {
            const datosCurso = datosFiltrados[curso.toLowerCase()];
            for (const alumno in datosCurso) {
                const materias = datosCurso[alumno];
                if (materias[materia]) {
                    const notasMateria = materias[materia];
                    if (notasMateria['Nota 1']) {
                        notas.push(parseFloat(notasMateria['Nota 1']));
                        labels.push(`Nota 1 - ${alumno}`);
                    }
                    if (notasMateria['Nota 2']) {
                        notas.push(parseFloat(notasMateria['Nota 2']));
                        labels.push(`Nota 2 - ${alumno}`);
                    }
                }
            }
        }

        return { labels: labels, data: [notas] };
    }

    // Función para crear y agregar un gráfico de Chart.js al contenedor
    function crearChartCanvas(titulo, labels, data, etiquetas, tipo = 'bar') {
        // Crear un contenedor para el gráfico
        const contenedor = document.createElement('div');
        contenedor.classList.add('chart-container');

        // Crear un título para el gráfico
        const tituloGrafico = document.createElement('h3');
        tituloGrafico.textContent = titulo;
        contenedor.appendChild(tituloGrafico);

        // Crear el canvas
        const canvas = document.createElement('canvas');
        contenedor.appendChild(canvas);
        graficosContainer.appendChild(contenedor);

        // Determinar si es un gráfico de notas numéricas para ajustar la escala
        const esGraficoNota = tipo === 'line' && etiquetas.includes('Notas');

        // Crear el gráfico utilizando Chart.js
        const chart = new Chart(canvas.getContext('2d'), {
            type: tipo,
            data: {
                labels: labels,
                datasets: etiquetas.map((etiqueta, index) => ({
                    label: etiqueta,
                    data: data[index],
                    backgroundColor: generarColor(index),
                    borderColor: generarColor(index),
                    borderWidth: 1,
                    fill: tipo === 'line' ? false : true
                }))
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: titulo
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: esGraficoNota ? 10 : 100 // Escala de 1-10 para notas, 0-100 para porcentajes
                    }
                }
            }
        });

        // Almacenar el gráfico para posible destrucción futura
        charts.push(chart);
    }

    // Función para generar colores
    function generarColor(index) {
        const colores = [
            'rgba(255, 99, 132, 0.6)',   // Rojo
            'rgba(54, 162, 235, 0.6)',   // Azul
            'rgba(255, 206, 86, 0.6)',   // Amarillo
            'rgba(75, 192, 192, 0.6)',   // Verde
            'rgba(153, 102, 255, 0.6)',  // Morado
            'rgba(255, 159, 64, 0.6)',   // Naranja
            'rgba(199, 199, 199, 0.6)',  // Gris
            'rgba(83, 102, 255, 0.6)',   // Azul Claro
            'rgba(255, 99, 71, 0.6)',    // Tomate
            'rgba(60, 179, 113, 0.6)'    // Verde Medio
        ];
        return colores[index % colores.length];
    }

    // Función para exportar todos los gráficos a un solo PDF
    async function exportarGraficoPDF() {
        if (charts.length === 0) {
            alert('No hay gráficos para exportar.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });

        for (let i = 0; i < graficosContainer.children.length; i++) {
            const contenedor = graficosContainer.children[i];
            const canvas = contenedor.querySelector('canvas');
            const titulo = contenedor.querySelector('h3').textContent;

            await html2canvas(contenedor).then(canvasImg => {
                const imgData = canvasImg.toDataURL('image/png');
                const imgWidth = pdf.internal.pageSize.getWidth() - 40;
                const imgHeight = (canvasImg.height * imgWidth) / canvasImg.width;

                if (i > 0) {
                    pdf.addPage();
                }

                pdf.setFontSize(16);
                pdf.text(titulo, 20, 30);
                pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
            }).catch(error => {
                console.error('Error al capturar el gráfico:', error);
                alert('Hubo un error al exportar a PDF. Por favor, intenta nuevamente.');
            });
        }

        pdf.save('graficos.pdf');
    }

    // Funciones para calcular porcentajes (copiando lógica de script.js)

    // 1. Porcentajes TEA, TEP y TED de Toda la Escuela
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

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 2. Porcentajes TEA, TEP y TED por Ciclo
    function calcularPorcentajesTedTeaTepCiclo(ciclo) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        let cursosFiltrados = [];
        if (ciclo === 'ciclo-basico') {
            cursosFiltrados = cursosCicloBasico;
        } else if (ciclo === 'ciclo-superior') {
            cursosFiltrados = cursosCicloSuperior;
        }

        cursosFiltrados.forEach(curso => {
            const datosCurso = gradesData[curso.toLowerCase()];
            if (!datosCurso) return;

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
        });

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 3. Porcentajes TEA, TEP y TED por Curso
    function calcularPorcentajesTedTeaTepPorCurso(curso) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        const datosCurso = gradesData[curso.toLowerCase()];
        if (!datosCurso) {
            return { labels: ['TEA', 'TEP', 'TED'], data: [['0', '0', '0']] };
        }

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

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 4. Porcentajes TEA, TEP y TED por Alumno
    function calcularPorcentajesTedTeaTepPorAlumno(ciclo, curso, alumno) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        const datosCurso = gradesData[curso.toLowerCase()];
        if (!datosCurso || !datosCurso[alumno]) {
            return { labels: ['TEA', 'TEP', 'TED'], data: [['0', '0', '0']] };
        }

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

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 5. Porcentajes TEA, TEP y TED por Materia
    function calcularPorcentajesMateria(ciclo, curso, materia) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        let cursosFiltrados = [];
        if (ciclo === 'ciclo-basico') {
            cursosFiltrados = cursosCicloBasico;
        } else if (ciclo === 'ciclo-superior') {
            cursosFiltrados = cursosCicloSuperior;
        } else if (ciclo === 'escuela') {
            cursosFiltrados = Object.keys(gradesData).map(cursoItem => formatearCurso(cursoItem));
        }

        cursosFiltrados.forEach(cursoItem => {
            const datosCurso = gradesData[cursoItem.toLowerCase()];
            if (!datosCurso) return;

            for (const alumno in datosCurso) {
                const materias = datosCurso[alumno];
                if (materias[materia]) {
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
        });

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 6. Porcentajes TEA, TEP y TED para Toda la Escuela en Materia específica
    function calcularPorcentajesMateriaTodaEscuela(materia) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        for (const curso in gradesData) {
            const datosCurso = gradesData[curso];
            for (const alumno in datosCurso) {
                const materias = datosCurso[alumno];
                if (materias[materia]) {
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

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // Función para calcular Notas Numéricas por Alumno
    function calcularNotasNumericasAlumno(ciclo, curso, alumno) {
        let notas = [];
        let labels = [];

        let datosFiltrados = {};

        if (ciclo === 'escuela') {
            datosFiltrados = gradesData;
        } else {
            const cursosFiltrados = ciclo === 'ciclo-basico' ? cursosCicloBasico : cursosCicloSuperior;
            cursosFiltrados.forEach(cursoItem => {
                const datosCurso = gradesData[cursoItem.toLowerCase()];
                if (datosCurso) {
                    datosFiltrados[cursoItem.toLowerCase()] = datosCurso;
                }
            });
        }

        if (curso && datosFiltrados[curso.toLowerCase()]) {
            const datosCurso = datosFiltrados[curso.toLowerCase()];
            if (alumno) {
                if (datosCurso[alumno]) {
                    const materias = datosCurso[alumno];
                    for (const materiaKey in materias) {
                        const notasMateria = materias[materiaKey];
                        if (notasMateria['Nota 1']) {
                            notas.push(parseFloat(notasMateria['Nota 1']));
                            labels.push(`Nota 1 - ${materiaKey.toUpperCase()}`);
                        }
                        if (notasMateria['Nota 2']) {
                            notas.push(parseFloat(notasMateria['Nota 2']));
                            labels.push(`Nota 2 - ${materiaKey.toUpperCase()}`);
                        }
                    }
                }
            } else {
                // Todos los alumnos
                for (const alumnoKey in datosCurso) {
                    const materias = datosCurso[alumnoKey];
                    for (const materiaKey in materias) {
                        const notasMateria = materias[materiaKey];
                        if (notasMateria['Nota 1']) {
                            notas.push(parseFloat(notasMateria['Nota 1']));
                            labels.push(`Nota 1 - ${materiaKey.toUpperCase()}`);
                        }
                        if (notasMateria['Nota 2']) {
                            notas.push(parseFloat(notasMateria['Nota 2']));
                            labels.push(`Nota 2 - ${materiaKey.toUpperCase()}`);
                        }
                    }
                }
            }
        }

        return { labels: labels, data: [notas] };
    }

    // Funciones para calcular Notas Numéricas por Materia
    function calcularNotasNumericasMateria(ciclo, curso, materia) {
        let notas = [];
        let labels = [];

        let datosFiltrados = {};

        if (ciclo === 'escuela') {
            datosFiltrados = gradesData;
        } else {
            const cursosFiltrados = ciclo === 'ciclo-basico' ? cursosCicloBasico : cursosCicloSuperior;
            cursosFiltrados.forEach(cursoItem => {
                const datosCurso = gradesData[cursoItem.toLowerCase()];
                if (datosCurso) {
                    datosFiltrados[cursoItem.toLowerCase()] = datosCurso;
                }
            });
        }

        if (curso && datosFiltrados[curso.toLowerCase()]) {
            const datosCurso = datosFiltrados[curso.toLowerCase()];
            for (const alumno in datosCurso) {
                const materias = datosCurso[alumno];
                if (materias[materia]) {
                    const notasMateria = materias[materia];
                    if (notasMateria['Nota 1']) {
                        notas.push(parseFloat(notasMateria['Nota 1']));
                        labels.push(`Nota 1 - ${alumno}`);
                    }
                    if (notasMateria['Nota 2']) {
                        notas.push(parseFloat(notasMateria['Nota 2']));
                        labels.push(`Nota 2 - ${alumno}`);
                    }
                }
            }
        }

        return { labels: labels, data: [notas] };
    }

    // Función para crear y agregar un gráfico de Chart.js al contenedor
    function crearChartCanvas(titulo, labels, data, etiquetas, tipo = 'bar') {
        // Crear un contenedor para el gráfico
        const contenedor = document.createElement('div');
        contenedor.classList.add('chart-container');

        // Crear un título para el gráfico
        const tituloGrafico = document.createElement('h3');
        tituloGrafico.textContent = titulo;
        contenedor.appendChild(tituloGrafico);

        // Crear el canvas
        const canvas = document.createElement('canvas');
        contenedor.appendChild(canvas);
        graficosContainer.appendChild(contenedor);

        // Determinar si es un gráfico de notas numéricas para ajustar la escala
        const esGraficoNota = tipo === 'line' && etiquetas.includes('Notas');

        // Crear el gráfico utilizando Chart.js
        const chart = new Chart(canvas.getContext('2d'), {
            type: tipo,
            data: {
                labels: labels,
                datasets: etiquetas.map((etiqueta, index) => ({
                    label: etiqueta,
                    data: data[index],
                    backgroundColor: generarColor(index),
                    borderColor: generarColor(index),
                    borderWidth: 1,
                    fill: tipo === 'line' ? false : true
                }))
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: titulo
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: esGraficoNota ? 10 : 100 // Escala de 1-10 para notas, 0-100 para porcentajes
                    }
                }
            }
        });

        // Almacenar el gráfico para posible destrucción futura
        charts.push(chart);
    }

    // Función para generar colores
    function generarColor(index) {
        const colores = [
            'rgba(255, 99, 132, 0.6)',   // Rojo
            'rgba(54, 162, 235, 0.6)',   // Azul
            'rgba(255, 206, 86, 0.6)',   // Amarillo
            'rgba(75, 192, 192, 0.6)',   // Verde
            'rgba(153, 102, 255, 0.6)',  // Morado
            'rgba(255, 159, 64, 0.6)',   // Naranja
            'rgba(199, 199, 199, 0.6)',  // Gris
            'rgba(83, 102, 255, 0.6)',   // Azul Claro
            'rgba(255, 99, 71, 0.6)',    // Tomate
            'rgba(60, 179, 113, 0.6)'    // Verde Medio
        ];
        return colores[index % colores.length];
    }

    // Función para exportar todos los gráficos a un solo PDF
    async function exportarGraficoPDF() {
        if (charts.length === 0) {
            alert('No hay gráficos para exportar.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });

        for (let i = 0; i < graficosContainer.children.length; i++) {
            const contenedor = graficosContainer.children[i];
            const canvas = contenedor.querySelector('canvas');
            const titulo = contenedor.querySelector('h3').textContent;

            await html2canvas(contenedor).then(canvasImg => {
                const imgData = canvasImg.toDataURL('image/png');
                const imgWidth = pdf.internal.pageSize.getWidth() - 40;
                const imgHeight = (canvasImg.height * imgWidth) / canvasImg.width;

                if (i > 0) {
                    pdf.addPage();
                }

                pdf.setFontSize(16);
                pdf.text(titulo, 20, 30);
                pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
            }).catch(error => {
                console.error('Error al capturar el gráfico:', error);
                alert('Hubo un error al exportar a PDF. Por favor, intenta nuevamente.');
            });
        }

        pdf.save('graficos.pdf');
    }

    // Funciones para calcular porcentajes (copiando lógica de script.js)

    // 1. Porcentajes TEA, TEP y TED de Toda la Escuela
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

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 2. Porcentajes TEA, TEP y TED por Ciclo
    function calcularPorcentajesTedTeaTepCiclo(ciclo) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        let cursosFiltrados = [];
        if (ciclo === 'ciclo-basico') {
            cursosFiltrados = cursosCicloBasico;
        } else if (ciclo === 'ciclo-superior') {
            cursosFiltrados = cursosCicloSuperior;
        }

        cursosFiltrados.forEach(curso => {
            const datosCurso = gradesData[curso.toLowerCase()];
            if (!datosCurso) return;

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
        });

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 3. Porcentajes TEA, TEP y TED por Curso
    function calcularPorcentajesTedTeaTepPorCurso(curso) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        const datosCurso = gradesData[curso.toLowerCase()];
        if (!datosCurso) {
            return { labels: ['TEA', 'TEP', 'TED'], data: [['0', '0', '0']] };
        }

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

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 4. Porcentajes TEA, TEP y TED por Alumno
    function calcularPorcentajesTedTeaTepPorAlumno(ciclo, curso, alumno) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        const datosCurso = gradesData[curso.toLowerCase()];
        if (!datosCurso || !datosCurso[alumno]) {
            return { labels: ['TEA', 'TEP', 'TED'], data: [['0', '0', '0']] };
        }

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

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 5. Porcentajes TEA, TEP y TED por Materia
    function calcularPorcentajesMateria(ciclo, curso, materia) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        let cursosFiltrados = [];
        if (ciclo === 'ciclo-basico') {
            cursosFiltrados = cursosCicloBasico;
        } else if (ciclo === 'ciclo-superior') {
            cursosFiltrados = cursosCicloSuperior;
        } else if (ciclo === 'escuela') {
            cursosFiltrados = Object.keys(gradesData).map(cursoItem => formatearCurso(cursoItem));
        }

        cursosFiltrados.forEach(cursoItem => {
            const datosCurso = gradesData[cursoItem.toLowerCase()];
            if (!datosCurso) return;

            for (const alumno in datosCurso) {
                const materias = datosCurso[alumno];
                if (materias[materia]) {
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
        });

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

    // 6. Porcentajes TEA, TEP y TED para Toda la Escuela en Materia específica
    function calcularPorcentajesMateriaTodaEscuela(materia) {
        let totalTEA = 0;
        let totalTEP = 0;
        let totalTED = 0;
        let totalNotas = 0;

        for (const curso in gradesData) {
            const datosCurso = gradesData[curso];
            for (const alumno in datosCurso) {
                const materias = datosCurso[alumno];
                if (materias[materia]) {
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

        const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : '0';
        const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : '0';

        return { labels: ['TEA', 'TEP', 'TED'], data: [[porcentajeTEA, porcentajeTEP, porcentajeTED]] };
    }

});
