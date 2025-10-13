-- Funciones específicas para el Sistema de Gestión de Notas Escolares
-- Funciones para cálculos de estadísticas TEA/TEP/TED

-- =============================================
-- FUNCIÓN PARA CALCULAR ESTADÍSTICAS POR MATERIA
-- =============================================
CREATE OR REPLACE FUNCTION get_subject_statistics(
    p_school_id UUID,
    p_subject_id UUID,
    p_academic_year INTEGER DEFAULT NULL,
    p_semester INTEGER DEFAULT NULL
)
RETURNS TABLE (
    total_grades BIGINT,
    tea_count BIGINT,
    tep_count BIGINT,
    ted_count BIGINT,
    tea_percentage NUMERIC,
    tep_percentage NUMERIC,
    ted_percentage NUMERIC,
    average_attendance NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
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
        ) as ted_percentage,
        ROUND(AVG(g.attendance_percentage), 2) as average_attendance
    FROM grades g
    JOIN students s ON g.student_id = s.id
    WHERE s.school_id = p_school_id
        AND g.subject_id = p_subject_id
        AND (p_academic_year IS NULL OR g.academic_year = p_academic_year)
        AND (p_semester IS NULL OR g.semester = p_semester);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN PARA CALCULAR ESTADÍSTICAS POR CURSO
-- =============================================
CREATE OR REPLACE FUNCTION get_course_statistics(
    p_course_id UUID,
    p_academic_year INTEGER DEFAULT NULL,
    p_semester INTEGER DEFAULT NULL
)
RETURNS TABLE (
    total_grades BIGINT,
    tea_count BIGINT,
    tep_count BIGINT,
    ted_count BIGINT,
    tea_percentage NUMERIC,
    tep_percentage NUMERIC,
    ted_percentage NUMERIC,
    student_count BIGINT,
    average_attendance NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
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
        ) as ted_percentage,
        COUNT(DISTINCT g.student_id) as student_count,
        ROUND(AVG(g.attendance_percentage), 2) as average_attendance
    FROM grades g
    WHERE g.course_id = p_course_id
        AND (p_academic_year IS NULL OR g.academic_year = p_academic_year)
        AND (p_semester IS NULL OR g.semester = p_semester);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN PARA CALCULAR ESTADÍSTICAS POR CICLO
-- =============================================
CREATE OR REPLACE FUNCTION get_cycle_statistics(
    p_school_id UUID,
    p_cycle VARCHAR(20),
    p_academic_year INTEGER DEFAULT NULL,
    p_semester INTEGER DEFAULT NULL
)
RETURNS TABLE (
    total_grades BIGINT,
    tea_count BIGINT,
    tep_count BIGINT,
    ted_count BIGINT,
    tea_percentage NUMERIC,
    tep_percentage NUMERIC,
    ted_percentage NUMERIC,
    course_count BIGINT,
    student_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
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
        ) as ted_percentage,
        COUNT(DISTINCT c.id) as course_count,
        COUNT(DISTINCT g.student_id) as student_count
    FROM grades g
    JOIN students s ON g.student_id = s.id
    JOIN courses c ON g.course_id = c.id
    WHERE s.school_id = p_school_id
        AND c.cycle = p_cycle
        AND (p_academic_year IS NULL OR g.academic_year = p_academic_year)
        AND (p_semester IS NULL OR g.semester = p_semester);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN PARA OBTENER ESTADÍSTICAS GENERALES DE LA ESCUELA
-- =============================================
CREATE OR REPLACE FUNCTION get_school_statistics(
    p_school_id UUID,
    p_academic_year INTEGER DEFAULT NULL,
    p_semester INTEGER DEFAULT NULL
)
RETURNS TABLE (
    total_grades BIGINT,
    tea_count BIGINT,
    tep_count BIGINT,
    ted_count BIGINT,
    tea_percentage NUMERIC,
    tep_percentage NUMERIC,
    ted_percentage NUMERIC,
    course_count BIGINT,
    student_count BIGINT,
    teacher_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
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
        ) as ted_percentage,
        COUNT(DISTINCT c.id) as course_count,
        COUNT(DISTINCT g.student_id) as student_count,
        COUNT(DISTINCT us.user_id) as teacher_count
    FROM grades g
    JOIN students s ON g.student_id = s.id
    JOIN courses c ON g.course_id = c.id
    JOIN user_schools us ON s.school_id = us.school_id
    WHERE s.school_id = p_school_id
        AND (p_academic_year IS NULL OR g.academic_year = p_academic_year)
        AND (p_semester IS NULL OR g.semester = p_semester)
        AND us.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN PARA OBTENER CALIFICACIONES DE UN ESTUDIANTE
-- =============================================
CREATE OR REPLACE FUNCTION get_student_grades(
    p_student_id UUID,
    p_academic_year INTEGER DEFAULT NULL,
    p_semester INTEGER DEFAULT NULL
)
RETURNS TABLE (
    subject_code VARCHAR(10),
    subject_name VARCHAR(100),
    semester INTEGER,
    period VARCHAR(20),
    numeric_grade NUMERIC,
    tea_grade BOOLEAN,
    tep_grade BOOLEAN,
    ted_grade BOOLEAN,
    attendance_percentage NUMERIC,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sub.code as subject_code,
        sub.name as subject_name,
        g.semester,
        g.period,
        g.numeric_grade,
        g.tea_grade,
        g.tep_grade,
        g.ted_grade,
        g.attendance_percentage,
        g.comments,
        g.created_at
    FROM grades g
    JOIN subjects sub ON g.subject_id = sub.id
    WHERE g.student_id = p_student_id
        AND (p_academic_year IS NULL OR g.academic_year = p_academic_year)
        AND (p_semester IS NULL OR g.semester = p_semester)
    ORDER BY sub.code, g.semester, g.period;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN PARA OBTENER ESTADÍSTICAS DE UN ESTUDIANTE
-- =============================================
CREATE OR REPLACE FUNCTION get_student_statistics(
    p_student_id UUID,
    p_academic_year INTEGER DEFAULT NULL
)
RETURNS TABLE (
    total_grades BIGINT,
    tea_count BIGINT,
    tep_count BIGINT,
    ted_count BIGINT,
    tea_percentage NUMERIC,
    tep_percentage NUMERIC,
    ted_percentage NUMERIC,
    average_attendance NUMERIC,
    subjects_with_grades BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
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
        ) as ted_percentage,
        ROUND(AVG(g.attendance_percentage), 2) as average_attendance,
        COUNT(DISTINCT g.subject_id) as subjects_with_grades
    FROM grades g
    WHERE g.student_id = p_student_id
        AND (p_academic_year IS NULL OR g.academic_year = p_academic_year);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN PARA OBTENER REPORTE DE CALIFICACIONES POR PERÍODO
-- =============================================
CREATE OR REPLACE FUNCTION get_grades_report(
    p_school_id UUID,
    p_academic_year INTEGER,
    p_semester INTEGER DEFAULT NULL,
    p_period VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
    course_name VARCHAR(100),
    student_name VARCHAR(201),
    subject_code VARCHAR(10),
    subject_name VARCHAR(100),
    numeric_grade NUMERIC,
    tea_grade BOOLEAN,
    tep_grade BOOLEAN,
    ted_grade BOOLEAN,
    attendance_percentage NUMERIC,
    teacher_name VARCHAR(201),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.name as course_name,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        sub.code as subject_code,
        sub.name as subject_name,
        g.numeric_grade,
        g.tea_grade,
        g.tep_grade,
        g.ted_grade,
        g.attendance_percentage,
        CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
        g.created_at
    FROM grades g
    JOIN students s ON g.student_id = s.id
    JOIN courses c ON g.course_id = c.id
    JOIN subjects sub ON g.subject_id = sub.id
    LEFT JOIN users u ON g.teacher_id = u.id
    WHERE s.school_id = p_school_id
        AND g.academic_year = p_academic_year
        AND (p_semester IS NULL OR g.semester = p_semester)
        AND (p_period IS NULL OR g.period = p_period)
    ORDER BY c.name, s.last_name, s.first_name, sub.code;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN PARA VALIDAR Y CORREGIR CALIFICACIONES
-- =============================================
CREATE OR REPLACE FUNCTION validate_and_fix_grades()
RETURNS TABLE (
    grade_id UUID,
    student_name VARCHAR(201),
    subject_code VARCHAR(10),
    numeric_grade NUMERIC,
    tea_grade BOOLEAN,
    tep_grade BOOLEAN,
    ted_grade BOOLEAN,
    corrected_tea_grade BOOLEAN,
    corrected_tep_grade BOOLEAN,
    corrected_ted_grade BOOLEAN,
    needs_correction BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id as grade_id,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        sub.code as subject_code,
        g.numeric_grade,
        g.tea_grade,
        g.tep_grade,
        g.ted_grade,
        CASE 
            WHEN g.numeric_grade >= 7 AND g.numeric_grade <= 10 THEN true
            ELSE false
        END as corrected_tea_grade,
        CASE 
            WHEN g.numeric_grade >= 4 AND g.numeric_grade <= 6 THEN true
            ELSE false
        END as corrected_tep_grade,
        CASE 
            WHEN g.numeric_grade >= 1 AND g.numeric_grade <= 3 THEN true
            ELSE false
        END as corrected_ted_grade,
        CASE 
            WHEN g.numeric_grade IS NOT NULL AND (
                (g.numeric_grade >= 7 AND g.numeric_grade <= 10 AND NOT g.tea_grade) OR
                (g.numeric_grade >= 4 AND g.numeric_grade <= 6 AND NOT g.tep_grade) OR
                (g.numeric_grade >= 1 AND g.numeric_grade <= 3 AND NOT g.ted_grade)
            ) THEN true
            ELSE false
        END as needs_correction
    FROM grades g
    JOIN students s ON g.student_id = s.id
    JOIN subjects sub ON g.subject_id = sub.id
    WHERE g.numeric_grade IS NOT NULL
    ORDER BY s.last_name, s.first_name, sub.code;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN PARA OBTENER ESTADÍSTICAS POR MATERIA Y CICLO
-- =============================================
CREATE OR REPLACE FUNCTION get_subject_cycle_statistics(
    p_school_id UUID,
    p_subject_code VARCHAR(10),
    p_cycle VARCHAR(20),
    p_academic_year INTEGER DEFAULT NULL
)
RETURNS TABLE (
    total_grades BIGINT,
    tea_count BIGINT,
    tep_count BIGINT,
    ted_count BIGINT,
    tea_percentage NUMERIC,
    tep_percentage NUMERIC,
    ted_percentage NUMERIC,
    course_count BIGINT,
    student_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
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
        ) as ted_percentage,
        COUNT(DISTINCT c.id) as course_count,
        COUNT(DISTINCT g.student_id) as student_count
    FROM grades g
    JOIN students s ON g.student_id = s.id
    JOIN courses c ON g.course_id = c.id
    JOIN subjects sub ON g.subject_id = sub.id
    WHERE s.school_id = p_school_id
        AND sub.code = p_subject_code
        AND c.cycle = p_cycle
        AND (p_academic_year IS NULL OR g.academic_year = p_academic_year);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMENTARIOS EN FUNCIONES
-- =============================================

COMMENT ON FUNCTION get_subject_statistics IS 'Obtiene estadísticas TEA/TEP/TED para una materia específica';
COMMENT ON FUNCTION get_course_statistics IS 'Obtiene estadísticas TEA/TEP/TED para un curso específico';
COMMENT ON FUNCTION get_cycle_statistics IS 'Obtiene estadísticas TEA/TEP/TED para un ciclo (básico/superior)';
COMMENT ON FUNCTION get_school_statistics IS 'Obtiene estadísticas generales de una escuela';
COMMENT ON FUNCTION get_student_grades IS 'Obtiene todas las calificaciones de un estudiante';
COMMENT ON FUNCTION get_student_statistics IS 'Obtiene estadísticas de rendimiento de un estudiante';
COMMENT ON FUNCTION get_grades_report IS 'Genera reporte detallado de calificaciones';
COMMENT ON FUNCTION validate_and_fix_grades IS 'Valida y sugiere correcciones para calificaciones inconsistentes';
COMMENT ON FUNCTION get_subject_cycle_statistics IS 'Obtiene estadísticas de una materia específica por ciclo';