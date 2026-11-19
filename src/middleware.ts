import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, verifySession } from './lib/auth';
import { ensureAdmin } from './lib/seed';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname.replace(/\/+$/, '') || '/';
  if (esRecursoEstatico(path)) return next();

  await ensureAdmin();

  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      context.locals.agente = await verifySession(token);
    } catch {
      context.locals.agente = null;
      context.cookies.delete(SESSION_COOKIE, { path: '/' });
    }
  } else {
    context.locals.agente = null;
  }

  const publico = path === '/login' || path === '/api/login';
  if (!context.locals.agente && !publico) {
    if (path.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
    return context.redirect('/login');
  }

  if (context.locals.agente && path === '/login') {
    return context.redirect('/tickets');
  }

  const response = await next();
  response.headers.set('Cache-Control', 'no-store');
  return response;
});

function esRecursoEstatico(path: string) {
  return path.startsWith('/_') || /\.[a-z0-9]+$/i.test(path);
}
