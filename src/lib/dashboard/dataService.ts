import { supabase } from '../supabase';

export const clean = (val: any) => val ?? 0;
export const normalizar = (str: string) => 
    str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

export async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('perfiles').select('*, entidades(*)').eq('id', user.id).single();
    return data;
}

export async function fetchHoteles(id = null) {
    let q = supabase.from('reportes_hoteleria').select('*, entidades(*)').order('fecha_reporte', { ascending: false });
    if (id) q = q.eq('entidad_id', id);
    const { data } = await q;
    return data || [];
}

export async function fetchMuseos(id = null) {
    let q = supabase.from('reportes_museos').select('*, entidades(*)').order('fecha_reporte', { ascending: false });
    if (id) q = q.eq('entidad_id', id);
    const { data } = await q;
    return data || [];
}

export async function eliminarRegistro(id: string, tabla: string) {
    return await supabase.from(tabla).delete().eq('id', id);
}