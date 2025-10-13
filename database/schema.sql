-- Sistema de Gestión de Notas Escolares
-- Esquema de base de datos para Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de escuelas
CREATE TABLE schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    director_name VARCHAR(255),
    province VARCHAR(100) DEFAULT 'Buenos Aires',
    city VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de usuarios (profesores, directores, administradores)
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'director', 'teacher', 'secretary')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de relación usuario-escuela (un usuario puede trabajar en múltiples escuelas)
CREATE TABLE user_schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    role_in_school VARCHAR(20) NOT NULL CHECK (role_in_school IN ('director', 'teacher', 'secretary')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, school_id)
);

-- Tabla de cursos
CREATE TABLE courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- ej: "1ro 1ra", "4to 2da"
    year INTEGER NOT NULL, -- 1, 2, 3, 4, 5, 6
    division VARCHAR(10) NOT NULL, -- "1ra", "2da", "3ra"
    cycle VARCHAR(20) NOT NULL CHECK (cycle IN ('basico', 'superior')),
    academic_year INTEGER NOT NULL, -- 2024, 2025, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, name, academic_year)
);

-- Tabla de materias
CREATE TABLE subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL, -- "MTM", "PLG", "BLG", etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de materias por curso
CREATE TABLE course_subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, subject_id)
);

-- Tabla de alumnos
CREATE TABLE students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
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
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de calificaciones
CREATE TABLE grades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    academic_year INTEGER NOT NULL,
    semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
    period VARCHAR(20) NOT NULL CHECK (period IN ('pre_informe', 'informe')),
    numeric_grade DECIMAL(3,1) CHECK (numeric_grade >= 1 AND numeric_grade <= 10),
    tea_grade BOOLEAN DEFAULT false,
    tep_grade BOOLEAN DEFAULT false,
    ted_grade BOOLEAN DEFAULT false,
    attendance_percentage DECIMAL(5,2) DEFAULT 100.00,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_id, academic_year, semester, period)
);

-- Tabla de importaciones de datos
CREATE TABLE data_imports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    import_type VARCHAR(50) NOT NULL, -- 'students', 'grades', 'courses'
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    records_processed INTEGER DEFAULT 0,
    records_total INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de reportes generados
CREATE TABLE reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    parameters JSONB,
    file_path VARCHAR(500),
    file_size BIGINT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('generating', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_grades_student_course ON grades(student_id, course_id);
CREATE INDEX idx_grades_subject_semester ON grades(subject_id, academic_year, semester);
CREATE INDEX idx_students_course ON students(course_id);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_courses_school_year ON courses(school_id, academic_year);
CREATE INDEX idx_user_schools_user ON user_schools(user_id);
CREATE INDEX idx_user_schools_school ON user_schools(school_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar materias básicas del sistema educativo argentino
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

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (se pueden ajustar según necesidades)
-- Los usuarios solo pueden ver datos de las escuelas donde trabajan
CREATE POLICY "Users can view their schools" ON schools
    FOR SELECT USING (
        id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view students from their schools" ON students
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view grades from their schools" ON grades
    FOR SELECT USING (
        student_id IN (
            SELECT s.id FROM students s
            JOIN user_schools us ON s.school_id = us.school_id
            WHERE us.user_id = auth.uid()
        )
    );