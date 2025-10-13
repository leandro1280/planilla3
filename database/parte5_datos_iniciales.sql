-- PARTE 5: Datos Iniciales y Configuración de Seguridad
-- Copiar y pegar esta parte en Supabase SQL Editor (después de la Parte 4)

-- =============================================
-- DATOS INICIALES - MATERIAS DEL SISTEMA ARGENTINO
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