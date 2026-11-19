import type { APIRoute } from 'astro';
import { setFlash } from '../../../../lib/flash';
import { agregarSeguimiento } from '../../../../lib/tickets';
import { texto } from '../../../../lib/validation';

export const POST: APIRoute = async ({ params, request, cookies, redirect, locals }) => {
  const agente = locals.agente;
  if (!agente) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const codigo = params.codigo ?? '';
  const destino = `/tickets/${encodeURIComponent(codigo)}`;
  const form = await request.formData();
  const estado = texto(form, 'estado');
  const nota = texto(form, 'nota');

  try {
    const resultado = await agregarSeguimiento({
      codigo,
      agenteId: agente.id,
      estado,
      nota,
    });

    if (!resultado.ok && !resultado.notFound) {
      setFlash(cookies, { errors: resultado.errors, fields: resultado.fields });
    } else if (resultado.ok) {
      setFlash(cookies, { success: 'El estado del ticket se actualizó correctamente.' });
    }
    return redirect(destino, 303);
  } catch (error) {
    console.error(error);
    setFlash(cookies, {
      errors: ['No se pudo registrar el seguimiento. Intenta de nuevo.'],
      fields: { estado: estado.trim(), nota: nota.trim() },
    });
    return redirect(destino, 303);
  }
};
