-- PARTE 5: Datos Iniciales y Configuración de Seguridad CORREGIDOS
-- Copiar y pegar esta parte en Supabase SQL Editor (después de la Parte 4)

-- =============================================
-- HABILITAR RLS (Row Level Security)
-- =============================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_subject_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_configurations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS BÁSICAS DE SEGURIDAD
-- =============================================

-- Política para que los usuarios vean su propio perfil
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

-- Política básica para escuelas
CREATE POLICY "Users can view their schools" ON schools
    FOR SELECT USING (
        id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Política básica para user_schools
CREATE POLICY "Users can view their school assignments" ON user_schools
    FOR SELECT USING (user_id = auth.uid());

-- Política para materias por escuela
CREATE POLICY "Users can view school subjects" ON school_subjects
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Política para especialidades
CREATE POLICY "Users can view school specializations" ON specializations
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Política básica para cursos
CREATE POLICY "Users can view school courses" ON courses
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Política básica para course_subjects
CREATE POLICY "Users can view course subjects" ON course_subjects
    FOR SELECT USING (
        course_id IN (
            SELECT c.id FROM courses c
            JOIN user_schools us ON c.school_id = us.school_id
            WHERE us.user_id = auth.uid() AND us.is_active = true
        )
    );

-- Política básica para estudiantes
CREATE POLICY "Users can view school students" ON students
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Política básica para calificaciones
CREATE POLICY "Users can view school grades" ON grades
    FOR SELECT USING (
        student_id IN (
            SELECT s.id FROM students s
            JOIN user_schools us ON s.school_id = us.school_id
            WHERE us.user_id = auth.uid() AND us.is_active = true
        )
    );

-- Política básica para importaciones
CREATE POLICY "Users can view their imports" ON data_imports
    FOR SELECT USING (user_id = auth.uid());

-- Política básica para reportes
CREATE POLICY "Users can view their reports" ON reports
    FOR SELECT USING (user_id = auth.uid());

-- Política para plantillas de ciclo
CREATE POLICY "Users can view cycle templates" ON cycle_subject_templates
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Política para configuraciones de escuela
CREATE POLICY "Users can view school configurations" ON school_configurations
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =============================================
-- FUNCIÓN PARA CREAR ESCUELA CON MATERIAS BÁSICAS
-- =============================================

CREATE OR REPLACE FUNCTION create_school_with_basic_setup(
    p_name VARCHAR(255),
    p_code VARCHAR(50),
    p_school_type VARCHAR(50) DEFAULT 'secundaria',
    p_province VARCHAR(100) DEFAULT 'Buenos Aires',
    p_city VARCHAR(100),
    p_director_name VARCHAR(255),
    p_email VARCHAR(255),
    p_phone VARCHAR(20),
    p_address TEXT
)
RETURNS UUID AS $$
DECLARE
    new_school_id UUID;
BEGIN
    -- Crear la escuela
    INSERT INTO schools (name, code, school_type, province, city, director_name, email, phone, address)
    VALUES (p_name, p_code, p_school_type, p_province, p_city, p_director_name, p_email, p_phone, p_address)
    RETURNING id INTO new_school_id;
    
    -- Crear materias básicas para la escuela
    PERFORM create_basic_subjects_for_school(new_school_id);
    
    -- Crear configuraciones básicas
    INSERT INTO school_configurations (school_id, config_key, config_value, config_type, description) VALUES
    (new_school_id, 'academic_year', EXTRACT(YEAR FROM CURRENT_DATE)::text, 'number', 'Año académico actual'),
    (new_school_id, 'max_students_per_course', '40', 'number', 'Máximo de estudiantes por curso'),
    (new_school_id, 'grade_scale_min', '1', 'number', 'Nota mínima en la escala'),
    (new_school_id, 'grade_scale_max', '10', 'number', 'Nota máxima en la escala'),
    (new_school_id, 'tea_min_grade', '7', 'number', 'Nota mínima para TEA'),
    (new_school_id, 'tep_min_grade', '4', 'number', 'Nota mínima para TEP'),
    (new_school_id, 'ted_max_grade', '3', 'number', 'Nota máxima para TED');
    
    RETURN new_school_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- EJEMPLO: CREAR ESCUELA TÉCNICA 9 (INFORMÁTICA)
-- =============================================

-- Descomenta las siguientes líneas para crear una escuela de ejemplo
/*
SELECT create_school_with_basic_setup(
    'Escuela Técnica N° 9 "Domingo F. Sarmiento"',
    'ET9',
    'tecnica',
    'Buenos Aires',
    'La Plata',
    'Director Ejemplo',
    'et9@ejemplo.edu.ar',
    '+54 221 123-4567',
    'Calle 123, La Plata, Buenos Aires'
);

-- Agregar especialidad de Informática
INSERT INTO specializations (school_id, name, code, description)
SELECT id, 'Técnico en Informática', 'INFO', 'Especialidad en Informática y Programación'
FROM schools WHERE code = 'ET9';

-- Agregar materias específicas de la especialidad
INSERT INTO school_subjects (school_id, code, name, description, category)
SELECT id, 'PROG1', 'Programación I', 'Fundamentos de Programación', 'especialidad'
FROM schools WHERE code = 'ET9';

INSERT INTO school_subjects (school_id, code, name, description, category)
SELECT id, 'PROG2', 'Programación II', 'Programación Avanzada', 'especialidad'
FROM schools WHERE code = 'ET9';

INSERT INTO school_subjects (school_id, code, name, description, category)
SELECT id, 'BD', 'Base de Datos', 'Diseño y Gestión de Base de Datos', 'especialidad'
FROM schools WHERE code = 'ET9';

INSERT INTO school_subjects (school_id, code, name, description, category)
SELECT id, 'REDES', 'Redes de Computadoras', 'Fundamentos de Redes', 'especialidad'
FROM schools WHERE code = 'ET9';

INSERT INTO school_subjects (school_id, code, name, description, category)
SELECT id, 'SIST', 'Sistemas Operativos', 'Administración de Sistemas', 'especialidad'
FROM schools WHERE code = 'ET9';
*/