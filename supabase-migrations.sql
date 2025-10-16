-- ========================================
-- MIGRACIONES PARA SUPABASE
-- SISTEMA DE GESTIÓN DE NOTAS ESCOLARES
-- ========================================

-- 1. Agregar columna group_name a la tabla courses
ALTER TABLE courses 
ADD COLUMN group_name VARCHAR(10);

-- 2. Eliminar restricción UNIQUE existente
ALTER TABLE courses 
DROP CONSTRAINT IF EXISTS courses_school_id_academic_year_year_division_shift_key;

-- 3. Crear nueva restricción UNIQUE con group_name
ALTER TABLE courses 
ADD CONSTRAINT courses_school_id_academic_year_year_division_group_shift_key 
UNIQUE(school_id, academic_year, year, division, group_name, shift);

-- 4. Actualizar tipos de escuela permitidos
ALTER TABLE schools 
DROP CONSTRAINT IF EXISTS schools_school_type_check;

ALTER TABLE schools 
ADD CONSTRAINT schools_school_type_check 
CHECK (school_type IN ('primaria', 'secundaria_comun', 'secundaria_tecnica', 'agrotecnica', 'artistica', 'adultos'));

-- 5. Actualizar ciclos permitidos en courses
ALTER TABLE courses 
DROP CONSTRAINT IF EXISTS courses_cycle_check;

ALTER TABLE courses 
ADD CONSTRAINT courses_cycle_check 
CHECK (cycle IN ('primario', 'basico', 'superior'));

-- 6. Actualizar el rango de años para permitir hasta 7 años (escuelas técnicas)
ALTER TABLE courses 
DROP CONSTRAINT IF EXISTS courses_year_check;

ALTER TABLE courses 
ADD CONSTRAINT courses_year_check 
CHECK (year BETWEEN 1 AND 7);

-- 7. Agregar comentarios para claridad
COMMENT ON COLUMN courses.group_name IS 'Para grupos de talleres (A, B, 1, 2, Alpha, Beta, etc.)';
COMMENT ON COLUMN schools.school_type IS 'Tipo de escuela: primaria, secundaria_comun, secundaria_tecnica, etc.';

-- ========================================
-- VERIFICACIÓN DE MIGRACIONES
-- ========================================

-- Verificar que las columnas existen
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND column_name IN ('group_name', 'year', 'division', 'shift');

-- Verificar restricciones
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'courses' 
AND constraint_type = 'UNIQUE';

-- Verificar tipos de escuela
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%school_type%';

-- ========================================
-- FIN DE MIGRACIONES
-- ========================================
