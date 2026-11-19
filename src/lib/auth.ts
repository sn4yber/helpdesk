import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 12;

export type AgenteSession = {
  id: string;
  nombre: string;
  email: string;
};

function secretKey() {
  const secret = process.env['SESSION_SECRET'];
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET debe estar definido en .env (mínimo 16 caracteres).');
  }
  return new TextEncoder().encode(secret);
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function sessionCookieOptions() {
  return cookieOptions(SESSION_MAX_AGE);
}

export function hashPassword(password: string) {
  return hash(password, 10);
}

export function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function signSession(agente: AgenteSession) {
  return new SignJWT({ nombre: agente.nombre, email: agente.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(agente.id)
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<AgenteSession> {
  const { payload } = await jwtVerify(token, secretKey());
  if (!payload.sub || typeof payload.nombre !== 'string' || typeof payload.email !== 'string') {
    throw new Error('Sesión inválida');
  }
  return { id: payload.sub, nombre: payload.nombre, email: payload.email };
}
