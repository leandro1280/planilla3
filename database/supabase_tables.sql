-- Sistema de Gestión de Notas Escolares - Estructura de Tablas para Supabase
-- Copiar y pegar este código en el SQL Editor de Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA DE ESCUELAS
-- =============================================
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    director_name VARCHAR(255),
    province VARCHAR(100) NOT NULL DEFAULT 'Buenos Aires',
    city VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT schools_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT schools_code_not_empty CHECK (LENGTH(TRIM(code)) > 0),
    CONSTRAINT schools_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =============================================
-- TABLA DE USUARIOS
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_password_hash_not_empty CHECK (LENGTH(password_hash) > 0),
    CONSTRAINT users_first_name_not_empty CHECK (LENGTH(TRIM(first_name)) > 0),
    CONSTRAINT users_last_name_not_empty CHECK (LENGTH(TRIM(last_name)) > 0),
    CONSTRAINT users_role_valid CHECK (role IN ('admin', 'director', 'teacher', 'secretary'))
);

-- =============================================
-- TABLA DE RELACIÓN USUARIO-ESCUELA
-- =============================================
CREATE TABLE user_schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    role_in_school VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT user_schools_role_valid CHECK (role_in_school IN ('director', 'teacher', 'secretary')),
    CONSTRAINT user_schools_unique_user_school UNIQUE(user_id, school_id)
);

-- =============================================
-- TABLA DE MATERIAS
-- =============================================
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT subjects_code_not_empty CHECK (LENGTH(TRIM(code)) > 0),
    CONSTRAINT subjects_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT subjects_code_format CHECK (code ~ '^[A-Z0-9\s]+$')
);

-- =============================================
-- TABLA DE CURSOS
-- =============================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    division VARCHAR(10) NOT NULL,
    cycle VARCHAR(20) NOT NULL,
    academic_year INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT courses_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT courses_year_valid CHECK (year >= 1 AND year <= 6),
    CONSTRAINT courses_division_not_empty CHECK (LENGTH(TRIM(division)) > 0),
    CONSTRAINT courses_cycle_valid CHECK (cycle IN ('basico', 'superior')),
    CONSTRAINT courses_academic_year_valid CHECK (academic_year >= 2020 AND academic_year <= 2030),
    CONSTRAINT courses_unique_school_name_year UNIQUE(school_id, name, academic_year)
);

-- =============================================
-- TABLA DE MATERIAS POR CURSO
-- =============================================
CREATE TABLE course_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT course_subjects_unique_course_subject UNIQUE(course_id, subject_id)
);

-- =============================================
-- TABLA DE ALUMNOS
-- =============================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_number VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dni VARCHAR(20),
    birth_date DATE,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT students_first_name_not_empty CHECK (LENGTH(TRIM(first_name)) > 0),
    CONSTRAINT students_last_name_not_empty CHECK (LENGTH(TRIM(last_name)) > 0),
    CONSTRAINT students_dni_format CHECK (dni IS NULL OR dni ~ '^[0-9]{7,8}$'),
    CONSTRAINT students_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT students_phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s\-\(\)]+$'),
    CONSTRAINT students_emergency_phone_format CHECK (emergency_contact_phone IS NULL OR emergency_contact_phone ~ '^\+?[0-9\s\-\(\)]+$'),
    CONSTRAINT students_birth_date_valid CHECK (birth_date IS NULL OR birth_date <= CURRENT_DATE),
    CONSTRAINT students_unique_dni_school UNIQUE(dni, school_id)
);

-- =============================================
-- TABLA DE CALIFICACIONES
-- =============================================
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    academic_year INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    period VARCHAR(20) NOT NULL,
    numeric_grade DECIMAL(3,1),
    tea_grade BOOLEAN NOT NULL DEFAULT false,
    tep_grade BOOLEAN NOT NULL DEFAULT false,
    ted_grade BOOLEAN NOT NULL DEFAULT false,
    attendance_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT grades_academic_year_valid CHECK (academic_year >= 2020 AND academic_year <= 2030),
    CONSTRAINT grades_semester_valid CHECK (semester IN (1, 2)),
    CONSTRAINT grades_period_valid CHECK (period IN ('pre_informe', 'informe')),
    CONSTRAINT grades_numeric_grade_valid CHECK (numeric_grade IS NULL OR (numeric_grade >= 1 AND numeric_grade <= 10)),
    CONSTRAINT grades_attendance_valid CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
    CONSTRAINT grades_tea_tep_ted_exclusive CHECK (
        (tea_grade::int + tep_grade::int + ted_grade::int) <= 1
    ),
    CONSTRAINT grades_numeric_grade_required CHECK (
        (numeric_grade IS NOT NULL) OR (tea_grade = true OR tep_grade = true OR ted_grade = true)
    ),
    CONSTRAINT grades_unique_student_subject_period UNIQUE(student_id, subject_id, academic_year, semester, period)
);

-- =============================================
-- TABLA DE IMPORTACIONES DE DATOS
-- =============================================
CREATE TABLE data_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    import_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    records_processed INTEGER NOT NULL DEFAULT 0,
    records_total INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Restricciones de validación
    CONSTRAINT data_imports_file_name_not_empty CHECK (LENGTH(TRIM(file_name)) > 0),
    CONSTRAINT data_imports_file_type_valid CHECK (file_type IN ('csv', 'xlsx', 'xls')),
    CONSTRAINT data_imports_import_type_valid CHECK (import_type IN ('students', 'grades', 'courses')),
    CONSTRAINT data_imports_status_valid CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT data_imports_records_processed_valid CHECK (records_processed >= 0),
    CONSTRAINT data_imports_records_total_valid CHECK (records_total >= 0),
    CONSTRAINT data_imports_records_processed_le_total CHECK (records_processed <= records_total)
);

-- =============================================
-- TABLA DE REPORTES GENERADOS
-- =============================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    parameters JSONB,
    file_path VARCHAR(500),
    file_size BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'generating',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Restricciones de validación
    CONSTRAINT reports_report_name_not_empty CHECK (LENGTH(TRIM(report_name)) > 0),
    CONSTRAINT reports_report_type_valid CHECK (report_type IN ('grades_summary', 'student_report', 'course_report', 'school_report')),
    CONSTRAINT reports_status_valid CHECK (status IN ('generating', 'completed', 'failed')),
    CONSTRAINT reports_file_size_valid CHECK (file_size IS NULL OR file_size > 0)
);

-- =============================================
-- ÍNDICES PARA RENDIMIENTO
-- =============================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_grades_student_course ON grades(student_id, course_id);
CREATE INDEX idx_grades_subject_semester ON grades(subject_id, academic_year, semester);
CREATE INDEX idx_grades_academic_year ON grades(academic_year);
CREATE INDEX idx_grades_period ON grades(period);

CREATE INDEX idx_students_course ON students(course_id);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_dni ON students(dni);
CREATE INDEX idx_students_active ON students(is_active);

CREATE INDEX idx_courses_school_year ON courses(school_id, academic_year);
CREATE INDEX idx_courses_cycle ON courses(cycle);
CREATE INDEX idx_courses_active ON courses(is_active);

CREATE INDEX idx_user_schools_user ON user_schools(user_id);
CREATE INDEX idx_user_schools_school ON user_schools(school_id);
CREATE INDEX idx_user_schools_active ON user_schools(is_active);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_schools_code ON schools(code);
CREATE INDEX idx_schools_active ON schools(is_active);

-- Índices para reportes
CREATE INDEX idx_grades_tea ON grades(tea_grade) WHERE tea_grade = true;
CREATE INDEX idx_grades_tep ON grades(tep_grade) WHERE tep_grade = true;
CREATE INDEX idx_grades_ted ON grades(ted_grade) WHERE ted_grade = true;

-- Índices compuestos para consultas complejas
CREATE INDEX idx_grades_student_subject_year ON grades(student_id, subject_id, academic_year);
CREATE INDEX idx_grades_course_subject_semester ON grades(course_id, subject_id, semester);
CREATE INDEX idx_students_school_course_active ON students(school_id, course_id, is_active);

-- =============================================
-- FUNCIÓN PARA ACTUALIZAR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE TRIGGER update_schools_updated_at 
    BEFORE UPDATE ON schools 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at 
    BEFORE UPDATE ON grades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATOS INICIALES - MATERIAS
-- =============================================

INSERT INTO subjects (code, name, description) VALUES
('MTM', 'Matemática', 'Matemática general'),
('PLG', 'Prácticas del Lenguaje', 'Lengua y Literatura - Ciclo Básico'),
('LIT', 'Literatura', 'Literatura - Ciclo Superior'),
('MCS', 'Matemática y Ciencias', 'Matemática y Ciencias - Ciclo Superior'),
('BLG', 'Biología', 'Biología'),
('HTR', 'Historia', 'Historia'),
('GGF', 'Geografía', 'Geografía'),
('CCD', 'Construcción de Ciudadanía', 'Construcción de Ciudadanía'),
('FQA', 'Física y Química', 'Física y Química'),
('ART', 'Arte', 'Educación Artística'),
('EFC', 'Educación Física', 'Educación Física'),
('IGS', 'Inglés', 'Inglés'),
('CNT', 'Ciencias Naturales', 'Ciencias Naturales'),
('CS', 'Ciencias Sociales', 'Ciencias Sociales'),
('NTICX', 'NTICX', 'Nuevas Tecnologías de la Información y la Conectividad'),
('PSI', 'Psicología', 'Psicología'),
('SYA', 'Sistemas y Organizaciones', 'Sistemas y Organizaciones'),
('INT FISICA', 'Introducción a la Física', 'Introducción a la Física'),
('CCS', 'Ciencias de la Computación', 'Ciencias de la Computación'),
('ECO', 'Economía', 'Economía'),
('INT QUI', 'Introducción a la Química', 'Introducción a la Química'),
('PYC', 'Proyecto y Construcción', 'Proyecto y Construcción'),
('SOC', 'Sociología', 'Sociología'),
('PIC', 'Proyecto e Investigación', 'Proyecto e Investigación'),
('TYC', 'Tecnología y Ciudadanía', 'Tecnología y Ciudadanía'),
('FILO', 'Filosofía', 'Filosofía'),
('ARTE', 'Arte', 'Arte - Ciclo Superior');

-- =============================================
-- HABILITAR RLS (Row Level Security)
-- =============================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS BÁSICAS DE SEGURIDAD
-- =============================================

-- Política para que todos puedan ver materias activas
CREATE POLICY "Everyone can view active subjects" ON subjects
    FOR SELECT USING (is_active = true);

-- Política para que los usuarios vean su propio perfil
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

-- Política básica para escuelas (se puede ajustar después)
CREATE POLICY "Users can view their schools" ON schools
    FOR SELECT USING (true);

-- Política básica para user_schools
CREATE POLICY "Users can view their school assignments" ON user_schools
    FOR SELECT USING (user_id = auth.uid());

-- Política básica para cursos
CREATE POLICY "Users can view courses" ON courses
    FOR SELECT USING (true);

-- Política básica para course_subjects
CREATE POLICY "Users can view course subjects" ON course_subjects
    FOR SELECT USING (true);

-- Política básica para estudiantes
CREATE POLICY "Users can view students" ON students
    FOR SELECT USING (true);

-- Política básica para calificaciones
CREATE POLICY "Users can view grades" ON grades
    FOR SELECT USING (true);

-- Política básica para importaciones
CREATE POLICY "Users can view their imports" ON data_imports
    FOR SELECT USING (user_id = auth.uid());

-- Política básica para reportes
CREATE POLICY "Users can view their reports" ON reports
    FOR SELECT USING (user_id = auth.uid());