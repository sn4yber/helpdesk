import { ESTADOS, esEstado, type Estado } from './estados';
import { pool } from './db';
import { validarSeguimiento } from './validation';

export type TicketListItem = {
  codigo: string;
  estado_actual: string;
  created_at: Date;
  nombre: string;
  apellido: string;
  telefono: string;
};

export type TicketDetalle = {
  id: string;
  codigo: string;
  estado_actual: string;
  created_at: Date;
  updated_at: Date;
  nombre: string;
  apellido: string;
  direccion: string;
  telefono: string;
  agente_nombre: string | null;
};

export type SeguimientoItem = {
  id: string;
  estado: string;
  nota: string | null;
  created_at: Date;
  agente_nombre: string | null;
};

export async function contarPorEstado() {
  const totales = Object.fromEntries(ESTADOS.map((estado) => [estado, 0])) as Record<Estado, number>;
  const result = await pool.query<{ estado_actual: string; total: number }>(
    `SELECT estado_actual, COUNT(*)::int AS total
       FROM tickets
      GROUP BY estado_actual`,
  );
  for (const row of result.rows) {
    if (esEstado(row.estado_actual)) totales[row.estado_actual] = Number(row.total);
  }
  return totales;
}

export async function listarTickets(estado: string | null, busqueda: string | null) {
  const filtro = estado && esEstado(estado) ? estado : null;
  const termino = busqueda?.trim() ? escaparLike(busqueda.trim()) : null;
  const result = await pool.query<TicketListItem>(
    `SELECT t.codigo,
            t.estado_actual,
            t.created_at,
            c.nombre,
            c.apellido,
            c.telefono
       FROM tickets t
       JOIN clientes c ON c.id = t.cliente_id
      WHERE ($1::text IS NULL OR t.estado_actual = $1)
        AND (
          $2::text IS NULL
          OR t.codigo ILIKE '%' || $2 || '%' ESCAPE '\\'
          OR c.nombre ILIKE '%' || $2 || '%' ESCAPE '\\'
          OR c.apellido ILIKE '%' || $2 || '%' ESCAPE '\\'
          OR (c.nombre || ' ' || c.apellido) ILIKE '%' || $2 || '%' ESCAPE '\\'
        )
      ORDER BY t.created_at DESC, t.id DESC`,
    [filtro, termino],
  );
  return result.rows;
}

export async function obtenerTicket(codigo: string) {
  const result = await pool.query<TicketDetalle>(
    `SELECT t.id,
            t.codigo,
            t.estado_actual,
            t.created_at,
            t.updated_at,
            c.nombre,
            c.apellido,
            c.direccion,
            c.telefono,
            a.nombre AS agente_nombre
       FROM tickets t
       JOIN clientes c ON c.id = t.cliente_id
       LEFT JOIN agentes a ON a.id = t.agente_id
      WHERE t.codigo = $1`,
    [codigo],
  );
  return result.rows[0] ?? null;
}

export async function listarSeguimientos(ticketId: string) {
  const result = await pool.query<SeguimientoItem>(
    `SELECT s.id, s.estado, s.nota, s.created_at, a.nombre AS agente_nombre
       FROM seguimientos s
       LEFT JOIN agentes a ON a.id = s.agente_id
      WHERE s.ticket_id = $1
      ORDER BY s.created_at DESC, s.id DESC`,
    [ticketId],
  );
  return result.rows;
}

export async function crearTicket(input: {
  nombre: string;
  apellido: string;
  direccion: string;
  telefono: string;
  nota: string | null;
  agenteId: string;
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existente = await client.query<{ id: string }>(
      `SELECT id
         FROM clientes
        WHERE nombre = $1 AND apellido = $2 AND telefono = $3
        ORDER BY id
        LIMIT 1`,
      [input.nombre, input.apellido, input.telefono],
    );

    let clienteId = existente.rows[0]?.id;
    if (!clienteId) {
      const creado = await client.query<{ id: string }>(
        `INSERT INTO clientes (nombre, apellido, direccion, telefono)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [input.nombre, input.apellido, input.direccion, input.telefono],
      );
      clienteId = creado.rows[0].id;
    }

    const ticket = await client.query<{ id: string; codigo: string }>(
      `INSERT INTO tickets (cliente_id, agente_id)
       VALUES ($1, $2)
       RETURNING id, codigo`,
      [clienteId, input.agenteId],
    );

    await client.query(
      `INSERT INTO seguimientos (ticket_id, agente_id, estado, nota)
       VALUES ($1, $2, 'En proceso', $3)`,
      [ticket.rows[0].id, input.agenteId, input.nota],
    );

    await client.query('COMMIT');
    return ticket.rows[0].codigo;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function agregarSeguimiento(input: {
  codigo: string;
  agenteId: string;
  estado: string;
  nota: string;
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const encontrado = await client.query<{ id: string; estado_actual: string }>(
      `SELECT id, estado_actual
         FROM tickets
        WHERE codigo = $1
        FOR UPDATE`,
      [input.codigo],
    );
    const ticket = encontrado.rows[0];
    if (!ticket) {
      await client.query('ROLLBACK');
      return { ok: false as const, notFound: true, errors: [] as string[] };
    }

    const validado = validarSeguimiento(
      { estado: input.estado, nota: input.nota },
      ticket.estado_actual,
    );
    if (validado.errors.length > 0) {
      await client.query('ROLLBACK');
      return { ok: false as const, notFound: false, errors: validado.errors, fields: validado.fields };
    }

    await client.query(
      `INSERT INTO seguimientos (ticket_id, agente_id, estado, nota)
       VALUES ($1, $2, $3, $4)`,
      [ticket.id, input.agenteId, validado.estado, validado.nota],
    );
    await client.query('COMMIT');
    return { ok: true as const };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function eliminarTicket(codigo: string) {
  const result = await pool.query<{ codigo: string }>(
    `DELETE FROM tickets
      WHERE codigo = $1
      RETURNING codigo`,
    [codigo],
  );
  return result.rows[0] ?? null;
}

function escaparLike(valor: string) {
  return valor.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);
}
