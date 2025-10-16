// ========================================
// SERVICIO PRINCIPAL DE CONFIGURACIÓN DE ESCUELAS
// ========================================

const { supabaseAdmin } = require('../config/database');
const { SCHOOL_TYPE_CONFIGS } = require('../config/school-types');
const { validateSchoolConfig, validateSpecialization, validateSubject } = require('../utils/school-validator');

/**
 * Servicio principal para configuración de escuelas
 */
class SchoolConfigService {
    
    /**
     * Configura una escuela completa
     * @param {Object} schoolData - Datos de la escuela
     * @returns {Promise<Object>} - Escuela creada
     */
    async configureSchool(schoolData) {
        try {
            const { name, schoolType, address, city, province, phone, email, website } = schoolData;
            let { code } = schoolData;
            
            // Validar datos
            const validation = validateSchoolConfig(schoolData);
            if (!validation.isValid) {
                throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
            }

            // Obtener configuración del tipo de escuela
            const typeConfig = SCHOOL_TYPE_CONFIGS[schoolType];
            if (!typeConfig) {
                throw new Error(`Tipo de escuela no válido: ${schoolType}`);
            }

            // Si no se proporciona código, generar uno automático
            if (!code || code.trim() === '') {
                // Generar código más descriptivo basado en el tipo de escuela
                const typePrefix = this.getSchoolTypePrefix(schoolType);
                const schoolNumber = this.extractSchoolNumber(name);
                const baseCode = `${typePrefix}_${schoolNumber}`;
                let newCode = baseCode;
                let counter = 1;
                
                // Buscar un código único
                while (true) {
                    const { data: checkSchool } = await supabaseAdmin
                        .from('schools')
                        .select('id')
                        .eq('code', newCode)
                        .single();
                    
                    if (!checkSchool) break;
                    
                    newCode = `${baseCode}_${counter}`;
                    counter++;
                }
                
                console.log(`🔧 Generando código de identificación: "${newCode}"`);
                schoolData.code = newCode;
                code = newCode;
            } else {
                // Verificar si el código ya existe
                const { data: existingSchool, error: checkError } = await supabaseAdmin
                    .from('schools')
                    .select('id, name, code')
                    .eq('code', code)
                    .single();

                if (checkError && checkError.code !== 'PGRST116') {
                    throw new Error(`Error verificando código: ${checkError.message}`);
                }

                if (existingSchool) {
                    // Generar código automático basado en el nombre y tipo
                    const typePrefix = this.getSchoolTypePrefix(schoolType);
                    const schoolNumber = this.extractSchoolNumber(name);
                    const baseCode = `${typePrefix}_${schoolNumber}`;
                    let newCode = baseCode;
                    let counter = 1;
                    
                    // Buscar un código único
                    while (true) {
                        const { data: checkSchool } = await supabaseAdmin
                            .from('schools')
                            .select('id')
                            .eq('code', newCode)
                            .single();
                        
                        if (!checkSchool) break;
                        
                        newCode = `${baseCode}_${counter}`;
                        counter++;
                    }
                    
                    console.log(`⚠️ Código de identificación "${code}" ya existe. Usando código automático: "${newCode}"`);
                    schoolData.code = newCode;
                    code = newCode;
                }
            }

            // Crear escuela
            const { data: school, error: schoolError } = await supabaseAdmin
                .from('schools')
                .insert({
                    name,
                    code,
                    school_type: schoolType,
                    address,
                    city,
                    province,
                    phone,
                    email,
                    website,
                    max_years: typeConfig.maxYears,
                    evaluation_system: typeConfig.evaluationSystem,
                    has_pre_reports: typeConfig.hasPreReports,
                    has_intensification: typeConfig.hasIntensification,
                    instances_per_period: typeConfig.instancesPerPeriod
                })
                .select()
                .single();

            if (schoolError) throw schoolError;

            // Asignar usuario creador como director de la escuela
            console.log(`🔗 Asignando usuario creador ${schoolData.created_by} como director de escuela ${school.id}`);
            await this.assignUserToSchool(school.id, schoolData.created_by, 'director');

            // Configurar materias básicas (opcional - el director puede configurarlas después)
            if (schoolData.auto_configure_subjects !== false) {
                await this.setupBasicSubjects(school.id, typeConfig);

                // Configurar especializaciones si las tiene
                if (typeConfig.hasSpecializations) {
                    await this.setupSpecializations(school.id, typeConfig);
                }
            }

            // Los cursos se crearán manualmente por el director
            console.log('ℹ️ Los cursos se crearán manualmente desde la interfaz de gestión');

            return school;

        } catch (error) {
            throw new Error(`Error al configurar escuela: ${error.message}`);
        }
    }

    /**
     * Asigna un usuario a una escuela
     * @param {string} schoolId - ID de la escuela
     * @param {string} userId - ID del usuario
     * @param {string} role - Rol del usuario en la escuela
     */
    async assignUserToSchool(schoolId, userId, role) {
        try {
            console.log(`🔗 Asignando usuario ${userId} como ${role} a escuela ${schoolId}`);
            
            const { data, error } = await supabaseAdmin
                .from('user_schools')
                .insert({
                    school_id: schoolId,
                    user_id: userId,
                    role: role,
                    is_active: true,
                    assigned_by: userId
                })
                .select();

            if (error) {
                console.error('❌ Error en asignación:', error);
                throw error;
            }

            console.log(`✅ Usuario asignado como ${role} de la escuela:`, data);
        } catch (error) {
            console.error('❌ Error detallado en assignUserToSchool:', error);
            throw new Error(`Error asignando usuario a escuela: ${error.message}`);
        }
    }

    /**
     * Obtiene el prefijo del tipo de escuela
     * @param {string} schoolType - Tipo de escuela
     * @returns {string} - Prefijo del código
     */
    getSchoolTypePrefix(schoolType) {
        const prefixes = {
            'primaria': 'EPR',      // Escuela Primaria
            'secundaria_comun': 'ESS', // Escuela Secundaria
            'tecnica': 'ETP',       // Escuela Técnica
            'agrotecnica': 'EAT',   // Escuela Agrotécnica
            'artistica': 'EART',    // Escuela Artística
            'adultos': 'EAD'        // Escuela de Adultos
        };
        return prefixes[schoolType] || 'ESC';
    }

    /**
     * Extrae el número de la escuela del nombre
     * @param {string} name - Nombre de la escuela
     * @returns {string} - Número extraído o código generado
     */
    extractSchoolNumber(name) {
        // Buscar patrones como "N° 54", "Nº 123", "54", "123"
        const numberMatch = name.match(/(?:N[°º]\s*)?(\d+)/i);
        if (numberMatch) {
            return numberMatch[1].padStart(3, '0'); // Rellenar con ceros: 54 -> 054
        }
        
        // Si no hay número, usar las primeras letras del nombre
        const cleanName = name.replace(/[^A-Z0-9]/gi, '').substring(0, 6);
        return cleanName || '001';
    }

    /**
     * Configura materias básicas
     * @param {string} schoolId - ID de la escuela
     * @param {Object} typeConfig - Configuración del tipo de escuela
     */
    async setupBasicSubjects(schoolId, typeConfig) {
        try {
            const subjects = typeConfig.basicSubjects.map(subject => ({
                school_id: schoolId,
                name: subject.name,
                code: subject.code,
                type: subject.type,
                category: subject.category,
                hours_per_week: subject.hours,
                start_year: Math.min(...subject.years),
                end_year: Math.max(...subject.years),
                is_active: true
            }));

            // Insertar materias una por una para manejar duplicados
            let insertedCount = 0;
            for (const subject of subjects) {
                try {
                    const { error } = await supabaseAdmin
                        .from('school_subjects')
                        .insert(subject);

                    if (error && error.code !== '23505') { // Ignorar error de duplicado
                        throw error;
                    }
                    
                    if (!error) {
                        insertedCount++;
                    }
                } catch (error) {
                    console.warn(`⚠️ Materia duplicada ignorada: ${subject.code} - ${subject.name}`);
                }
            }

            console.log(`✅ Configuradas ${insertedCount} materias básicas (${subjects.length - insertedCount} duplicadas ignoradas)`);

        } catch (error) {
            throw new Error(`Error al configurar materias básicas: ${error.message}`);
        }
    }

    /**
     * Configura especializaciones
     * @param {string} schoolId - ID de la escuela
     * @param {Object} typeConfig - Configuración del tipo de escuela
     */
    async setupSpecializations(schoolId, typeConfig) {
        try {
            for (const specialization of typeConfig.specializations) {
                // Crear especialización
                const { data: spec, error: specError } = await supabaseAdmin
                    .from('specializations')
                    .insert({
                        school_id: schoolId,
                        name: specialization.name,
                        code: specialization.code,
                        start_year: Math.min(...specialization.years),
                        end_year: Math.max(...specialization.years),
                        is_active: true
                    })
                    .select()
                    .single();

                if (specError) throw specError;

                // Crear materias de la especialización con códigos únicos
                const subjects = specialization.subjects.map(subject => ({
                    school_id: schoolId,
                    name: subject.name,
                    code: `${specialization.code}_${subject.code}`, // Hacer código único
                    type: subject.type || 'curricular',
                    category: 'especialidad',
                    hours_per_week: subject.hours,
                    start_year: Math.min(...specialization.years),
                    end_year: Math.max(...specialization.years),
                    has_groups: typeConfig.hasGroups && subject.type === 'taller',
                    max_students_per_group: subject.type === 'taller' ? 15 : null,
                    is_active: true
                }));

                // Insertar materias una por una para manejar duplicados
                for (const subject of subjects) {
                    try {
                        const { error: subjectError } = await supabaseAdmin
                            .from('school_subjects')
                            .insert(subject);

                        if (subjectError && subjectError.code !== '23505') { // Ignorar error de duplicado
                            throw subjectError;
                        }
                    } catch (error) {
                        console.warn(`⚠️ Materia duplicada ignorada: ${subject.code} - ${subject.name}`);
                    }
                }

                console.log(`✅ Configurada especialización: ${specialization.name} con ${subjects.length} materias`);
            }

        } catch (error) {
            throw new Error(`Error al configurar especializaciones: ${error.message}`);
        }
    }

    /**
     * Configura cursos básicos
     * @param {string} schoolId - ID de la escuela
     * @param {Object} typeConfig - Configuración del tipo de escuela
     */
    async setupBasicCourses(schoolId, typeConfig) {
        try {
            const courses = [];
            const currentYear = new Date().getFullYear();

            // Crear cursos básicos (1° a 3°) con múltiples turnos y divisiones
            const shifts = ['mañana', 'tarde', 'noche'];
            const divisions = ['A', 'B', 'C'];
            
            for (let year = 1; year <= Math.min(3, typeConfig.maxYears); year++) {
                for (const shift of shifts) {
                    for (const division of divisions) {
                        courses.push({
                            school_id: schoolId,
                            academic_year: currentYear,
                            year,
                            division,
                            cycle: 'basico',
                            shift,
                            max_students: 30,
                            is_active: true
                        });
                    }
                }
            }

            // Crear cursos de especialización (4° en adelante) con múltiples turnos
            if (typeConfig.hasSpecializations) {
                for (let year = 4; year <= typeConfig.maxYears; year++) {
                    typeConfig.specializations.forEach(specialization => {
                        if (specialization.years.includes(year)) {
                            for (const shift of shifts) {
                                for (const division of divisions) {
                                    courses.push({
                                        school_id: schoolId,
                                        academic_year: currentYear,
                                        year,
                                        division,
                                        cycle: 'superior',
                                        specialization_id: null, // Se asignará después
                                        shift,
                                        max_students: 25,
                                        is_active: true
                                    });
                                }
                            }
                        }
                    });
                }
            }

            // Insertar cursos uno por uno para manejar duplicados
            let insertedCount = 0;
            for (const course of courses) {
                try {
                    const { error } = await supabaseAdmin
                        .from('courses')
                        .insert(course);

                    if (error && error.code !== '23505') { // Ignorar error de duplicado
                        throw error;
                    }
                    
                    if (!error) {
                        insertedCount++;
                    }
                } catch (error) {
                    console.warn(`⚠️ Curso duplicado ignorado: ${course.year}° ${course.division} - ${course.shift}`);
                }
            }

            console.log(`✅ Configurados ${insertedCount} cursos básicos (${courses.length - insertedCount} duplicados ignorados)`);

        } catch (error) {
            throw new Error(`Error al configurar cursos básicos: ${error.message}`);
        }
    }

    /**
     * Obtiene configuración completa de una escuela
     * @param {string} schoolId - ID de la escuela
     * @returns {Promise<Object>} - Configuración completa
     */
    async getSchoolConfig(schoolId) {
        try {
            const { data: school, error: schoolError } = await supabaseAdmin
                .from('schools')
                .select('*')
                .eq('id', schoolId)
                .single();

            if (schoolError) throw schoolError;

            // Obtener materias
            const { data: subjects, error: subjectsError } = await supabaseAdmin
                .from('school_subjects')
                .select('*')
                .eq('school_id', schoolId)
                .eq('is_active', true);

            if (subjectsError) throw subjectsError;

            // Obtener especializaciones
            const { data: specializations, error: specsError } = await supabaseAdmin
                .from('specializations')
                .select('*')
                .eq('school_id', schoolId)
                .eq('is_active', true);

            if (specsError) throw specsError;

            // Obtener cursos
            const { data: courses, error: coursesError } = await supabaseAdmin
                .from('courses')
                .select('*')
                .eq('school_id', schoolId)
                .eq('is_active', true);

            if (coursesError) throw coursesError;

            return {
                school,
                subjects,
                specializations,
                courses,
                config: SCHOOL_TYPE_CONFIGS[school.school_type]
            };

        } catch (error) {
            throw new Error(`Error al obtener configuración de escuela: ${error.message}`);
        }
    }

    /**
     * Agrega una especialización personalizada
     * @param {string} schoolId - ID de la escuela
     * @param {Object} specializationData - Datos de la especialización
     * @returns {Promise<Object>} - Especialización creada
     */
    async addCustomSpecialization(schoolId, specializationData) {
        try {
            // Validar datos
            const validation = validateSpecialization(specializationData);
            if (!validation.isValid) {
                throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
            }

            const { name, code, description, startYear, endYear, subjects } = specializationData;

            // Crear especialización
            const { data: spec, error: specError } = await supabaseAdmin
                .from('specializations')
                .insert({
                    school_id: schoolId,
                    name,
                    code,
                    description,
                    start_year: startYear,
                    end_year: endYear,
                    is_active: true
                })
                .select()
                .single();

            if (specError) throw specError;

            // Crear materias si se proporcionan
            if (subjects && subjects.length > 0) {
                const subjectsData = subjects.map(subject => ({
                    school_id: schoolId,
                    name: subject.name,
                    code: subject.code,
                    type: subject.type || 'curricular',
                    category: 'especialidad',
                    hours_per_week: subject.hours,
                    start_year: startYear,
                    end_year: endYear,
                    has_groups: subject.hasGroups || false,
                    max_students_per_group: subject.maxStudentsPerGroup || null,
                    is_active: true
                }));

                const { error: subjectsError } = await supabaseAdmin
                    .from('school_subjects')
                    .insert(subjectsData);

                if (subjectsError) throw subjectsError;
            }

            return spec;

        } catch (error) {
            throw new Error(`Error al agregar especialización personalizada: ${error.message}`);
        }
    }

    /**
     * Agrega una materia personalizada
     * @param {string} schoolId - ID de la escuela
     * @param {Object} subjectData - Datos de la materia
     * @returns {Promise<Object>} - Materia creada
     */
    async addCustomSubject(schoolId, subjectData) {
        try {
            // Validar datos
            const validation = validateSubject(subjectData);
            if (!validation.isValid) {
                throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
            }

            const { name, code, type, category, hours, startYear, endYear, hasGroups, maxStudentsPerGroup } = subjectData;

            const { data: subject, error } = await supabaseAdmin
                .from('school_subjects')
                .insert({
                    school_id: schoolId,
                    name,
                    code,
                    type: type || 'curricular',
                    category: category || 'basica',
                    hours_per_week: hours,
                    start_year: startYear,
                    end_year: endYear,
                    has_groups: hasGroups || false,
                    max_students_per_group: maxStudentsPerGroup || null,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;

            return subject;

        } catch (error) {
            throw new Error(`Error al agregar materia personalizada: ${error.message}`);
        }
    }

    /**
     * Obtiene materias por año
     * @param {string} schoolId - ID de la escuela
     * @param {number} year - Año
     * @returns {Promise<Array>} - Materias del año
     */
    async getSubjectsByYear(schoolId, year) {
        try {
            const { data: subjects, error } = await supabaseAdmin
                .from('school_subjects')
                .select('*')
                .eq('school_id', schoolId)
                .eq('is_active', true)
                .lte('start_year', year)
                .gte('end_year', year);

            if (error) throw error;

            return subjects;

        } catch (error) {
            throw new Error(`Error al obtener materias por año: ${error.message}`);
        }
    }

    /**
     * Actualiza configuración de escuela
     * @param {string} schoolId - ID de la escuela
     * @param {Object} configData - Datos de configuración
     * @returns {Promise<boolean>} - True si se actualizó
     */
    async updateSchoolConfig(schoolId, configData) {
        try {
            const { error } = await supabaseAdmin
                .from('schools')
                .update({
                    evaluation_system: configData.evaluationSystem,
                    has_pre_reports: configData.hasPreReports,
                    has_intensification: configData.hasIntensification,
                    instances_per_period: configData.instancesPerPeriod,
                    updated_at: new Date().toISOString()
                })
                .eq('id', schoolId);

            if (error) throw error;

            return true;

        } catch (error) {
            throw new Error(`Error al actualizar configuración: ${error.message}`);
        }
    }
}

module.exports = new SchoolConfigService();
