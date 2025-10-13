-- PARTE 3: Calificaciones CORREGIDAS - Sistema Multi-Escolar
-- Copiar y pegar esta parte en Supabase SQL Editor (después de la Parte 2)

-- =============================================
-- TABLA DE CALIFICACIONES
-- =============================================
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    school_subject_id UUID NOT NULL REFERENCES school_subjects(id) ON DELETE CASCADE,
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
    CONSTRAINT grades_unique_student_subject_period UNIQUE(student_id, school_subject_id, academic_year, semester, period)
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
    CONSTRAINT data_imports_import_type_valid CHECK (import_type IN ('students', 'grades', 'courses', 'subjects')),
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
    CONSTRAINT reports_report_type_valid CHECK (report_type IN ('grades_summary', 'student_report', 'course_report', 'school_report', 'subject_report')),
    CONSTRAINT reports_status_valid CHECK (status IN ('generating', 'completed', 'failed')),
    CONSTRAINT reports_file_size_valid CHECK (file_size IS NULL OR file_size > 0)
);

-- =============================================
-- TABLA DE CONFIGURACIÓN DE ESCUELA (NUEVA)
-- =============================================
CREATE TABLE school_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20) NOT NULL DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT school_config_key_not_empty CHECK (LENGTH(TRIM(config_key)) > 0),
    CONSTRAINT school_config_type_valid CHECK (config_type IN ('string', 'number', 'boolean', 'json')),
    CONSTRAINT school_config_unique_school_key UNIQUE(school_id, config_key)
);