-- Sistema de Gestión de Notas Escolares
-- Esquema de base de datos para Supabase con PostgreSQL moderno
-- Usando GENERATED ALWAYS AS IDENTITY y restricciones completas

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    CONSTRAINT schools_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT schools_phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s\-\(\)]+$')
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
    dni VARCHAR(20) UNIQUE,
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
-- TABLA DE AUDITORÍA (OPCIONAL)
-- =============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT audit_logs_action_not_empty CHECK (LENGTH(TRIM(action)) > 0),
    CONSTRAINT audit_logs_table_name_not_empty CHECK (LENGTH(TRIM(table_name)) > 0)
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
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para validar calificaciones TEA/TEP/TED
CREATE OR REPLACE FUNCTION validate_grade_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Si hay una nota numérica, calcular automáticamente TEA/TEP/TED
    IF NEW.numeric_grade IS NOT NULL THEN
        NEW.tea_grade := false;
        NEW.tep_grade := false;
        NEW.ted_grade := false;
        
        IF NEW.numeric_grade >= 7 AND NEW.numeric_grade <= 10 THEN
            NEW.tea_grade := true;
        ELSIF NEW.numeric_grade >= 4 AND NEW.numeric_grade <= 6 THEN
            NEW.tep_grade := true;
        ELSIF NEW.numeric_grade >= 1 AND NEW.numeric_grade <= 3 THEN
            NEW.ted_grade := true;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para generar número de estudiante automático
CREATE OR REPLACE FUNCTION generate_student_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.student_number IS NULL OR NEW.student_number = '' THEN
        NEW.student_number := LPAD(NEXTVAL('student_number_seq_' || NEW.school_id::text), 4, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear secuencias para números de estudiante por escuela
CREATE OR REPLACE FUNCTION create_student_number_sequence(school_uuid UUID)
RETURNS VOID AS $$
BEGIN
    EXECUTE 'CREATE SEQUENCE IF NOT EXISTS student_number_seq_' || school_uuid::text || ' START 1';
END;
$$ language 'plpgsql';

-- Triggers para updated_at
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

-- Trigger para validar calificaciones
CREATE TRIGGER validate_grades_trigger
    BEFORE INSERT OR UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION validate_grade_categories();

-- Trigger para generar número de estudiante
CREATE TRIGGER generate_student_number_trigger
    BEFORE INSERT ON students
    FOR EACH ROW EXECUTE FUNCTION generate_student_number();

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar materias del sistema educativo argentino
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
-- POLÍTICAS DE SEGURIDAD RLS
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (se pueden ajustar según necesidades específicas)
-- Los usuarios solo pueden ver datos de las escuelas donde trabajan

CREATE POLICY "Users can view their schools" ON schools
    FOR SELECT USING (
        id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can view students from their schools" ON students
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can view grades from their schools" ON grades
    FOR SELECT USING (
        student_id IN (
            SELECT s.id FROM students s
            JOIN user_schools us ON s.school_id = us.school_id
            WHERE us.user_id = auth.uid() AND us.is_active = true
        )
    );

CREATE POLICY "Users can view courses from their schools" ON courses
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Políticas para usuarios (solo pueden ver su propia información)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

-- Políticas para materias (todos pueden ver)
CREATE POLICY "Everyone can view subjects" ON subjects
    FOR SELECT USING (is_active = true);

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista para estadísticas de calificaciones por curso
CREATE VIEW course_grade_stats AS
SELECT 
    c.id as course_id,
    c.name as course_name,
    c.cycle,
    c.academic_year,
    s.id as school_id,
    s.name as school_name,
    COUNT(g.id) as total_grades,
    COUNT(CASE WHEN g.tea_grade THEN 1 END) as tea_count,
    COUNT(CASE WHEN g.tep_grade THEN 1 END) as tep_count,
    COUNT(CASE WHEN g.ted_grade THEN 1 END) as ted_count,
    ROUND(
        COUNT(CASE WHEN g.tea_grade THEN 1 END)::decimal / 
        NULLIF(COUNT(g.id), 0) * 100, 2
    ) as tea_percentage,
    ROUND(
        COUNT(CASE WHEN g.tep_grade THEN 1 END)::decimal / 
        NULLIF(COUNT(g.id), 0) * 100, 2
    ) as tep_percentage,
    ROUND(
        COUNT(CASE WHEN g.ted_grade THEN 1 END)::decimal / 
        NULLIF(COUNT(g.id), 0) * 100, 2
    ) as ted_percentage
FROM courses c
JOIN schools s ON c.school_id = s.id
LEFT JOIN grades g ON c.id = g.course_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.cycle, c.academic_year, s.id, s.name;

-- Vista para estadísticas de estudiantes por curso
CREATE VIEW course_student_stats AS
SELECT 
    c.id as course_id,
    c.name as course_name,
    c.cycle,
    c.academic_year,
    s.id as school_id,
    s.name as school_name,
    COUNT(st.id) as total_students,
    COUNT(CASE WHEN st.is_active THEN 1 END) as active_students
FROM courses c
JOIN schools s ON c.school_id = s.id
LEFT JOIN students st ON c.id = st.course_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.cycle, c.academic_year, s.id, s.name;

-- =============================================
-- COMENTARIOS EN TABLAS Y COLUMNAS
-- =============================================

COMMENT ON TABLE schools IS 'Información de las escuelas del sistema';
COMMENT ON TABLE users IS 'Usuarios del sistema (profesores, directores, administradores)';
COMMENT ON TABLE user_schools IS 'Relación muchos a muchos entre usuarios y escuelas';
COMMENT ON TABLE subjects IS 'Materias disponibles en el sistema educativo';
COMMENT ON TABLE courses IS 'Cursos de cada escuela por año académico';
COMMENT ON TABLE course_subjects IS 'Materias asignadas a cada curso';
COMMENT ON TABLE students IS 'Información de los estudiantes';
COMMENT ON TABLE grades IS 'Calificaciones de los estudiantes por materia y período';
COMMENT ON TABLE data_imports IS 'Registro de importaciones de datos masivos';
COMMENT ON TABLE reports IS 'Reportes generados por el sistema';
COMMENT ON TABLE audit_logs IS 'Log de auditoría para cambios importantes';

COMMENT ON COLUMN grades.period IS 'Período de evaluación: pre_informe o informe';
COMMENT ON COLUMN grades.tea_grade IS 'Trabajo Excelente/Avanzado (notas 7-10)';
COMMENT ON COLUMN grades.tep_grade IS 'Trabajo En Proceso (notas 4-6)';
COMMENT ON COLUMN grades.ted_grade IS 'Trabajo En Desarrollo (notas 1-3)';
COMMENT ON COLUMN grades.attendance_percentage IS 'Porcentaje de asistencia del estudiante';