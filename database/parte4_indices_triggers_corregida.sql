-- PARTE 4: Índices, Triggers y Configuración CORREGIDOS
-- Copiar y pegar esta parte en Supabase SQL Editor (después de la Parte 3)

-- =============================================
-- ÍNDICES PARA RENDIMIENTO
-- =============================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_grades_student_course ON grades(student_id, course_id);
CREATE INDEX idx_grades_subject_semester ON grades(school_subject_id, academic_year, semester);
CREATE INDEX idx_grades_academic_year ON grades(academic_year);
CREATE INDEX idx_grades_period ON grades(period);

CREATE INDEX idx_students_course ON students(course_id);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_dni ON students(dni);
CREATE INDEX idx_students_active ON students(is_active);

CREATE INDEX idx_courses_school_year ON courses(school_id, academic_year);
CREATE INDEX idx_courses_cycle ON courses(cycle);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_courses_specialization ON courses(specialization_id);

CREATE INDEX idx_user_schools_user ON user_schools(user_id);
CREATE INDEX idx_user_schools_school ON user_schools(school_id);
CREATE INDEX idx_user_schools_active ON user_schools(is_active);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_schools_code ON schools(code);
CREATE INDEX idx_schools_active ON schools(is_active);
CREATE INDEX idx_schools_type ON schools(school_type);

-- Índices para materias por escuela
CREATE INDEX idx_school_subjects_school ON school_subjects(school_id);
CREATE INDEX idx_school_subjects_code ON school_subjects(code);
CREATE INDEX idx_school_subjects_active ON school_subjects(is_active);
CREATE INDEX idx_school_subjects_category ON school_subjects(category);

-- Índices para especialidades
CREATE INDEX idx_specializations_school ON specializations(school_id);
CREATE INDEX idx_specializations_active ON specializations(is_active);

-- Índices para course_subjects
CREATE INDEX idx_course_subjects_course ON course_subjects(course_id);
CREATE INDEX idx_course_subjects_subject ON course_subjects(school_subject_id);
CREATE INDEX idx_course_subjects_teacher ON course_subjects(teacher_id);

-- Índices para plantillas de ciclo
CREATE INDEX idx_cycle_templates_school ON cycle_subject_templates(school_id);
CREATE INDEX idx_cycle_templates_cycle_year ON cycle_subject_templates(cycle, year);

-- Índices para reportes
CREATE INDEX idx_grades_tea ON grades(tea_grade) WHERE tea_grade = true;
CREATE INDEX idx_grades_tep ON grades(tep_grade) WHERE tep_grade = true;
CREATE INDEX idx_grades_ted ON grades(ted_grade) WHERE ted_grade = true;

-- Índices compuestos para consultas complejas
CREATE INDEX idx_grades_student_subject_year ON grades(student_id, school_subject_id, academic_year);
CREATE INDEX idx_grades_course_subject_semester ON grades(course_id, school_subject_id, semester);
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
-- FUNCIÓN PARA CREAR MATERIAS BÁSICAS POR ESCUELA
-- =============================================

CREATE OR REPLACE FUNCTION create_basic_subjects_for_school(school_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Materias básicas comunes a todas las escuelas
    INSERT INTO school_subjects (school_id, code, name, description, category) VALUES
    (school_uuid, 'MTM', 'Matemática', 'Matemática general', 'basica'),
    (school_uuid, 'PLG', 'Prácticas del Lenguaje', 'Lengua y Literatura - Ciclo Básico', 'basica'),
    (school_uuid, 'LIT', 'Literatura', 'Literatura - Ciclo Superior', 'basica'),
    (school_uuid, 'BLG', 'Biología', 'Biología', 'basica'),
    (school_uuid, 'HTR', 'Historia', 'Historia', 'basica'),
    (school_uuid, 'GGF', 'Geografía', 'Geografía', 'basica'),
    (school_uuid, 'CCD', 'Construcción de Ciudadanía', 'Construcción de Ciudadanía', 'basica'),
    (school_uuid, 'FQA', 'Física y Química', 'Física y Química', 'basica'),
    (school_uuid, 'ART', 'Arte', 'Educación Artística', 'basica'),
    (school_uuid, 'EFC', 'Educación Física', 'Educación Física', 'basica'),
    (school_uuid, 'IGS', 'Inglés', 'Inglés', 'basica'),
    (school_uuid, 'CNT', 'Ciencias Naturales', 'Ciencias Naturales', 'basica'),
    (school_uuid, 'CS', 'Ciencias Sociales', 'Ciencias Sociales', 'basica');
END;
$$ LANGUAGE plpgsql;

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

CREATE TRIGGER update_school_subjects_updated_at 
    BEFORE UPDATE ON school_subjects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_configurations_updated_at 
    BEFORE UPDATE ON school_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();