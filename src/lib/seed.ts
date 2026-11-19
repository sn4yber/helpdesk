import { hashPassword } from './auth';
import { pool } from './db';

let pending: Promise<void> | null = null;

export function ensureAdmin() {
  if (!pending) {
    pending = seedAdmin().catch((error) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}

async function seedAdmin() {
  const existing = await pool.query('SELECT 1 FROM agentes LIMIT 1');
  if (existing.rowCount) return;

  const passwordHash = await hashPassword('123');
  try {
    await pool.query(
      `INSERT INTO agentes (nombre, email, password_hash)
       VALUES ($1, $2, $3)`,
      ['Administrador', 'admin', passwordHash],
    );
    console.log('Agente de demostración creado (usuario: admin).');
  } catch (error) {
    if (isUniqueViolation(error)) return;
    throw error;
  }
}

function isUniqueViolation(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
