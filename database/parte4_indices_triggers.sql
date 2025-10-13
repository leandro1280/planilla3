-- PARTE 4: Índices, Triggers y Configuración
-- Copiar y pegar esta parte en Supabase SQL Editor (después de la Parte 3)

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