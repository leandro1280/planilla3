const bcrypt = require('bcryptjs');
const { supabase, supabaseAdmin } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.role = data.role;
    this.is_active = data.is_active;
    this.last_login = data.last_login;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Crear un nuevo usuario
  static async create(userData) {
    try {
      const { email, password, first_name, last_name, role } = userData;
      
      // Verificar que el email no exista usando cliente admin
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('El email ya está registrado');
      }

      // Encriptar contraseña
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Crear usuario usando cliente admin para saltarse RLS
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          email,
          password_hash,
          first_name,
          last_name,
          role: role || 'teacher',
          dni: `temp_${Date.now()}`, // DNI temporal
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      return new User(data);
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Usuario no encontrado
        }
        throw error;
      }

      return new User(data);
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  // Buscar usuario por ID
  static async findById(id) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return new User(data);
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  // Verificar contraseña
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.password_hash);
    } catch (error) {
      throw new Error(`Error al verificar contraseña: ${error.message}`);
    }
  }

  // Actualizar último login
  async updateLastLogin() {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', this.id);

      if (error) throw error;

      this.last_login = new Date().toISOString();
    } catch (error) {
      throw new Error(`Error al actualizar último login: ${error.message}`);
    }
  }

  // Cambiar contraseña
  async changePassword(newPassword) {
    try {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);

      const { error } = await supabaseAdmin
        .from('users')
        .update({ password_hash })
        .eq('id', this.id);

      if (error) throw error;

      this.password_hash = password_hash;
    } catch (error) {
      throw new Error(`Error al cambiar contraseña: ${error.message}`);
    }
  }

  // Obtener escuelas del usuario
  async getSchools() {
    try {
      const { data, error } = await supabase
        .from('user_schools')
        .select(`
          *,
          schools (*)
        `)
        .eq('user_id', this.id)
        .eq('is_active', true);

      if (error) throw error;

      return data.map(item => ({
        ...item.schools,
        role_in_school: item.role_in_school
      }));
    } catch (error) {
      throw new Error(`Error al obtener escuelas: ${error.message}`);
    }
  }

  // Asignar usuario a escuela
  async assignToSchool(schoolId, roleInSchool) {
    try {
      const { error } = await supabase
        .from('user_schools')
        .insert({
          user_id: this.id,
          school_id: schoolId,
          role_in_school: roleInSchool
        });

      if (error) throw error;
    } catch (error) {
      throw new Error(`Error al asignar usuario a escuela: ${error.message}`);
    }
  }

  // Obtener datos públicos del usuario (sin información sensible)
  toPublicJSON() {
    return {
      id: this.id,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      role: this.role,
      is_active: this.is_active,
      last_login: this.last_login
    };
  }

  // Obtener nombre completo
  getFullName() {
    return `${this.first_name} ${this.last_name}`;
  }
}

module.exports = User;


