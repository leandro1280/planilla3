-- Políticas de Seguridad RLS (Row Level Security) para Supabase
-- Sistema de Gestión de Notas Escolares

-- =============================================
-- POLÍTICAS PARA LA TABLA SCHOOLS
-- =============================================

-- Los usuarios solo pueden ver escuelas donde trabajan
CREATE POLICY "Users can view their schools" ON schools
    FOR SELECT USING (
        id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Solo administradores pueden insertar escuelas
CREATE POLICY "Only admins can insert schools" ON schools
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo administradores pueden actualizar escuelas
CREATE POLICY "Only admins can update schools" ON schools
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo administradores pueden eliminar escuelas
CREATE POLICY "Only admins can delete schools" ON schools
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS PARA LA TABLA USERS
-- =============================================

-- Los usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

-- Los administradores pueden ver todos los usuarios
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Los directores pueden ver usuarios de su escuela
CREATE POLICY "Directors can view school users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_schools us
            JOIN users u ON us.user_id = u.id
            WHERE u.id = auth.uid() 
            AND us.role_in_school = 'director'
            AND us.is_active = true
        )
    );

-- Solo administradores pueden insertar usuarios
CREATE POLICY "Only admins can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Los administradores pueden actualizar cualquier usuario
CREATE POLICY "Admins can update any user" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo administradores pueden eliminar usuarios
CREATE POLICY "Only admins can delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS PARA LA TABLA USER_SCHOOLS
-- =============================================

-- Los usuarios pueden ver sus propias asignaciones
CREATE POLICY "Users can view own school assignments" ON user_schools
    FOR SELECT USING (user_id = auth.uid());

-- Los administradores pueden ver todas las asignaciones
CREATE POLICY "Admins can view all assignments" ON user_schools
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Los directores pueden ver asignaciones de su escuela
CREATE POLICY "Directors can view school assignments" ON user_schools
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools
            WHERE user_id = auth.uid() 
            AND role_in_school = 'director'
            AND is_active = true
        )
    );

-- Solo administradores pueden insertar asignaciones
CREATE POLICY "Only admins can insert assignments" ON user_schools
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo administradores pueden actualizar asignaciones
CREATE POLICY "Only admins can update assignments" ON user_schools
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo administradores pueden eliminar asignaciones
CREATE POLICY "Only admins can delete assignments" ON user_schools
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS PARA LA TABLA SUBJECTS
-- =============================================

-- Todos los usuarios autenticados pueden ver materias activas
CREATE POLICY "Authenticated users can view active subjects" ON subjects
    FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

-- Solo administradores pueden insertar materias
CREATE POLICY "Only admins can insert subjects" ON subjects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo administradores pueden actualizar materias
CREATE POLICY "Only admins can update subjects" ON subjects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo administradores pueden eliminar materias
CREATE POLICY "Only admins can delete subjects" ON subjects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS PARA LA TABLA COURSES
-- =============================================

-- Los usuarios pueden ver cursos de sus escuelas
CREATE POLICY "Users can view school courses" ON courses
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Los directores pueden insertar cursos en su escuela
CREATE POLICY "Directors can insert courses" ON courses
    FOR INSERT WITH CHECK (
        school_id IN (
            SELECT school_id FROM user_schools
            WHERE user_id = auth.uid() 
            AND role_in_school = 'director'
            AND is_active = true
        )
    );

-- Los directores pueden actualizar cursos de su escuela
CREATE POLICY "Directors can update school courses" ON courses
    FOR UPDATE USING (
        school_id IN (
            SELECT school_id FROM user_schools
            WHERE user_id = auth.uid() 
            AND role_in_school = 'director'
            AND is_active = true
        )
    );

-- Solo administradores pueden eliminar cursos
CREATE POLICY "Only admins can delete courses" ON courses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS PARA LA TABLA COURSE_SUBJECTS
-- =============================================

-- Los usuarios pueden ver materias de cursos de sus escuelas
CREATE POLICY "Users can view course subjects" ON course_subjects
    FOR SELECT USING (
        course_id IN (
            SELECT c.id FROM courses c
            JOIN user_schools us ON c.school_id = us.school_id
            WHERE us.user_id = auth.uid() AND us.is_active = true
        )
    );

-- Los directores pueden insertar materias en cursos de su escuela
CREATE POLICY "Directors can insert course subjects" ON course_subjects
    FOR INSERT WITH CHECK (
        course_id IN (
            SELECT c.id FROM courses c
            JOIN user_schools us ON c.school_id = us.school_id
            WHERE us.user_id = auth.uid() 
            AND us.role_in_school = 'director'
            AND us.is_active = true
        )
    );

-- Los directores pueden actualizar materias de cursos de su escuela
CREATE POLICY "Directors can update course subjects" ON course_subjects
    FOR UPDATE USING (
        course_id IN (
            SELECT c.id FROM courses c
            JOIN user_schools us ON c.school_id = us.school_id
            WHERE us.user_id = auth.uid() 
            AND us.role_in_school = 'director'
            AND us.is_active = true
        )
    );

-- Solo administradores pueden eliminar materias de cursos
CREATE POLICY "Only admins can delete course subjects" ON course_subjects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS PARA LA TABLA STUDENTS
-- =============================================

-- Los usuarios pueden ver estudiantes de sus escuelas
CREATE POLICY "Users can view school students" ON students
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Los directores y secretarios pueden insertar estudiantes
CREATE POLICY "Directors and secretaries can insert students" ON students
    FOR INSERT WITH CHECK (
        school_id IN (
            SELECT school_id FROM user_schools
            WHERE user_id = auth.uid() 
            AND role_in_school IN ('director', 'secretary')
            AND is_active = true
        )
    );

-- Los directores y secretarios pueden actualizar estudiantes
CREATE POLICY "Directors and secretaries can update students" ON students
    FOR UPDATE USING (
        school_id IN (
            SELECT school_id FROM user_schools
            WHERE user_id = auth.uid() 
            AND role_in_school IN ('director', 'secretary')
            AND is_active = true
        )
    );

-- Solo administradores pueden eliminar estudiantes
CREATE POLICY "Only admins can delete students" ON students
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS PARA LA TABLA GRADES
-- =============================================

-- Los usuarios pueden ver calificaciones de estudiantes de sus escuelas
CREATE POLICY "Users can view school grades" ON grades
    FOR SELECT USING (
        student_id IN (
            SELECT s.id FROM students s
            JOIN user_schools us ON s.school_id = us.school_id
            WHERE us.user_id = auth.uid() AND us.is_active = true
        )
    );

-- Los profesores pueden insertar calificaciones de sus materias
CREATE POLICY "Teachers can insert grades" ON grades
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT s.id FROM students s
            JOIN user_schools us ON s.school_id = us.school_id
            WHERE us.user_id = auth.uid() 
            AND us.role_in_school = 'teacher'
            AND us.is_active = true
        )
        AND (
            teacher_id = auth.uid() OR
            teacher_id IN (
                SELECT cs.teacher_id FROM course_subjects cs
                WHERE cs.course_id = (
                    SELECT course_id FROM students WHERE id = student_id
                )
                AND cs.subject_id = grades.subject_id
            )
        )
    );

-- Los profesores pueden actualizar calificaciones de sus materias
CREATE POLICY "Teachers can update grades" ON grades
    FOR UPDATE USING (
        student_id IN (
            SELECT s.id FROM students s
            JOIN user_schools us ON s.school_id = us.school_id
            WHERE us.user_id = auth.uid() 
            AND us.role_in_school = 'teacher'
            AND us.is_active = true
        )
        AND (
            teacher_id = auth.uid() OR
            teacher_id IN (
                SELECT cs.teacher_id FROM course_subjects cs
                WHERE cs.course_id = (
                    SELECT course_id FROM students WHERE id = student_id
                )
                AND cs.subject_id = grades.subject_id
            )
        )
    );

-- Solo administradores pueden eliminar calificaciones
CREATE POLICY "Only admins can delete grades" ON grades
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS PARA LA TABLA DATA_IMPORTS
-- =============================================

-- Los usuarios pueden ver importaciones de sus escuelas
CREATE POLICY "Users can view school imports" ON data_imports
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Los usuarios pueden insertar importaciones en sus escuelas
CREATE POLICY "Users can insert imports" ON data_imports
    FOR INSERT WITH CHECK (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
        AND user_id = auth.uid()
    );

-- Los usuarios pueden actualizar sus propias importaciones
CREATE POLICY "Users can update own imports" ON data_imports
    FOR UPDATE USING (user_id = auth.uid());

-- Solo administradores pueden eliminar importaciones
CREATE POLICY "Only admins can delete imports" ON data_imports
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS PARA LA TABLA REPORTS
-- =============================================

-- Los usuarios pueden ver reportes de sus escuelas
CREATE POLICY "Users can view school reports" ON reports
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Los usuarios pueden insertar reportes en sus escuelas
CREATE POLICY "Users can insert reports" ON reports
    FOR INSERT WITH CHECK (
        school_id IN (
            SELECT school_id FROM user_schools 
            WHERE user_id = auth.uid() AND is_active = true
        )
        AND user_id = auth.uid()
    );

-- Los usuarios pueden actualizar sus propios reportes
CREATE POLICY "Users can update own reports" ON reports
    FOR UPDATE USING (user_id = auth.uid());

-- Solo administradores pueden eliminar reportes
CREATE POLICY "Only admins can delete reports" ON reports
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS PARA LA TABLA AUDIT_LOGS
-- =============================================

-- Solo administradores pueden ver logs de auditoría
CREATE POLICY "Only admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo el sistema puede insertar logs de auditoría
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Nadie puede actualizar o eliminar logs de auditoría
CREATE POLICY "No one can update audit logs" ON audit_logs
    FOR UPDATE USING (false);

CREATE POLICY "No one can delete audit logs" ON audit_logs
    FOR DELETE USING (false);

-- =============================================
-- FUNCIONES AUXILIARES PARA POLÍTICAS
-- =============================================

-- Función para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es director de una escuela
CREATE OR REPLACE FUNCTION is_director_of_school(school_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_schools
        WHERE user_id = auth.uid() 
        AND school_id = school_uuid
        AND role_in_school = 'director'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario tiene acceso a una escuela
CREATE OR REPLACE FUNCTION has_school_access(school_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_schools
        WHERE user_id = auth.uid() 
        AND school_id = school_uuid
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es profesor de una materia
CREATE OR REPLACE FUNCTION is_teacher_of_subject(subject_uuid UUID, course_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM course_subjects cs
        JOIN user_schools us ON cs.course_id IN (
            SELECT id FROM courses WHERE school_id = us.school_id
        )
        WHERE cs.subject_id = subject_uuid
        AND cs.course_id = course_uuid
        AND cs.teacher_id = auth.uid()
        AND us.user_id = auth.uid()
        AND us.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMENTARIOS EN POLÍTICAS
-- =============================================

COMMENT ON POLICY "Users can view their schools" ON schools IS 'Los usuarios solo pueden ver escuelas donde trabajan';
COMMENT ON POLICY "Users can view own profile" ON users IS 'Los usuarios solo pueden ver su propio perfil';
COMMENT ON POLICY "Users can view school students" ON students IS 'Los usuarios pueden ver estudiantes de sus escuelas';
COMMENT ON POLICY "Users can view school grades" ON grades IS 'Los usuarios pueden ver calificaciones de estudiantes de sus escuelas';
COMMENT ON POLICY "Teachers can insert grades" ON grades IS 'Los profesores pueden insertar calificaciones de sus materias';
COMMENT ON POLICY "Teachers can update grades" ON grades IS 'Los profesores pueden actualizar calificaciones de sus materias';