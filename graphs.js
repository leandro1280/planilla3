// graphs.js

document.addEventListener('DOMContentLoaded', () => {
    // Obtener los elementos
    const graficoCanvas = document.getElementById('graficoCanvas').getContext('2d');
    const tipoGraficoSelect = document.getElementById('tipoGraficoSelect');
    const tipoEstadisticaSelect = document.getElementById('tipoEstadisticaSelect');
    const cursoSelect = document.getElementById('cursoSelect');
    const seleccionCursoContainer = document.getElementById('seleccionCursoContainer');

    // Cargar los datos de gradesData desde localStorage
    const gradesData = JSON.parse(localStorage.getItem('gradesData')) || {};

    // Si no hay datos, mostrar un mensaje y detener
    if (Object.keys(gradesData).length === 0) {
        alert('No hay datos para mostrar en los gráficos.');
        return;
    }

    // Llenar el select de cursos
    llenarSelectCursos();

    // Variable para almacenar el gráfico de Chart.js
    let chart;

    // Función para actualizar el gráfico
    function actualizarGrafico() {
        const tipoGrafico = tipoGraficoSelect.value;
        const tipoEstadistica = tipoEstadisticaSelect.value;

        // Si ya hay un gráfico, destruirlo antes de crear uno nuevo
        if (chart) {
            chart.destroy();
        }

        let estadisticas;
        let tituloGrafico = '';

        if (tipoEstadistica === 'general') {
            estadisticas = calcularEstadisticasGenerales(gradesData);
            tituloGrafico = 'TEA/TEP/TED - Toda la Escuela';
            seleccionCursoContainer.style.display = 'none';
        } else if (tipoEstadistica === 'curso') {
            const cursoSeleccionado = cursoSelect.value;
            estadisticas = calcularEstadisticasPorCurso(gradesData, cursoSeleccionado);
            tituloGrafico = `TEA/TEP/TED - Curso ${cursoSeleccionado.toUpperCase()}`;
            seleccionCursoContainer.style.display = 'block';
        } else if (tipoEstadistica === 'materia') {
            estadisticas = calcularEstadisticasPorMateria(gradesData);
            tituloGrafico = 'Promedio de Notas por Materia';
            seleccionCursoContainer.style.display = 'none';
        }

        // Crear el nuevo gráfico
        chart = new Chart(graficoCanvas, {
            type: tipoGrafico,
            data: {
                labels: estadisticas.labels,
                datasets: [{
                    label: 'Porcentaje' in estadisticas ? 'Porcentaje' : 'Promedio',
                    data: estadisticas.data,
                    backgroundColor: generarColores(estadisticas.data.length),
                    borderColor: generarColores(estadisticas.data.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: tituloGrafico
                    }
                }
            }
        });
    }

    // Eventos para actualizar el gráfico cuando se cambian las opciones
    tipoGraficoSelect.addEventListener('change', actualizarGrafico);
    tipoEstadisticaSelect.addEventListener('change', () => {
        if (tipoEstadisticaSelect.value === 'curso') {
            seleccionCursoContainer.style.display = 'block';
        } else {
            seleccionCursoContainer.style.display = 'none';
        }
        actualizarGrafico();
    });
    cursoSelect.addEventListener('change', actualizarGrafico);

    // Llamar a actualizarGrafico al cargar la página
    actualizarGrafico();

    // Función para llenar el select de cursos
    function llenarSelectCursos() {
        const cursos = Object.keys(gradesData).sort();
        cursoSelect.innerHTML = cursos.map(curso => `<option value="${curso}">${curso.toUpperCase()}</option>`).join('');
    }
});

// Función para calcular las estadísticas generales
function calcularEstadisticasGenerales(gradesData) {
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
    const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : 0;
    const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : 0;
    const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : 0;

    return { labels: ['TEA', 'TEP', 'TED'], data: [porcentajeTEA, porcentajeTEP, porcentajeTED], porcentaje: true };
}

// Función para calcular las estadísticas por curso
function calcularEstadisticasPorCurso(gradesData, cursoSeleccionado) {
    const datosCurso = gradesData[cursoSeleccionado];
    if (!datosCurso) return { labels: [], data: [] };

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
    const porcentajeTEA = totalNotas ? ((totalTEA / totalNotas) * 100).toFixed(2) : 0;
    const porcentajeTEP = totalNotas ? ((totalTEP / totalNotas) * 100).toFixed(2) : 0;
    const porcentajeTED = totalNotas ? ((totalTED / totalNotas) * 100).toFixed(2) : 0;

    return { labels: ['TEA', 'TEP', 'TED'], data: [porcentajeTEA, porcentajeTEP, porcentajeTED], porcentaje: true };
}

// Función para calcular estadísticas por materia
function calcularEstadisticasPorMateria(gradesData) {
    const materiasSet = new Set();
    const totalesPorMateria = {};
    const notasPorMateria = {};

    // Obtener todas las materias y inicializar contadores
    for (const curso in gradesData) {
        const datosCurso = gradesData[curso];
        for (const alumno in datosCurso) {
            const materias = datosCurso[alumno];
            for (const materia in materias) {
                materiasSet.add(materia);
                if (!totalesPorMateria[materia]) {
                    totalesPorMateria[materia] = 0;
                    notasPorMateria[materia] = 0;
                }

                const notasMateria = materias[materia];

                // Sumar notas y contar cantidad
                if (notasMateria['Nota 1']) {
                    notasPorMateria[materia]++;
                    totalesPorMateria[materia] += parseFloat(notasMateria['Nota 1']);
                }
                if (notasMateria['Nota 2']) {
                    notasPorMateria[materia]++;
                    totalesPorMateria[materia] += parseFloat(notasMateria['Nota 2']);
                }
            }
        }
    }

    // Calcular promedio por materia
    const labels = [];
    const data = [];

    materiasSet.forEach(materia => {
        const totalNotas = notasPorMateria[materia];
        const sumaNotas = totalesPorMateria[materia];
        const promedio = totalNotas ? (sumaNotas / totalNotas).toFixed(2) : 0;
        labels.push(materia);
        data.push(promedio);
    });

    return { labels, data };
}

// Función para generar colores para las gráficas
function generarColores(cantidad) {
    const coloresBase = [
        'rgba(255, 99, 132, 0.6)',   // Rojo
        'rgba(54, 162, 235, 0.6)',   // Azul
        'rgba(255, 206, 86, 0.6)',   // Amarillo
        'rgba(75, 192, 192, 0.6)',   // Verde
        'rgba(153, 102, 255, 0.6)',  // Morado
        'rgba(255, 159, 64, 0.6)',   // Naranja
    ];
    const colores = [];

    for (let i = 0; i < cantidad; i++) {
        colores.push(coloresBase[i % coloresBase.length]);
    }

    return colores;
}
