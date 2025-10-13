-- PARTE 2: Cursos y Alumnos CORREGIDOS - Sistema Multi-Escolar
-- Copiar y pegar esta parte en Supabase SQL Editor (después de la Parte 1)

-- =============================================
-- TABLA DE CURSOS
-- =============================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    specialization_id UUID REFERENCES specializations(id) ON DELETE SET NULL,
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
    CONSTRAINT courses_year_valid CHECK (year >= 1 AND year <= 7), -- 7 años para técnicas
    CONSTRAINT courses_division_not_empty CHECK (LENGTH(TRIM(division)) > 0),
    CONSTRAINT courses_cycle_valid CHECK (cycle IN ('basico', 'superior')),
    CONSTRAINT courses_academic_year_valid CHECK (academic_year >= 2020 AND academic_year <= 2030),
    CONSTRAINT courses_unique_school_name_year UNIQUE(school_id, name, academic_year)
);

-- =============================================
-- TABLA DE MATERIAS POR CURSO (NUEVA ESTRUCTURA)
-- =============================================
CREATE TABLE course_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    school_subject_id UUID NOT NULL REFERENCES school_subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    hours_per_week INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT course_subjects_unique_course_subject UNIQUE(course_id, school_subject_id),
    CONSTRAINT course_subjects_hours_valid CHECK (hours_per_week >= 0)
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
-- TABLA DE CONFIGURACIÓN DE MATERIAS POR CICLO (NUEVA)
-- =============================================
CREATE TABLE cycle_subject_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    cycle VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    school_subject_id UUID NOT NULL REFERENCES school_subjects(id) ON DELETE CASCADE,
    is_required BOOLEAN NOT NULL DEFAULT true,
    hours_per_week INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT cycle_templates_cycle_valid CHECK (cycle IN ('basico', 'superior')),
    CONSTRAINT cycle_templates_year_valid CHECK (year >= 1 AND year <= 7),
    CONSTRAINT cycle_templates_hours_valid CHECK (hours_per_week >= 0),
    CONSTRAINT cycle_templates_unique_school_cycle_year_subject UNIQUE(school_id, cycle, year, school_subject_id)
);