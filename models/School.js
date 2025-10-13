const { supabase } = require('../config/database');

class School {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.code = data.code;
    this.address = data.address;
    this.phone = data.phone;
    this.email = data.email;
    this.director_name = data.director_name;
    this.province = data.province;
    this.city = data.city;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Crear nueva escuela
  static async create(schoolData) {
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert(schoolData)
        .select()
        .single();

      if (error) throw error;

      return new School(data);
    } catch (error) {
      throw new Error(`Error al crear escuela: ${error.message}`);
    }
  }

  // Buscar escuela por ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return new School(data);
    } catch (error) {
      throw new Error(`Error al buscar escuela: ${error.message}`);
    }
  }

  // Buscar escuela por código
  static async findByCode(code) {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('code', code)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return new School(data);
    } catch (error) {
      throw new Error(`Error al buscar escuela: ${error.message}`);
    }
  }

  // Obtener todas las escuelas
  static async findAll(filters = {}) {
    try {
      let query = supabase
        .from('schools')
        .select('*')
        .order('name');

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.province) {
        query = query.eq('province', filters.province);
      }

      if (filters.city) {
        query = query.eq('city', filters.city);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(school => new School(school));
    } catch (error) {
      throw new Error(`Error al obtener escuelas: ${error.message}`);
    }
  }

  // Obtener escuelas de un usuario
  static async findByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('user_schools')
        .select(`
          *,
          schools (*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      return data.map(item => ({
        ...new School(item.schools),
        role_in_school: item.role_in_school
      }));
    } catch (error) {
      throw new Error(`Error al obtener escuelas del usuario: ${error.message}`);
    }
  }

  // Actualizar escuela
  async update(updateData) {
    try {
      const { data, error } = await supabase
        .from('schools')
        .update(updateData)
        .eq('id', this.id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar propiedades del objeto
      Object.assign(this, data);
    } catch (error) {
      throw new Error(`Error al actualizar escuela: ${error.message}`);
    }
  }

  // Obtener cursos de la escuela
  async getCourses(academicYear = null) {
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .eq('school_id', this.id)
        .eq('is_active', true)
        .order('year')
        .order('division');

      if (academicYear) {
        query = query.eq('academic_year', academicYear);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      throw new Error(`Error al obtener cursos: ${error.message}`);
    }
  }

  // Obtener estadísticas de la escuela
  async getStats(academicYear = null) {
    try {
      const year = academicYear || new Date().getFullYear();
      
      // Obtener conteos
      const [coursesResult, studentsResult, teachersResult] = await Promise.all([
        supabase
          .from('courses')
          .select('id', { count: 'exact' })
          .eq('school_id', this.id)
          .eq('academic_year', year)
          .eq('is_active', true),
        
        supabase
          .from('students')
          .select('id', { count: 'exact' })
          .eq('school_id', this.id)
          .eq('is_active', true),
        
        supabase
          .from('user_schools')
          .select('user_id', { count: 'exact' })
          .eq('school_id', this.id)
          .eq('is_active', true)
      ]);

      if (coursesResult.error) throw coursesResult.error;
      if (studentsResult.error) throw studentsResult.error;
      if (teachersResult.error) throw teachersResult.error;

      return {
        courses: coursesResult.count || 0,
        students: studentsResult.count || 0,
        teachers: teachersResult.count || 0,
        academic_year: year
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // Obtener usuarios de la escuela
  async getUsers() {
    try {
      const { data, error } = await supabase
        .from('user_schools')
        .select(`
          *,
          users (*)
        `)
        .eq('school_id', this.id)
        .eq('is_active', true);

      if (error) throw error;

      return data.map(item => ({
        ...item.users,
        role_in_school: item.role_in_school
      }));
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  // Desactivar escuela
  async deactivate() {
    try {
      const { error } = await supabase
        .from('schools')
        .update({ is_active: false })
        .eq('id', this.id);

      if (error) throw error;

      this.is_active = false;
    } catch (error) {
      throw new Error(`Error al desactivar escuela: ${error.message}`);
    }
  }
}

module.exports = School;