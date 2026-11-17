// Configuración de Supabase (la base de datos).
// Copia estos dos valores de tu proyecto en Supabase: Project Settings → API (o "Connect").
// La "anon / publishable key" está hecha para ir en páginas públicas: tus datos los protegen
// las reglas de seguridad (RLS) del archivo supabase.sql. NUNCA pongas aquí la "service_role / secret key".
window.FINANZAS_CONFIG = {
  supabaseUrl: "https://qgbwrdunmdywekdquyxi.supabase.co",
  supabaseKey: "sb_publishable_BoSRUuFaVH-DOeIsuuwTgA_x87NbyLT",
  // Atajo "Gasto": el archivo firmado que se publica con la app (atajo/Gasto.shortcut) o un enlace de iCloud. Vacío = solo pasos manuales.
  atajoUrl: "https://www.icloud.com/shortcuts/0a4a7fa84c254325a6791847e1f294b6"
};
