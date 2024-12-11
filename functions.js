// functions.js

// Función para exportar la planilla completa o parcial a PDF
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
    });
}

// Función para exportar la planilla a Excel
function exportToExcel() {
    const table = document.getElementById('planilla-table');
    if (!table) {
        alert('No hay una planilla para exportar.');
        return;
    }

    const workbook = XLSX.utils.table_to_book(table, { sheet: "Planilla" });
    XLSX.writeFile(workbook, 'planilla_notas.xlsx');
}


// functions.js

// (Tus funciones existentes para cálculos y exportaciones van aquí)

// Función para exportar todo a Excel
function exportarTodoExcel() {
    if (!window.gradesData || Object.keys(window.gradesData).length === 0) {
        alert('No hay datos para exportar.');
        return;
    }

    const workbook = XLSX.utils.book_new();

    // Iterar sobre cada curso y crear una hoja
    for (const curso in window.gradesData) {
        const datosCurso = window.gradesData[curso];
        const ws_data = [];

        // Encabezados
        const encabezados = ['Alumno', 'Materia', 'TEA 1', 'TEP 1', 'TED 1', 'Nota 1', 'Asistencia 1', 'TEA 2', 'TEP 2', 'TED 2', 'Nota 2', 'Asistencia 2'];
        ws_data.push(encabezados);

        // Datos
        for (const alumno in datosCurso) {
            const materias = datosCurso[alumno];
            for (const materia in materias) {
                const notasMateria = materias[materia];
                const fila = [
                    alumno,
                    materia,
                    notasMateria['TEA 1'] || '',
                    notasMateria['TEP 1'] || '',
                    notasMateria['TED 1'] || '',
                    notasMateria['Nota 1'] || '',
                    notasMateria['Asistencia 1'] || '',
                    notasMateria['TEA 2'] || '',
                    notasMateria['TEP 2'] || '',
                    notasMateria['TED 2'] || '',
                    notasMateria['Nota 2'] || '',
                    notasMateria['Asistencia 2'] || '',
                ];
                ws_data.push(fila);
            }
        }

        // Crear hoja y agregarla al workbook
        const worksheet = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(workbook, worksheet, curso.toUpperCase());
    }

    // Guardar el archivo Excel
    XLSX.writeFile(workbook, 'planilla_completa.xlsx');
}

// Asegúrate de que esta función esté accesible desde script.js
window.exportarTodoExcel = exportarTodoExcel;
