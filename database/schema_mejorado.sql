-- ========================================
-- SISTEMA DE GESTIÓN DE NOTAS ESCOLARES - VERSIÓN COMERCIAL
-- ESQUEMA MEJORADO PARA SUPABASE POSTGRESQL
-- ========================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- TABLA: schools (Escuelas) - MEJORADA
-- ========================================
DROP TABLE IF EXISTS schools CASCADE;
CREATE TABLE schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) DEFAULT 'Buenos Aires' NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    website VARCHAR(255),
    school_type VARCHAR(50) NOT NULL CHECK (school_type IN (
        'primaria', 'secundaria_comun', 'tecnica', 'agrotecnica', 'artistica', 'adultos'
    )),
    -- Configuración específica por tipo de escuela
    max_years INTEGER NOT NULL DEFAULT 6, -- Primaria: 6, Secundaria: 5, Técnica: 7
    evaluation_system VARCHAR(20) DEFAULT 'cuatrimestral' CHECK (evaluation_system IN ('trimestral', 'cuatrimestral', 'bimestral')),
    has_pre_reports BOOLEAN DEFAULT true,
    has_intensification BOOLEAN DEFAULT true,
    instances_per_period INTEGER DEFAULT 4, -- Cantidad de evaluaciones por período
    academic_year_start INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ========================================
-- TABLA: users (Usuarios) - MEJORADA
-- ========================================
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'director', 'vicedirector', 'secretario', 'preceptor', 'profesor')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ========================================
-- TABLA: user_schools (Relación Usuario-Escuela) - MEJORADA
-- ========================================
DROP TABLE IF EXISTS user_schools CASCADE;
CREATE TABLE user_schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('director', 'vicedirector', 'secretario', 'preceptor', 'profesor')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(user_id, school_id)
);

-- ========================================
-- TABLA: courses (Cursos) - MEJORADA
-- ========================================
DROP TABLE IF EXISTS courses CASCADE;
CREATE TABLE courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year INTEGER NOT NULL CHECK (academic_year >= 2020),
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 7),
    division VARCHAR(10) NOT NULL,
    cycle VARCHAR(20) NOT NULL CHECK (cycle IN ('basico', 'superior')),
    specialization_id UUID REFERENCES specializations(id) ON DELETE SET NULL,
    shift VARCHAR(20) DEFAULT 'mañana' CHECK (shift IN ('mañana', 'tarde', 'vespertino', 'noche')),
    max_students INTEGER DEFAULT 30 CHECK (max_students > 0),
    classroom VARCHAR(100),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(school_id, academic_year, year, division, shift)
);

-- ========================================
-- TABLA: course_groups (Grupos dentro de cursos) - NUEVA
-- ========================================
CREATE TABLE course_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- "Grupo 1", "Grupo Programación A"
    max_students INTEGER NOT NULL DEFAULT 15,
    classroom VARCHAR(100),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ========================================
-- TABLA: specializations (Especialidades) - MEJORADA
-- ========================================
DROP TABLE IF EXISTS specializations CASCADE;
CREATE TABLE specializations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    start_year INTEGER NOT NULL DEFAULT 4, -- Año donde comienza la especialización
    end_year INTEGER NOT NULL DEFAULT 6,   -- Año donde termina
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(school_id, code)
);

-- ========================================
-- TABLA: school_subjects (Materias por Escuela) - MEJORADA
-- ========================================
DROP TABLE IF EXISTS school_subjects CASCADE;
CREATE TABLE school_subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('curricular', 'taller', 'practica', 'optativa')),
    category VARCHAR(50) DEFAULT 'basica' CHECK (category IN ('basica', 'especialidad', 'taller', 'practica', 'optativa')),
    hours_per_week INTEGER CHECK (hours_per_week > 0),
    has_groups BOOLEAN DEFAULT false, -- Si la materia se dicta en grupos
    max_students_per_group INTEGER,
    is_mandatory BOOLEAN DEFAULT true,
    start_year INTEGER DEFAULT 1, -- Año donde comienza a dictarse
    end_year INTEGER DEFAULT 6,   -- Año donde termina de dictarse
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(school_id, code)
);

-- ========================================
-- TABLA: course_subjects (Materias por Curso) - MEJORADA
-- ========================================
DROP TABLE IF EXISTS course_subjects CASCADE;
CREATE TABLE course_subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES school_subjects(id) ON DELETE CASCADE,
    group_id UUID REFERENCES course_groups(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    teacher_type VARCHAR(20) DEFAULT 'titular' CHECK (teacher_type IN ('titular', 'suplente', 'interino', 'provisional')),
    hours_per_week INTEGER CHECK (hours_per_week > 0),
    classroom VARCHAR(100),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(course_id, subject_id, group_id)
);

-- ========================================
-- TABLA: students (Estudiantes) - MEJORADA
-- ========================================
DROP TABLE IF EXISTS students CASCADE;
CREATE TABLE students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    group_id UUID REFERENCES course_groups(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    birth_date DATE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(50),
    guardian_email VARCHAR(255),
    enrollment_number VARCHAR(50),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'activo' CHECK (status IN ('activo', 'egresado', 'trasladado', 'suspendido')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(school_id, dni)
);

-- ========================================
-- TABLA: student_groups (Estudiantes en Grupos) - NUEVA
-- ========================================
CREATE TABLE student_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES course_groups(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(student_id, group_id)
);

-- ========================================
-- TABLA: grades (Calificaciones) - MEJORADA
-- ========================================
DROP TABLE IF EXISTS grades CASCADE;
CREATE TABLE grades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_subject_id UUID NOT NULL REFERENCES course_subjects(id) ON DELETE CASCADE,
    period INTEGER NOT NULL CHECK (period IN (1, 2, 3, 4)), -- Soporte para trimestres
    grade_type VARCHAR(20) NOT NULL CHECK (grade_type IN ('pre_informe', 'informe', 'recuperatorio')),
    instance INTEGER, -- 1°, 2°, 3°, 4°, 5° evaluación
    numeric_grade DECIMAL(3,1) CHECK (numeric_grade >= 1 AND numeric_grade <= 10),
    tea_tep_ted VARCHAR(3) CHECK (tea_tep_ted IN ('TEA', 'TEP', 'TED')),
    attendance_percentage DECIMAL(5,2) CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
    observations TEXT,
    is_intensification BOOLEAN DEFAULT false, -- Si es nota de intensificación
    intensification_period VARCHAR(20) CHECK (intensification_period IN ('diciembre', 'febrero', 'marzo')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(student_id, course_subject_id, period, grade_type, instance)
);

-- ========================================
-- TABLA: course_schedules (Horarios) - NUEVA
-- ========================================
CREATE TABLE course_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ========================================
-- TABLA: schedule_blocks (Bloques de horario) - NUEVA
-- ========================================
CREATE TABLE schedule_blocks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    schedule_id UUID NOT NULL REFERENCES course_schedules(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Lunes, 7=Domingo
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID NOT NULL REFERENCES school_subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES course_groups(id) ON DELETE SET NULL,
    classroom VARCHAR(100),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(schedule_id, day_of_week, start_time, group_id)
);

-- ========================================
-- TABLA: attendance_logs (Control de asistencia) - NUEVA
-- ========================================
CREATE TABLE attendance_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    schedule_block_id UUID NOT NULL REFERENCES schedule_blocks(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'presente' CHECK (status IN ('presente', 'ausente', 'justificado', 'tardanza')),
    notes TEXT,
    marked_by UUID REFERENCES users(id), -- Quien marcó la falta
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ========================================
-- TABLA: school_configurations (Configuraciones) - MEJORADA
-- ========================================
DROP TABLE IF EXISTS school_configurations CASCADE;
CREATE TABLE school_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(school_id, config_key)
);

-- ========================================
-- TABLA: data_imports (Importaciones) - MEJORADA
-- ========================================
DROP TABLE IF EXISTS data_imports CASCADE;
CREATE TABLE data_imports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    import_type VARCHAR(50) NOT NULL CHECK (import_type IN ('students', 'grades', 'subjects', 'schedules', 'mixed')),
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('csv', 'xlsx', 'xls', 'pdf')),
    total_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_details JSONB,
    imported_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMPTZ
);

-- ========================================
-- TABLA: reports (Reportes) - MEJORADA
-- ========================================
DROP TABLE IF EXISTS reports CASCADE;
CREATE TABLE reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
        'boletines', 'estadisticas', 'asistencia', 'tea_tep_ted', 
        'comparativo', 'promocion', 'rendimiento', 'especializaciones'
    )),
    parameters JSONB NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    generated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMPTZ
);

-- ========================================
-- TABLA: audit_logs (Auditoría) - NUEVA
-- ========================================
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ========================================
-- TABLA: student_promotions (Promociones) - NUEVA
-- ========================================
CREATE TABLE student_promotions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    from_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    to_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    academic_year INTEGER NOT NULL,
    promotion_status VARCHAR(20) NOT NULL CHECK (promotion_status IN ('promovido', 'no_promovido', 'condicional')),
    average_grade DECIMAL(3,1),
    failed_subjects JSONB, -- Array de materias no aprobadas
    intensification_subjects JSONB, -- Materias para intensificación
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ========================================
-- Índices existentes mejorados
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_dni ON users(dni);
CREATE INDEX idx_students_dni ON students(dni);
CREATE INDEX idx_students_course ON students(course_id);
CREATE INDEX idx_students_group ON students(group_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_period ON grades(period);
CREATE INDEX idx_grades_tea_tep_ted ON grades(tea_tep_ted);
CREATE INDEX idx_courses_school_year ON courses(school_id, academic_year);
CREATE INDEX idx_school_subjects_school ON school_subjects(school_id);
CREATE INDEX idx_schedule_blocks_day_time ON schedule_blocks(day_of_week, start_time);
CREATE INDEX idx_attendance_logs_date ON attendance_logs(date);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, created_at);

-- ========================================
-- TRIGGERS PARA updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a todas las tablas con updated_at
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_schools_updated_at BEFORE UPDATE ON user_schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_groups_updated_at BEFORE UPDATE ON course_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specializations_updated_at BEFORE UPDATE ON specializations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_subjects_updated_at BEFORE UPDATE ON school_subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_subjects_updated_at BEFORE UPDATE ON course_subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_schedules_updated_at BEFORE UPDATE ON course_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_blocks_updated_at BEFORE UPDATE ON schedule_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_configurations_updated_at BEFORE UPDATE ON school_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FUNCIÓN: Calcular TEA/TEP/TED automáticamente - MEJORADA
-- ========================================
CREATE OR REPLACE FUNCTION calculate_tea_tep_ted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numeric_grade IS NOT NULL THEN
        IF NEW.numeric_grade >= 7 THEN
            NEW.tea_tep_ted = 'TEA';
        ELSIF NEW.numeric_grade >= 4 THEN
            NEW.tea_tep_ted = 'TEP';
        ELSE
            NEW.tea_tep_ted = 'TED';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_tea_tep_ted_trigger
BEFORE INSERT OR UPDATE ON grades
FOR EACH ROW
EXECUTE FUNCTION calculate_tea_tep_ted();

-- ========================================
-- FUNCIÓN: Crear materias básicas para escuela - MEJORADA
-- ========================================
CREATE OR REPLACE FUNCTION create_basic_subjects_for_school(p_school_id UUID, p_school_type VARCHAR(50))
RETURNS void AS $$
BEGIN
    -- Materias básicas según tipo de escuela
    IF p_school_type = 'primaria' THEN
        INSERT INTO school_subjects (school_id, name, code, type, category, hours_per_week, start_year, end_year) VALUES
        (p_school_id, 'Matemática', 'MTM', 'curricular', 'basica', 4, 1, 6),
        (p_school_id, 'Prácticas del Lenguaje', 'PLG', 'curricular', 'basica', 4, 1, 6),
        (p_school_id, 'Ciencias Naturales', 'CNT', 'curricular', 'basica', 3, 1, 6),
        (p_school_id, 'Ciencias Sociales', 'CS', 'curricular', 'basica', 3, 1, 6),
        (p_school_id, 'Educación Física', 'EFC', 'curricular', 'basica', 3, 1, 6),
        (p_school_id, 'Inglés', 'IGS', 'curricular', 'basica', 2, 4, 6),
        (p_school_id, 'Artística', 'ART', 'curricular', 'basica', 2, 1, 6),
        (p_school_id, 'Construcción de Ciudadanía', 'CCD', 'curricular', 'basica', 2, 5, 6)
        ON CONFLICT (school_id, code) DO NOTHING;
        
    ELSIF p_school_type IN ('secundaria_comun', 'tecnica', 'agrotecnica') THEN
        INSERT INTO school_subjects (school_id, name, code, type, category, hours_per_week, start_year, end_year) VALUES
        (p_school_id, 'Matemática', 'MTM', 'curricular', 'basica', 4, 1, 3),
        (p_school_id, 'Prácticas del Lenguaje', 'PLG', 'curricular', 'basica', 4, 1, 3),
        (p_school_id, 'Biología', 'BLG', 'curricular', 'basica', 3, 2, 6),
        (p_school_id, 'Historia', 'HTR', 'curricular', 'basica', 3, 2, 6),
        (p_school_id, 'Geografía', 'GGF', 'curricular', 'basica', 3, 2, 6),
        (p_school_id, 'Educación Física', 'EFC', 'curricular', 'basica', 3, 1, 6),
        (p_school_id, 'Inglés', 'IGS', 'curricular', 'basica', 3, 1, 6),
        (p_school_id, 'Construcción de Ciudadanía', 'CCD', 'curricular', 'basica', 2, 4, 6),
        (p_school_id, 'Artística', 'ART', 'curricular', 'basica', 2, 1, 3),
        (p_school_id, 'Físico-Química', 'FQA', 'curricular', 'basica', 3, 2, 3),
        (p_school_id, 'Literatura', 'LIT', 'curricular', 'basica', 3, 4, 6),
        (p_school_id, 'Matemática Ciclo Superior', 'MCS', 'curricular', 'basica', 4, 4, 6)
        ON CONFLICT (school_id, code) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNCIÓN: Auditoría automática - NUEVA
-- ========================================
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), current_setting('app.current_user_id', true)::uuid);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), current_setting('app.current_user_id', true)::uuid);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), current_setting('app.current_user_id', true)::uuid);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar auditoría a tablas críticas
CREATE TRIGGER audit_grades_trigger
    AFTER INSERT OR UPDATE OR DELETE ON grades
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_students_trigger
    AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ========================================
-- FUNCIÓN: Calcular promoción de estudiantes - NUEVA
-- ========================================
CREATE OR REPLACE FUNCTION calculate_student_promotion(p_student_id UUID, p_academic_year INTEGER)
RETURNS TABLE (
    promovido BOOLEAN,
    promedio DECIMAL(3,1),
    materias_pendientes TEXT[],
    materias_intensificacion TEXT[]
) AS $$
DECLARE
    v_school_id UUID;
    v_school_type VARCHAR(50);
    v_minimum_average DECIMAL(3,1) := 6.0;
    v_max_failed_subjects INTEGER := 3;
    v_promovido BOOLEAN := true;
    v_promedio DECIMAL(3,1) := 0.0;
    v_materias_pendientes TEXT[] := '{}';
    v_materias_intensificacion TEXT[] := '{}';
    v_total_materias INTEGER := 0;
    v_materias_aprobadas INTEGER := 0;
BEGIN
    -- Obtener información de la escuela
    SELECT s.school_id, sch.school_type INTO v_school_id, v_school_type
    FROM students s
    JOIN schools sch ON s.school_id = sch.id
    WHERE s.id = p_student_id;
    
    -- Ajustar criterios según tipo de escuela
    IF v_school_type = 'primaria' THEN
        v_max_failed_subjects := 2;
    END IF;
    
    -- Calcular promedio y materias pendientes
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN g.numeric_grade >= 6 THEN 1 END),
        COALESCE(AVG(g.numeric_grade), 0),
        ARRAY_AGG(ss.name) FILTER (WHERE g.numeric_grade < 6 OR g.numeric_grade IS NULL)
    INTO v_total_materias, v_materias_aprobadas, v_promedio, v_materias_pendientes
    FROM course_subjects cs
    JOIN school_subjects ss ON cs.subject_id = ss.id
    LEFT JOIN grades g ON cs.id = g.course_subject_id AND g.period = 2 AND g.grade_type = 'informe'
    WHERE cs.course_id = (SELECT course_id FROM students WHERE id = p_student_id);
    
    -- Determinar promoción
    v_promovido := (v_total_materias - v_materias_aprobadas) <= v_max_failed_subjects;
    
    -- Materias para intensificación
    IF NOT v_promovido THEN
        v_materias_intensificacion := v_materias_pendientes;
    END IF;
    
    RETURN QUERY SELECT v_promovido, v_promedio, v_materias_pendientes, v_materias_intensificacion;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- HABILITAR RLS (Row Level Security)
-- ========================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS DE SEGURIDAD COMPLETAS
-- ========================================
-- Políticas para escuelas
CREATE POLICY "Users can view their schools" ON schools
    FOR SELECT USING (
        id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Directors can manage their schools" ON schools
    FOR ALL USING (
        id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND role = 'director' AND is_active = true
        )
    );

-- Políticas para estudiantes
CREATE POLICY "Users can view students from their schools" ON students
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Preceptors can manage students" ON students
    FOR ALL USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND role IN ('director', 'preceptor') AND is_active = true
        )
    );

-- Políticas para calificaciones
CREATE POLICY "Users can view grades from their schools" ON grades
    FOR SELECT USING (
        student_id IN (
            SELECT s.id FROM students s
            JOIN user_schools us ON s.school_id = us.school_id
            WHERE us.user_id = auth.uid() AND us.is_active = true
        )
    );

CREATE POLICY "Teachers can manage their grades" ON grades
    FOR ALL USING (
        created_by = auth.uid() OR
        course_subject_id IN (
            SELECT cs.id FROM course_subjects cs
            JOIN user_schools us ON cs.course_id IN (
                SELECT c.id FROM courses c WHERE c.school_id = us.school_id
            )
            WHERE us.user_id = auth.uid() AND us.role IN ('director', 'preceptor', 'profesor') AND us.is_active = true
        )
    );

-- Políticas para horarios
CREATE POLICY "Users can view schedules from their schools" ON schedule_blocks
    FOR SELECT USING (
        schedule_id IN (
            SELECT cs.id FROM course_schedules cs
            JOIN courses c ON cs.course_id = c.id
            JOIN user_schools us ON c.school_id = us.school_id
            WHERE us.user_id = auth.uid() AND us.is_active = true
        )
    );

-- ========================================
-- COMENTARIOS DE AYUDA
-- ========================================
COMMENT ON TABLE schools IS 'Tabla principal de escuelas del sistema - Versión comercial mejorada';
COMMENT ON TABLE users IS 'Usuarios del sistema con roles granulares y seguridad mejorada';
COMMENT ON TABLE students IS 'Estudiantes con soporte para grupos y seguimiento de estado';
COMMENT ON TABLE grades IS 'Calificaciones con soporte para trimestres y cuatrimestres';
COMMENT ON TABLE course_groups IS 'Grupos dentro de cursos para escuelas técnicas';
COMMENT ON TABLE schedule_blocks IS 'Bloques de horario para gestión de clases';
COMMENT ON TABLE audit_logs IS 'Registro de auditoría para trazabilidad completa';
COMMENT ON TABLE student_promotions IS 'Registro de promociones y evaluaciones finales';

COMMENT ON COLUMN schools.max_years IS 'Años máximos según tipo: Primaria=6, Secundaria=5, Técnica=7';
COMMENT ON COLUMN grades.period IS 'Período de evaluación: 1-2 para cuatrimestres, 1-4 para trimestres';
COMMENT ON COLUMN grades.instance IS 'Instancia de evaluación dentro del período (1°, 2°, 3°, etc.)';
COMMENT ON COLUMN grades.is_intensification IS 'Indica si es nota de período de intensificación';

-- ========================================
-- DATOS INICIALES DE EJEMPLO
-- ========================================
-- Insertar usuario super admin por defecto
INSERT INTO users (email, password_hash, first_name, last_name, dni, role) VALUES
('admin@sistema.com', crypt('admin123', gen_salt('bf')), 'Super', 'Administrador', '00000000', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- VISTAS ÚTILES PARA REPORTES
-- ========================================
CREATE VIEW v_student_performance AS
SELECT 
    s.id as student_id,
    s.first_name,
    s.last_name,
    s.dni,
    c.year,
    c.division,
    sch.name as school_name,
    COUNT(g.id) as total_grades,
    COUNT(CASE WHEN g.tea_tep_ted = 'TEA' THEN 1 END) as tea_count,
    COUNT(CASE WHEN g.tea_tep_ted = 'TEP' THEN 1 END) as tep_count,
    COUNT(CASE WHEN g.tea_tep_ted = 'TED' THEN 1 END) as ted_count,
    AVG(g.numeric_grade) as average_grade
FROM students s
JOIN courses c ON s.course_id = c.id
JOIN schools sch ON s.school_id = sch.id
LEFT JOIN grades g ON s.id = g.student_id AND g.grade_type = 'informe'
GROUP BY s.id, s.first_name, s.last_name, s.dni, c.year, c.division, sch.name;

-- Vista de horarios completos
CREATE VIEW v_complete_schedules AS
SELECT 
    sb.id,
    sch.name as school_name,
    c.year,
    c.division,
    sb.day_of_week,
    sb.start_time,
    sb.end_time,
    ss.name as subject_name,
    u.first_name || ' ' || u.last_name as teacher_name,
    cg.name as group_name,
    sb.classroom
FROM schedule_blocks sb
JOIN course_schedules cs ON sb.schedule_id = cs.id
JOIN courses c ON cs.course_id = c.id
JOIN schools sch ON c.school_id = sch.id
JOIN school_subjects ss ON sb.subject_id = ss.id
JOIN users u ON sb.teacher_id = u.id
LEFT JOIN course_groups cg ON sb.group_id = cg.id
WHERE sb.is_active = true AND cs.is_active = true;

-- ========================================
-- FIN DEL SCRIPT
-- ========================================
