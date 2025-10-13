-- PARTE 1: Tablas Básicas CORREGIDAS - Sistema Multi-Escolar
-- Copiar y pegar esta parte en Supabase SQL Editor

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA DE ESCUELAS
-- =============================================
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    school_type VARCHAR(50) NOT NULL DEFAULT 'secundaria',
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
    CONSTRAINT schools_type_valid CHECK (school_type IN ('secundaria', 'tecnica', 'agraria', 'comercial', 'artistica', 'otra'))
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
-- TABLA DE MATERIAS POR ESCUELA (NUEVA ESTRUCTURA)
-- =============================================
CREATE TABLE school_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'basica', 'especialidad', 'taller', 'practica', etc.
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT school_subjects_code_not_empty CHECK (LENGTH(TRIM(code)) > 0),
    CONSTRAINT school_subjects_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT school_subjects_code_format CHECK (code ~ '^[A-Z0-9\s\-_]+$'),
    CONSTRAINT school_subjects_category_valid CHECK (category IS NULL OR category IN ('basica', 'especialidad', 'taller', 'practica', 'laboratorio', 'otra')),
    CONSTRAINT school_subjects_unique_school_code UNIQUE(school_id, code)
);

-- =============================================
-- TABLA DE ESPECIALIDADES (Para escuelas técnicas)
-- =============================================
CREATE TABLE specializations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT specializations_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT specializations_code_not_empty CHECK (LENGTH(TRIM(code)) > 0),
    CONSTRAINT specializations_unique_school_code UNIQUE(school_id, code)
);