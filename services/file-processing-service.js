// ========================================
// SERVICIO PRINCIPAL DE PROCESAMIENTO DE ARCHIVOS
// ========================================

const { supabaseAdmin } = require('../config/database');
const FileDetector = require('../utils/file-detector');
const DataExtractor = require('../utils/data-extractor');
const { PatternDetector } = require('../utils/pattern-detector');
const PROCESSING_CONFIG = require('../config/file-processing-config');

/**
 * Servicio principal para procesamiento de archivos
 */
class FileProcessingService {
    
    constructor() {
        this.fileDetector = new FileDetector();
        this.dataExtractor = new DataExtractor();
        this.patternDetector = new PatternDetector();
        this.schoolId = null;
        this.courseId = null;
        this.schoolConfig = null;
        this.detectedStructure = null;
        this.processingResults = {
            students: [],
            grades: [],
            subjects: [],
            errors: [],
            warnings: [],
            suggestions: []
        };
    }
    
    /**
     * Procesa un archivo completo
     * @param {File} file - Archivo a procesar
     * @param {string} schoolId - ID de la escuela
     * @param {string} courseId - ID del curso (opcional)
     * @returns {Promise<Object>} - Resultados del procesamiento
     */
    async processFile(file, schoolId, courseId = null) {
        try {
            this.schoolId = schoolId;
            this.courseId = courseId;
            
            // Validar archivo
            this.fileDetector.validateFile(file);
            
            // Obtener configuración de la escuela
            await this.loadSchoolConfig();
            
            // Extraer datos del archivo
            const rawData = await this.dataExtractor.extractData(file);
            
            console.log('📊 Datos extraídos:', {
                hasData: !!rawData,
                hasRows: !!(rawData && rawData.rows),
                rowsCount: rawData && rawData.rows ? rawData.rows.length : 0,
                hasHeaders: !!(rawData && rawData.headers),
                headersCount: rawData && rawData.headers ? rawData.headers.length : 0
            });
            
            // Validar datos extraídos
            const validation = this.dataExtractor.validateExtractedData(rawData);
            if (!validation.isValid) {
                throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
            }
            
            // Analizar estructura
            this.detectedStructure = await this.analyzeStructure(rawData);
            
            // Procesar datos
            await this.processData(rawData);
            
            // Validar resultados
            this.validateResults();
            
            // Generar sugerencias
            this.generateSuggestions();
            
            return {
                ...this.processingResults,
                structure: this.detectedStructure,
                statistics: this.getStatistics(),
                validation
            };
            
        } catch (error) {
            this.processingResults.errors.push({
                type: 'PROCESSING_ERROR',
                message: error.message,
                details: error.stack
            });
            throw error;
        }
    }
    
    /**
     * Carga la configuración de la escuela
     */
    async loadSchoolConfig() {
        const { data: school, error: schoolError } = await supabaseAdmin
            .from('schools')
            .select('*')
            .eq('id', this.schoolId)
            .single();

        if (schoolError || !school) {
            throw new Error('Escuela no encontrada');
        }

        // Obtener materias configuradas
        const { data: subjects, error: subjectsError } = await supabaseAdmin
            .from('school_subjects')
            .select('*')
            .eq('school_id', this.schoolId)
            .eq('is_active', true);

        if (subjectsError) {
            throw new Error('Error al cargar materias de la escuela');
        }

        this.schoolConfig = {
            school,
            subjects: subjects || []
        };
    }
    
    /**
     * Analiza la estructura del archivo
     * @param {Object} rawData - Datos extraídos
     * @returns {Object} - Estructura detectada
     */
    async analyzeStructure(rawData) {
        const structure = {
            hasHeaders: rawData.headers && rawData.headers.length > 0,
            studentColumns: [],
            gradeColumns: [],
            subjectColumns: [],
            periodColumns: [],
            evaluationColumns: [],
            dniColumns: [],
            structure: {
                type: 'unknown',
                hasGroups: false,
                hasSpecializations: false,
                evaluationSystem: 'unknown'
            }
        };

        // Analizar headers si existen
        if (structure.hasHeaders) {
            rawData.headers.forEach((header, index) => {
                const headerStr = String(header).trim();
                
                if (this.patternDetector.isStudentNameColumn(headerStr)) {
                    structure.studentColumns.push({ index, name: headerStr });
                }
                
                if (this.patternDetector.isGradeColumn(headerStr)) {
                    structure.gradeColumns.push({ index, name: headerStr });
                }
                
                if (this.patternDetector.isSubjectColumn(headerStr, this.schoolConfig.subjects)) {
                    structure.subjectColumns.push({ index, name: headerStr });
                }
                
                if (this.patternDetector.isPeriodColumn(headerStr)) {
                    structure.periodColumns.push({ index, name: headerStr });
                }
                
                if (this.patternDetector.isEvaluationColumn(headerStr)) {
                    structure.evaluationColumns.push({ index, name: headerStr });
                }
                
                if (this.patternDetector.isDNIColumn(headerStr)) {
                    structure.dniColumns.push({ index, name: headerStr });
                }
            });
        }

        // Analizar filas para detectar estudiantes
        if (rawData.rows && rawData.rows.length > 0) {
            rawData.rows.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    const cellStr = String(cell).trim();
                    
                    if (this.patternDetector.isStudentName(cellStr)) {
                        if (!structure.studentColumns.find(col => col.index === colIndex)) {
                            structure.studentColumns.push({ 
                                index: colIndex, 
                                name: `Columna ${colIndex + 1}`,
                                detected: true
                            });
                        }
                    }
                });
            });
        }

        // Determinar tipo de estructura
        structure.structure = this.determineStructureType(structure);

        return structure;
    }
    
    /**
     * Determina el tipo de estructura del archivo
     * @param {Object} structure - Estructura detectada
     * @returns {Object} - Tipo de estructura
     */
    determineStructureType(structure) {
        const hasStudents = structure.studentColumns.length > 0;
        const hasGrades = structure.gradeColumns.length > 0;
        const hasSubjects = structure.subjectColumns.length > 0;
        const hasPeriods = structure.periodColumns.length > 0;

        let type = 'unknown';
        let evaluationSystem = 'unknown';
        let hasGroups = false;
        let hasSpecializations = false;

        if (hasStudents && hasGrades) {
            if (hasPeriods) {
                const periodCount = structure.periodColumns.length;
                if (periodCount >= 2) {
                    type = 'cuatrimestral';
                    evaluationSystem = 'cuatrimestral';
                } else {
                    type = 'trimestral';
                    evaluationSystem = 'trimestral';
                }
            } else {
                type = 'anual';
                evaluationSystem = 'anual';
            }
        }

        // Detectar grupos (si hay múltiples columnas similares)
        if (structure.gradeColumns.length > 4) {
            hasGroups = true;
        }

        // Detectar especializaciones (si hay materias específicas)
        if (structure.subjectColumns.length > 10) {
            hasSpecializations = true;
        }

        return {
            type,
            evaluationSystem,
            hasGroups,
            hasSpecializations
        };
    }
    
    /**
     * Procesa los datos del archivo
     * @param {Object} rawData - Datos extraídos
     */
    async processData(rawData) {
        // Procesar estudiantes
        await this.processStudents(rawData);
        
        // Procesar notas
        await this.processGrades(rawData);
        
        // Procesar materias
        await this.processSubjects(rawData);
        
        // Guardar estudiantes en la base de datos
        await this.saveStudentsToDatabase();
    }
    
    /**
     * Procesa estudiantes del archivo
     * @param {Object} rawData - Datos extraídos
     */
    async processStudents(rawData) {
        const students = [];
        
        if (!rawData || !rawData.rows || !Array.isArray(rawData.rows)) {
            console.log('⚠️ No hay datos de filas para procesar');
            this.processingResults.students = students;
            return;
        }
        
        rawData.rows.forEach((row, rowIndex) => {
            this.detectedStructure.studentColumns.forEach(studentCol => {
                const cellValue = String(row[studentCol.index] || '').trim();
                
                if (cellValue && this.patternDetector.isStudentName(cellValue)) {
                    const student = this.patternDetector.parseStudentName(cellValue);
                    
                    // Buscar DNI en la misma fila
                    let dni = null;
                    this.detectedStructure.dniColumns.forEach(dniCol => {
                        const dniValue = String(row[dniCol.index] || '').trim();
                        if (dniValue && this.patternDetector.isDNI(dniValue)) {
                            dni = dniValue;
                        }
                    });
                    
                    students.push({
                        ...student,
                        dni,
                        row: rowIndex + 1,
                        column: studentCol.index,
                        rawData: cellValue
                    });
                }
            });
        });

        this.processingResults.students = students;
    }
    
    /**
     * Procesa notas del archivo
     * @param {Object} rawData - Datos extraídos
     */
    async processGrades(rawData) {
        const grades = [];
        
        if (!rawData || !rawData.rows || !Array.isArray(rawData.rows)) {
            console.log('⚠️ No hay datos de filas para procesar notas');
            this.processingResults.grades = grades;
            return;
        }
        
        this.detectedStructure.gradeColumns.forEach(gradeCol => {
            const columnName = gradeCol.name;
            
            rawData.rows.forEach((row, rowIndex) => {
                const cellValue = String(row[gradeCol.index] || '').trim();
                
                if (cellValue && this.isValidGrade(cellValue)) {
                    grades.push({
                        column: gradeCol.index,
                        columnName,
                        row: rowIndex + 1,
                        value: cellValue,
                        parsedValue: this.parseGrade(cellValue)
                    });
                }
            });
        });

        this.processingResults.grades = grades;
    }
    
    /**
     * Procesa materias del archivo
     * @param {Object} rawData - Datos extraídos
     */
    async processSubjects(rawData) {
        const subjects = [];
        
        this.detectedStructure.subjectColumns.forEach(subjectCol => {
            const columnName = subjectCol.name;
            
            const knownSubject = this.schoolConfig.subjects.find(subject =>
                columnName.toLowerCase().includes(subject.name.toLowerCase()) ||
                columnName.toLowerCase().includes(subject.code.toLowerCase())
            );
            
            if (knownSubject) {
                subjects.push({
                    column: subjectCol.index,
                    columnName,
                    subject: knownSubject,
                    confidence: this.calculateConfidence(columnName, knownSubject)
                });
            }
        });

        this.processingResults.subjects = subjects;
    }
    
    /**
     * Valida si un valor es una nota válida
     * @param {string} value - Valor a validar
     * @returns {boolean} - True si es válido
     */
    isValidGrade(value) {
        const numericGrade = parseFloat(value);
        const isNumeric = !isNaN(numericGrade) && numericGrade >= 1 && numericGrade <= 10;
        const isEvaluation = ['TEA', 'TEP', 'TED'].includes(value.toUpperCase());
        
        return isNumeric || isEvaluation;
    }
    
    /**
     * Parsea una nota
     * @param {string} value - Valor de la nota
     * @returns {Object} - Nota parseada
     */
    parseGrade(value) {
        const numericGrade = parseFloat(value);
        
        if (!isNaN(numericGrade)) {
            return {
                type: 'numeric',
                value: numericGrade,
                tea_tep_ted: this.calculateTeaTepTed(numericGrade)
            };
        } else {
            return {
                type: 'evaluation',
                value: value.toUpperCase(),
                tea_tep_ted: value.toUpperCase()
            };
        }
    }
    
    /**
     * Calcula TEA/TEP/TED basado en nota numérica
     * @param {number} numericGrade - Nota numérica
     * @returns {string} - TEA, TEP o TED
     */
    calculateTeaTepTed(numericGrade) {
        if (numericGrade >= 7) return 'TEA';
        if (numericGrade >= 4) return 'TEP';
        return 'TED';
    }
    
    /**
     * Calcula confianza en la detección de materia
     * @param {string} columnName - Nombre de la columna
     * @param {Object} knownSubject - Materia conocida
     * @returns {number} - Nivel de confianza (0-1)
     */
    calculateConfidence(columnName, knownSubject) {
        const nameMatch = columnName.toLowerCase().includes(knownSubject.name.toLowerCase());
        const codeMatch = columnName.toLowerCase().includes(knownSubject.code.toLowerCase());
        
        if (nameMatch && codeMatch) return 1.0;
        if (nameMatch || codeMatch) return 0.8;
        return 0.5;
    }
    
    /**
     * Valida los resultados del procesamiento
     */
    validateResults() {
        // Validar que se encontraron estudiantes
        if (this.processingResults.students.length === 0) {
            this.processingResults.errors.push({
                type: 'NO_STUDENTS_FOUND',
                message: PROCESSING_CONFIG.ERROR_MESSAGES.NO_STUDENTS_FOUND
            });
        }

        // Validar límite de estudiantes
        if (this.processingResults.students.length > PROCESSING_CONFIG.MAX_STUDENTS_PER_IMPORT) {
            this.processingResults.errors.push({
                type: 'TOO_MANY_STUDENTS',
                message: PROCESSING_CONFIG.ERROR_MESSAGES.TOO_MANY_STUDENTS
            });
        }

        // Validar que se encontraron notas
        if (this.processingResults.grades.length === 0) {
            this.processingResults.warnings.push({
                type: 'NO_GRADES_FOUND',
                message: PROCESSING_CONFIG.ERROR_MESSAGES.NO_GRADES_FOUND
            });
        }

        // Validar materias
        if (this.processingResults.subjects.length === 0) {
            this.processingResults.warnings.push({
                type: 'NO_SUBJECTS_FOUND',
                message: PROCESSING_CONFIG.ERROR_MESSAGES.NO_SUBJECTS_FOUND
            });
        }
    }
    
    /**
     * Genera sugerencias basadas en el análisis
     */
    generateSuggestions() {
        const suggestions = [];

        // Sugerir configuración de evaluación
        if (this.detectedStructure.structure.evaluationSystem !== 'unknown') {
            suggestions.push({
                type: 'EVALUATION_SYSTEM',
                message: `Se detectó sistema ${this.detectedStructure.structure.evaluationSystem}`,
                recommendation: `Configurar escuela con sistema ${this.detectedStructure.structure.evaluationSystem}`
            });
        }

        // Sugerir materias faltantes
        const detectedSubjectCodes = this.processingResults.subjects.map(s => s.subject.code);
        const missingSubjects = this.schoolConfig.subjects.filter(subject => 
            !detectedSubjectCodes.includes(subject.code)
        );

        if (missingSubjects.length > 0) {
            suggestions.push({
                type: 'MISSING_SUBJECTS',
                message: `Se detectaron ${missingSubjects.length} materias no configuradas`,
                recommendation: 'Agregar materias faltantes a la configuración de la escuela',
                subjects: missingSubjects.map(s => s.name)
            });
        }

        // Sugerir configuración de grupos
        if (this.detectedStructure.structure.hasGroups) {
            suggestions.push({
                type: 'GROUPS_DETECTED',
                message: 'Se detectó estructura de grupos',
                recommendation: 'Configurar cursos con grupos para mejor organización'
            });
        }

        this.processingResults.suggestions = suggestions;
    }
    
    /**
     * Obtiene estadísticas del procesamiento
     * @returns {Object} - Estadísticas
     */
    getStatistics() {
        return {
            totalStudents: this.processingResults.students.length,
            totalGrades: this.processingResults.grades.length,
            totalSubjects: this.processingResults.subjects.length,
            totalErrors: this.processingResults.errors.length,
            totalWarnings: this.processingResults.warnings.length,
            totalSuggestions: this.processingResults.suggestions.length,
            structure: this.detectedStructure.structure,
            confidence: this.calculateOverallConfidence()
        };
    }
    
    /**
     * Calcula la confianza general del procesamiento
     * @returns {number} - Confianza (0-1)
     */
    calculateOverallConfidence() {
        let confidence = 0;
        let factors = 0;

        if (this.processingResults.students.length > 0) {
            confidence += 0.4;
            factors++;
        }

        if (this.processingResults.grades.length > 0) {
            confidence += 0.3;
            factors++;
        }

        if (this.processingResults.subjects.length > 0) {
            confidence += 0.3;
            factors++;
        }

        return factors > 0 ? confidence / factors : 0;
    }
    
    /**
     * Guarda los estudiantes procesados en la base de datos
     */
    async saveStudentsToDatabase() {
        if (this.processingResults.students.length === 0) {
            console.log('⚠️ No hay estudiantes para guardar');
            return;
        }

        console.log(`💾 Guardando ${this.processingResults.students.length} estudiantes en la base de datos...`);

        try {
            // Preparar datos para insertar
            const studentsToInsert = this.processingResults.students.map(student => ({
                school_id: this.schoolId,
                course_id: this.courseId, // Puede ser null si no se especifica curso
                dni: student.dni || null,
                first_name: student.firstName || null,
                last_name: student.lastName || null,
                full_name: student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
                is_active: true,
                created_at: new Date().toISOString()
            }));

            // Insertar estudiantes en lotes para evitar límites de Supabase
            const batchSize = 100;
            let insertedCount = 0;

            for (let i = 0; i < studentsToInsert.length; i += batchSize) {
                const batch = studentsToInsert.slice(i, i + batchSize);
                
                const { data, error } = await supabaseAdmin
                    .from('students')
                    .insert(batch)
                    .select();

                if (error) {
                    console.error(`❌ Error insertando lote ${Math.floor(i/batchSize) + 1}:`, error);
                    throw error;
                }

                insertedCount += data.length;
                console.log(`✅ Insertados ${data.length} estudiantes (lote ${Math.floor(i/batchSize) + 1})`);
            }

            console.log(`🎉 Total de estudiantes guardados: ${insertedCount}`);
            
            // Actualizar resultados con los IDs generados
            this.processingResults.savedStudentsCount = insertedCount;
            
        } catch (error) {
            console.error('❌ Error guardando estudiantes:', error);
            this.processingResults.errors.push({
                type: 'DATABASE_SAVE_ERROR',
                message: `Error guardando estudiantes: ${error.message}`,
                details: error.stack
            });
            throw error;
        }
    }
    
    /**
     * Procesa archivo con cursos y estudiantes
     */
    async processFileWithCourses(file, schoolId) {
        console.log('📚 Procesando archivo con cursos y estudiantes');
        return await this.processFile(file, schoolId);
    }
    
    /**
     * Procesa archivo solo con estudiantes
     */
    async processFileStudentsOnly(file, schoolId, courseId = null) {
        console.log('👥 Procesando archivo solo con estudiantes');
        return await this.processFile(file, schoolId, courseId);
    }
}

module.exports = FileProcessingService;
