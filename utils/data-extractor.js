// ========================================
// EXTRACTOR DE DATOS DE ARCHIVOS
// ========================================

const XLSX = require('xlsx');
const fs = require('fs');
const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * Clase para extraer datos de diferentes tipos de archivos
 */
class DataExtractor {
    
    constructor() {
        this.supportedTypes = ['excel', 'csv', 'text'];
    }
    
    /**
     * Extrae datos de un archivo
     * @param {File} file - Archivo a procesar
     * @returns {Promise<Array>} - Datos extraídos
     */
    async extractData(file) {
        try {
            const fileType = this.detectFileType(file);
            console.log('📄 Tipo de archivo detectado:', fileType);
            
            switch (fileType) {
                case 'excel':
                    return await this.extractExcelData(file);
                case 'csv':
                    return await this.extractCSVData(file);
                case 'text':
                    return await this.extractTextData(file);
                default:
                    throw new Error(`Tipo de archivo no soportado: ${fileType}`);
            }
        } catch (error) {
            console.error('❌ Error extrayendo datos:', error);
            throw error;
        }
    }
    
    /**
     * Detecta el tipo de archivo
     * @param {File} file - Archivo a analizar
     * @returns {string} - Tipo de archivo
     */
    detectFileType(file) {
        const extension = file.originalname.toLowerCase().split('.').pop();
        
        switch (extension) {
            case 'xlsx':
            case 'xls':
                return 'excel';
            case 'csv':
                return 'csv';
            case 'txt':
                return 'text';
            case 'pdf':
                return 'pdf';
            default:
                return 'unknown';
        }
    }
    
    /**
     * Extrae datos de archivos Excel
     * @param {File} file - Archivo Excel
     * @returns {Promise<Array>} - Datos extraídos
     */
    async extractExcelData(file) {
        try {
            console.log('📊 Procesando archivo Excel...');
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            console.log(`✅ Excel procesado: ${data.length} filas`);
            
            if (data.length === 0) {
                return { headers: [], rows: [] };
            }
            
            const filteredData = data.filter(row => row.length > 0);
            const headers = filteredData[0] || [];
            const rows = filteredData.slice(1);
            
            return { 
                headers: headers,
                rows: rows 
            };
        } catch (error) {
            throw new Error(`Error procesando archivo Excel: ${error.message}`);
        }
    }
    
    /**
     * Extrae datos de archivos CSV
     * @param {File} file - Archivo CSV
     * @returns {Promise<Array>} - Datos extraídos
     */
    async extractCSVData(file) {
        return new Promise((resolve, reject) => {
            try {
                console.log('📊 Procesando archivo CSV...');
                const results = [];
                const stream = Readable.from(file.buffer.toString());
                
                stream
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', () => {
                        console.log(`✅ CSV procesado: ${results.length} filas`);
                        
                        if (results.length === 0) {
                            resolve({ headers: [], rows: [] });
                            return;
                        }
                        
                        // Extraer headers de la primera fila
                        const headers = Object.keys(results[0] || {});
                        
                        // Convertir filas a arrays
                        const rows = results.map(row => 
                            headers.map(header => row[header] || '')
                        );
                        
                        resolve({ 
                            headers: headers,
                            rows: rows 
                        });
                    })
                    .on('error', (error) => {
                        reject(new Error(`Error procesando archivo CSV: ${error.message}`));
                    });
            } catch (error) {
                reject(new Error(`Error procesando archivo CSV: ${error.message}`));
            }
        });
    }
    
    /**
     * Extrae datos de archivos de texto
     * @param {File} file - Archivo de texto
     * @returns {Promise<Array>} - Datos extraídos
     */
    async extractTextData(file) {
        try {
            console.log('📊 Procesando archivo de texto...');
            const content = file.buffer.toString('utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            console.log(`✅ Texto procesado: ${lines.length} líneas`);
            
            if (lines.length === 0) {
                return { headers: [], rows: [] };
            }
            
            const data = lines.map(line => line.split('\t').map(cell => cell.trim()));
            const headers = data[0] || [];
            const rows = data.slice(1);
            
            return { 
                headers: headers,
                rows: rows 
            };
        } catch (error) {
            throw new Error(`Error procesando archivo de texto: ${error.message}`);
        }
    }
    
    /**
     * Extrae datos de archivos PDF (básico)
     * @param {File} file - Archivo PDF
     * @returns {Promise<Array>} - Datos extraídos
     */
    async extractPDFData(file) {
        try {
            console.log('📊 Procesando archivo PDF...');
            // Por ahora, solo devolvemos un mensaje indicando que no está implementado
            throw new Error('Procesamiento de PDF no implementado aún');
        } catch (error) {
            throw new Error(`Error procesando archivo PDF: ${error.message}`);
        }
    }
    
    /**
     * Valida los datos extraídos
     * @param {Array} data - Datos extraídos
     * @returns {Object} - Resultado de la validación
     */
    validateExtractedData(data) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            stats: {
                totalRows: data.length,
                emptyRows: 0,
                validRows: 0
            }
        };

        if (!data || data.length === 0) {
            validation.isValid = false;
            validation.errors.push('No se encontraron datos en el archivo');
            return validation;
        }

        // Verificar que data sea un array
        if (!Array.isArray(data)) {
            validation.isValid = false;
            validation.errors.push('Los datos extraídos no son un array válido');
            return validation;
        }
        
        // Validar cada fila
        data.forEach((row, index) => {
            if (!Array.isArray(row) || row.length === 0) {
                validation.stats.emptyRows++;
                validation.warnings.push(`Fila ${index + 1}: Fila vacía o inválida`);
            } else {
                validation.stats.validRows++;
            }
        });

        // Verificar si hay suficientes datos válidos
        if (validation.stats.validRows < 2) {
            validation.isValid = false;
            validation.errors.push('No hay suficientes datos válidos para procesar');
        }

        return validation;
    }

    /**
     * Obtiene información básica del archivo
     * @param {File} file - Archivo a analizar
     * @returns {Object} - Información del archivo
     */
    getFileInfo(file) {
        return {
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            extension: file.originalname.split('.').pop().toLowerCase()
        };
    }
}

module.exports = DataExtractor;