const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar que las credenciales estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Faltan las variables de entorno de Supabase');
  console.error('Asegúrate de tener configuradas:');
  console.error('- SUPABASE_URL');
  console.error('- SUPABASE_ANON_KEY');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Cliente para operaciones del lado del cliente
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Cliente para operaciones del lado del servidor (con service role key)
const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Verificar que los clientes se crearon correctamente
if (!supabase || !supabaseAdmin) {
  console.error('❌ Error: No se pudieron crear los clientes de Supabase');
  process.exit(1);
}

console.log('✅ Cliente de Supabase configurado correctamente');
console.log(`📡 URL: ${supabaseUrl}`);

module.exports = {
  supabase,
  supabaseAdmin
};

