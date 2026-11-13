// Configuración de Supabase (la base de datos).
// Copia estos dos valores de tu proyecto en Supabase: Project Settings → API (o "Connect").
// La "anon / publishable key" está hecha para ir en páginas públicas: tus datos los protegen
// las reglas de seguridad (RLS) del archivo supabase.sql. NUNCA pongas aquí la "service_role / secret key".
window.FINANZAS_CONFIG = {
  supabaseUrl: "PEGA_AQUI_TU_PROJECT_URL",   // ejemplo: https://abcdefghijk.supabase.co
  supabaseKey: "PEGA_AQUI_TU_ANON_KEY"       // empieza con eyJ... o sb_publishable_...
};
