-- ========================================
-- SISTEMA DE GESTIÓN DE NOTAS ESCOLARES
-- ESTRUCTURA COMPLETA PARA SUPABASE
-- ========================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABLA: schools (Escuelas)
-- ========================================
CREATE TABLE schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) DEFAULT 'Buenos Aires' NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    school_type VARCHAR(50) NOT NULL CHECK (school_type IN ('primaria', 'secundaria_comun', 'secundaria_tecnica', 'agrotecnica', 'artistica', 'adultos')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ========================================
-- TABLA: users (Usuarios)
-- ========================================
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ========================================
-- TABLA: user_schools (Relación Usuario-Escuela)
-- ========================================
CREATE TABLE user_schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('director', 'vicedirector', 'secretario', 'preceptor', 'profesor')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(user_id, school_id)
);

-- ========================================
-- TABLA: specializations (Especialidades)
-- ========================================
CREATE TABLE specializations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(school_id, code)
);

-- ========================================
-- TABLA: school_subjects (Materias por Escuela)
-- ========================================
CREATE TABLE school_subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    category VARCHAR(50) DEFAULT 'basica' CHECK (category IN ('basica', 'especialidad', 'taller', 'practica', 'optativa')),
    hours_per_week INTEGER CHECK (hours_per_week > 0),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(school_id, code)
);

-- ========================================
-- TABLA: courses (Cursos)
-- ========================================
CREATE TABLE courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year INTEGER NOT NULL CHECK (academic_year >= 2020),
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 7),
    division VARCHAR(10) NOT NULL,
    group_name VARCHAR(10), -- Para grupos de talleres (A, B, 1, 2, Alpha, Beta, etc.)
    cycle VARCHAR(20) NOT NULL CHECK (cycle IN ('primario', 'basico', 'superior')),
    specialization_id UUID REFERENCES specializations(id) ON DELETE SET NULL,
    shift VARCHAR(20) DEFAULT 'mañana' CHECK (shift IN ('mañana', 'tarde', 'vespertino', 'noche')),
    max_students INTEGER DEFAULT 30 CHECK (max_students > 0),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(school_id, academic_year, year, division, group_name, shift)
);

-- ========================================
-- TABLA: course_subjects (Materias por Curso)
-- ========================================
CREATE TABLE course_subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES school_subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    hours_per_week INTEGER CHECK (hours_per_week > 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(course_id, subject_id)
);

-- ========================================
-- TABLA: students (Estudiantes)
-- ========================================
CREATE TABLE students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    birth_date DATE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(50),
    enrollment_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(school_id, dni)
);

-- ========================================
-- TABLA: cycle_subject_templates (Plantillas de Materias)
-- ========================================
CREATE TABLE cycle_subject_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    specialization_id UUID REFERENCES specializations(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 7),
    subject_id UUID NOT NULL REFERENCES school_subjects(id) ON DELETE CASCADE,
    hours_per_week INTEGER NOT NULL CHECK (hours_per_week > 0),
    is_mandatory BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(school_id, year, subject_id, specialization_id)
);

-- ========================================
-- TABLA: grades (Calificaciones)
-- ========================================
CREATE TABLE grades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_subject_id UUID NOT NULL REFERENCES course_subjects(id) ON DELETE CASCADE,
    quarter INTEGER NOT NULL CHECK (quarter IN (1, 2)),
    grade_type VARCHAR(20) NOT NULL CHECK (grade_type IN ('pre_informe', 'informe')),
    numeric_grade DECIMAL(3,1) CHECK (numeric_grade >= 1 AND numeric_grade <= 10),
    tea_tep_ted VARCHAR(3) CHECK (tea_tep_ted IN ('TEA', 'TEP', 'TED')),
    attendance_percentage DECIMAL(5,2) CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
    observations TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(student_id, course_subject_id, quarter, grade_type)
);

-- ========================================
-- TABLA: data_imports (Importaciones)
-- ========================================
CREATE TABLE data_imports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    import_type VARCHAR(50) NOT NULL CHECK (import_type IN ('students', 'grades', 'subjects', 'mixed')),
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
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
-- TABLA: reports (Reportes)
-- ========================================
CREATE TABLE reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('boletines', 'estadisticas', 'asistencia', 'tea_tep_ted', 'comparativo')),
    parameters JSONB NOT NULL,
    file_path TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    generated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMPTZ
);

-- ========================================
-- TABLA: school_configurations (Configuraciones)
-- ========================================
CREATE TABLE school_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(school_id, config_key)
);

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ========================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_dni ON students(dni);
CREATE INDEX idx_students_course ON students(course_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_quarter ON grades(quarter);
CREATE INDEX idx_courses_school_year ON courses(school_id, academic_year);
CREATE INDEX idx_school_subjects_school ON school_subjects(school_id);

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

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specializations_updated_at BEFORE UPDATE ON specializations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_subjects_updated_at BEFORE UPDATE ON school_subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_configurations_updated_at BEFORE UPDATE ON school_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FUNCIÓN: Calcular TEA/TEP/TED automáticamente
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
-- FUNCIÓN: Crear materias básicas para escuela
-- ========================================
CREATE OR REPLACE FUNCTION create_basic_subjects_for_school(p_school_id UUID)
RETURNS void AS $$
BEGIN
    -- Materias básicas comunes a todas las escuelas
    INSERT INTO school_subjects (school_id, name, code, category, hours_per_week) VALUES
    (p_school_id, 'Matemática', 'MTM', 'basica', 4),
    (p_school_id, 'Prácticas del Lenguaje', 'PLG', 'basica', 4),
    (p_school_id, 'Biología', 'BLG', 'basica', 3),
    (p_school_id, 'Historia', 'HTR', 'basica', 3),
    (p_school_id, 'Geografía', 'GGF', 'basica', 3),
    (p_school_id, 'Educación Física', 'EFC', 'basica', 3),
    (p_school_id, 'Inglés', 'IGS', 'basica', 3),
    (p_school_id, 'Construcción de Ciudadanía', 'CCD', 'basica', 2),
    (p_school_id, 'Artística', 'ART', 'basica', 2),
    (p_school_id, 'Físico-Química', 'FQA', 'basica', 3),
    (p_school_id, 'Literatura', 'LIT', 'basica', 3),
    (p_school_id, 'Matemática Ciclo Superior', 'MCS', 'basica', 4)
    ON CONFLICT (school_id, code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- HABILITAR RLS (Row Level Security)
-- ========================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_subjects ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS BÁSICAS DE SEGURIDAD
-- ========================================
-- Política para que los usuarios solo vean sus escuelas
CREATE POLICY "Users can view their schools" ON schools
    FOR SELECT USING (
        id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Política para que los usuarios vean solo estudiantes de sus escuelas
CREATE POLICY "Users can view students from their schools" ON students
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- ========================================
-- COMENTARIOS DE AYUDA
-- ========================================
COMMENT ON TABLE schools IS 'Tabla principal de escuelas del sistema';
COMMENT ON TABLE users IS 'Usuarios del sistema con acceso a una o más escuelas';
COMMENT ON TABLE students IS 'Estudiantes matriculados en las escuelas';
COMMENT ON TABLE grades IS 'Calificaciones con sistema TEA/TEP/TED para Buenos Aires';
COMMENT ON COLUMN grades.tea_tep_ted IS 'TEA: Trabajo Excelente (7-10), TEP: En Proceso (4-6), TED: En Desarrollo (1-3)';
COMMENT ON COLUMN grades.quarter IS '1: Primer cuatrimestre, 2: Segundo cuatrimestre';
COMMENT ON COLUMN grades.grade_type IS 'pre_informe: Evaluación parcial, informe: Evaluación final del cuatrimestre';






