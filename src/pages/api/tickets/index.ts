import type { APIRoute } from 'astro';
import { setFlash } from '../../../lib/flash';
import { crearTicket } from '../../../lib/tickets';
import { texto, validarTicket } from '../../../lib/validation';

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const agente = locals.agente;
  if (!agente) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const form = await request.formData();
  const validado = validarTicket({
    nombre: texto(form, 'nombre'),
    apellido: texto(form, 'apellido'),
    direccion: texto(form, 'direccion'),
    telefono: texto(form, 'telefono'),
    nota: texto(form, 'nota'),
  });

  if (validado.errors.length > 0) {
    setFlash(cookies, { errors: validado.errors, fields: validado.fields });
    return redirect('/tickets/nuevo', 303);
  }

  try {
    const codigo = await crearTicket({
      nombre: validado.fields.nombre,
      apellido: validado.fields.apellido,
      direccion: validado.fields.direccion,
      telefono: validado.fields.telefono,
      nota: validado.nota,
      agenteId: agente.id,
    });
    setFlash(cookies, { success: `El ticket ${codigo} se creó correctamente.` });
    return redirect(`/tickets/${encodeURIComponent(codigo)}`, 303);
  } catch (error) {
    console.error(error);
    setFlash(cookies, {
      errors: ['No se pudo registrar el ticket. Intenta de nuevo.'],
      fields: validado.fields,
    });
    return redirect('/tickets/nuevo', 303);
  }
};
