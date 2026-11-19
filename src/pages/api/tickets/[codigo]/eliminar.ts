import type { APIRoute } from 'astro';
import { setFlash } from '../../../../lib/flash';
import { eliminarTicket } from '../../../../lib/tickets';

export const POST: APIRoute = async ({ params, cookies, redirect, locals }) => {
  if (!locals.agente) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const codigo = params.codigo ?? '';

  try {
    const eliminado = await eliminarTicket(codigo);
    if (!eliminado) {
      setFlash(cookies, { errors: ['El ticket ya no existe o fue eliminado anteriormente.'] });
    } else {
      setFlash(cookies, { success: `El ticket ${eliminado.codigo} se eliminó correctamente.` });
    }
  } catch (error) {
    console.error(error);
    setFlash(cookies, { errors: ['No se pudo eliminar el ticket. Intenta de nuevo.'] });
  }

  return redirect('/tickets', 303);
};
