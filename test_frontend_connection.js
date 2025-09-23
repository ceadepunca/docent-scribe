// Script para probar la conexión desde el frontend
// Ejecutar en la consola del navegador (F12)

// 1. Verificar que Supabase está disponible
console.log('Supabase client:', window.supabase || 'No encontrado');

// 2. Probar una consulta simple
if (window.supabase) {
  window.supabase
    .from('evaluations')
    .select('count')
    .then(({ data, error }) => {
      if (error) {
        console.error('Error de conexión:', error);
      } else {
        console.log('Conexión exitosa. Total de evaluaciones:', data);
      }
    });
} else {
  console.log('Supabase no está disponible en window');
}
