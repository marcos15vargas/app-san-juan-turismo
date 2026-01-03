import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const data = await request.json();
  const passwordAleatoria = Math.random().toString(36).slice(-10) + "SJ!"; // Genera algo como "a7b8c9d0SJ!"

  try {
    // 1. Crear la Entidad
    const { data: entidad, error: errEntidad } = await supabaseAdmin
      .from('entidades')
      .insert({
        nombre: data.nombre,
        tipo: data.tipo,
        departamento: data.departamento,
        capacidad_maxima: data.capacidad,
        verificada: true
      })
      .select().single();

    if (errEntidad) throw errEntidad;

    // 2. Crear el Usuario en Auth
    const { data: authUser, error: errAuth } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: passwordAleatoria,
      email_confirm: true, // Confirmamos el email de una vez
      user_metadata: { nombre_completo: data.operador_nombre }
    });

    if (errAuth) throw errAuth;

    // 3. Vincular Entidad en el Perfil
    // El trigger ya creó el perfil, así que lo actualizamos
    const { error: errPerfil } = await supabaseAdmin
      .from('perfiles')
      .update({ 
        entidad_id: entidad.id,
        rol: 'operador_entidad',
        nombre_completo: data.operador_nombre 
      })
      .eq('id', authUser.user.id);

    if (errPerfil) throw errPerfil;

    return new Response(JSON.stringify({
      success: true,
      email: data.email,
      password: passwordAleatoria,
      entidad: entidad.nombre
    }), { status: 200 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};