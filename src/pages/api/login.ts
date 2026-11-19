import type { APIRoute } from 'astro';
import { pool } from '../../lib/db';
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifyPassword } from '../../lib/auth';
import { setFlash } from '../../lib/flash';
import { texto } from '../../lib/validation';

const MENSAJE = 'Usuario o contraseña incorrectos';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const usuario = texto(form, 'usuario').trim();
  const contrasena = texto(form, 'contrasena').trim();

  const fallo = () => {
    setFlash(cookies, { errors: [MENSAJE], fields: { usuario } });
    return redirect('/login', 303);
  };

  if (!usuario || !contrasena || contrasena.length > 200) return fallo();

  const result = await pool.query<{
    id: string;
    nombre: string;
    email: string;
    password_hash: string;
  }>(
    `SELECT id, nombre, email, password_hash
       FROM agentes
      WHERE email = $1 AND activo = TRUE`,
    [usuario],
  );

  const agente = result.rows[0];
  const valido = agente ? await verifyPassword(contrasena, agente.password_hash) : false;
  if (!agente || !valido) return fallo();

  const token = await signSession({
    id: String(agente.id),
    nombre: agente.nombre,
    email: agente.email,
  });
  cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return redirect('/tickets', 303);
};
