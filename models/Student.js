const { supabase } = require('../config/database');

class Student {
  constructor(data) {
    this.id = data.id;
    this.school_id = data.school_id;
    this.course_id = data.course_id;
    this.student_number = data.student_number;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.dni = data.dni;
    this.birth_date = data.birth_date;
    this.address = data.address;
    this.phone = data.phone;
    this.email = data.email;
    this.emergency_contact_name = data.emergency_contact_name;
    this.emergency_contact_phone = data.emergency_contact_phone;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Crear nuevo estudiante
  static async create(studentData) {
    try {
      // Verificar que el DNI no exista en la misma escuela
      if (studentData.dni) {
        const { data: existingStudent } = await supabase
          .from('students')
          .select('id')
          .eq('school_id', studentData.school_id)
          .eq('dni', studentData.dni)
          .single();

        if (existingStudent) {
          throw new Error('Ya existe un estudiante con este DNI en la escuela');
        }
      }

      const { data, error } = await supabase
        .from('students')
        .insert(studentData)
        .select()
        .single();

      if (error) throw error;

      return new Student(data);
    } catch (error) {
      throw new Error(`Error al crear estudiante: ${error.message}`);
    }
  }

  // Buscar estudiante por ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          courses (*),
          schools (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return new Student(data);
    } catch (error) {
      throw new Error(`Error al buscar estudiante: ${error.message}`);
    }
  }

  // Buscar estudiantes por curso
  static async findByCourse(courseId, filters = {}) {
    try {
      let query = supabase
        .from('students')
        .select(`
          *,
          courses (*)
        `)
        .eq('course_id', courseId)
        .order('last_name')
        .order('first_name');

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(student => new Student(student));
    } catch (error) {
      throw new Error(`Error al buscar estudiantes: ${error.message}`);
    }
  }

  // Buscar estudiantes por escuela
  static async findBySchool(schoolId, filters = {}) {
    try {
      let query = supabase
        .from('students')
        .select(`
          *,
          courses (*)
        `)
        .eq('school_id', schoolId)
        .order('last_name')
        .order('first_name');

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.course_id) {
        query = query.eq('course_id', filters.course_id);
      }

      if (filters.academic_year) {
        query = query.eq('courses.academic_year', filters.academic_year);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(student => new Student(student));
    } catch (error) {
      throw new Error(`Error al buscar estudiantes: ${error.message}`);
    }
  }

  // Buscar estudiante por DNI
  static async findByDNI(dni, schoolId) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          courses (*),
          schools (*)
        `)
        .eq('dni', dni)
        .eq('school_id', schoolId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return new Student(data);
    } catch (error) {
      throw new Error(`Error al buscar estudiante: ${error.message}`);
    }
  }

  // Actualizar estudiante
  async update(updateData) {
    try {
      // Si se está actualizando el DNI, verificar que no exista otro estudiante con el mismo DNI
      if (updateData.dni && updateData.dni !== this.dni) {
        const { data: existingStudent } = await supabase
          .from('students')
          .select('id')
          .eq('school_id', this.school_id)
          .eq('dni', updateData.dni)
          .neq('id', this.id)
          .single();

        if (existingStudent) {
          throw new Error('Ya existe otro estudiante con este DNI en la escuela');
        }
      }

      const { data, error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', this.id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar propiedades del objeto
      Object.assign(this, data);
    } catch (error) {
      throw new Error(`Error al actualizar estudiante: ${error.message}`);
    }
  }

  // Obtener calificaciones del estudiante
  async getGrades(academicYear = null, semester = null) {
    try {
      let query = supabase
        .from('grades')
        .select(`
          *,
          subjects (*)
        `)
        .eq('student_id', this.id)
        .order('academic_year', { ascending: false })
        .order('semester')
        .order('subjects.code');

      if (academicYear) {
        query = query.eq('academic_year', academicYear);
      }

      if (semester) {
        query = query.eq('semester', semester);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      throw new Error(`Error al obtener calificaciones: ${error.message}`);
    }
  }

  // Obtener estadísticas del estudiante
  async getStats(academicYear = null) {
    try {
      const year = academicYear || new Date().getFullYear();
      
      const { data: grades, error } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', this.id)
        .eq('academic_year', year);

      if (error) throw error;

      // Calcular estadísticas
      const stats = {
        total_grades: grades.length,
        tea_count: grades.filter(g => g.tea_grade).length,
        tep_count: grades.filter(g => g.tep_grade).length,
        ted_count: grades.filter(g => g.ted_grade).length,
        average_attendance: 0,
        subjects_with_grades: new Set(grades.map(g => g.subject_id)).size
      };

      // Calcular promedio de asistencia
      const attendanceGrades = grades.filter(g => g.attendance_percentage !== null);
      if (attendanceGrades.length > 0) {
        stats.average_attendance = attendanceGrades.reduce((sum, g) => sum + g.attendance_percentage, 0) / attendanceGrades.length;
      }

      return stats;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // Desactivar estudiante
  async deactivate() {
    try {
      const { error } = await supabase
        .from('students')
        .update({ is_active: false })
        .eq('id', this.id);

      if (error) throw error;

      this.is_active = false;
    } catch (error) {
      throw new Error(`Error al desactivar estudiante: ${error.message}`);
    }
  }

  // Obtener nombre completo
  getFullName() {
    return `${this.first_name} ${this.last_name}`;
  }

  // Obtener datos públicos (sin información sensible)
  toPublicJSON() {
    return {
      id: this.id,
      student_number: this.student_number,
      first_name: this.first_name,
      last_name: this.last_name,
      course_id: this.course_id,
      is_active: this.is_active
    };
  }

  // Importar estudiantes desde CSV
  static async importFromCSV(schoolId, courseId, csvData) {
    try {
      const students = [];
      const errors = [];

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        
        try {
          // Validar datos requeridos
          if (!row.first_name || !row.last_name) {
            errors.push(`Fila ${i + 1}: Nombre y apellido son requeridos`);
            continue;
          }

          const studentData = {
            school_id: schoolId,
            course_id: courseId,
            first_name: row.first_name.trim(),
            last_name: row.last_name.trim(),
            student_number: row.student_number || null,
            dni: row.dni || null,
            birth_date: row.birth_date || null,
            address: row.address || null,
            phone: row.phone || null,
            email: row.email || null,
            emergency_contact_name: row.emergency_contact_name || null,
            emergency_contact_phone: row.emergency_contact_phone || null
          };

          const student = await Student.create(studentData);
          students.push(student);
        } catch (error) {
          errors.push(`Fila ${i + 1}: ${error.message}`);
        }
      }

      return {
        students,
        errors,
        total_processed: csvData.length,
        successful: students.length,
        failed: errors.length
      };
    } catch (error) {
      throw new Error(`Error al importar estudiantes: ${error.message}`);
    }
  }
}

module.exports = Student;


