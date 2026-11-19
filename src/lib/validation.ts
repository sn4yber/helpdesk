import { esEstado } from './estados';

const TELEFONO = /^[0-9+\-() ]+$/;

export type CamposTicket = {
  nombre: string;
  apellido: string;
  direccion: string;
  telefono: string;
  nota: string;
};

export function texto(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
}

export function validarTicket(input: CamposTicket) {
  const nombre = input.nombre.trim();
  const apellido = input.apellido.trim();
  const direccion = input.direccion.trim();
  const telefono = input.telefono.trim();
  const nota = input.nota.trim();
  const errors: string[] = [];

  if (!nombre) errors.push('El nombre es obligatorio.');
  else if (nombre.length > 80) errors.push('El nombre admite hasta 80 caracteres.');

  if (!apellido) errors.push('El apellido es obligatorio.');
  else if (apellido.length > 80) errors.push('El apellido admite hasta 80 caracteres.');

  if (!direccion) errors.push('La dirección es obligatoria.');
  else if (direccion.length > 200) errors.push('La dirección admite hasta 200 caracteres.');

  if (!telefono) errors.push('El teléfono es obligatorio.');
  else {
    if (telefono.length < 7 || telefono.length > 30) {
      errors.push('El teléfono debe tener entre 7 y 30 caracteres.');
    }
    if (!TELEFONO.test(telefono)) {
      errors.push('El teléfono solo admite dígitos, espacios, +, - y paréntesis.');
    }
  }

  if (nota.length > 1000) errors.push('La nota admite hasta 1000 caracteres.');

  return {
    errors,
    fields: { nombre, apellido, direccion, telefono, nota },
    nota: nota === '' ? null : nota,
  };
}

export function validarSeguimiento(input: { estado: string; nota: string }, actual: string) {
  const estado = input.estado.trim();
  const nota = input.nota.trim();
  const errors: string[] = [];

  if (actual === 'Finalizado') {
    errors.push('El ticket ya está finalizado y no admite más cambios.');
  } else {
    if (!esEstado(estado)) errors.push('El estado no es válido.');
    else if (estado === actual) errors.push('Elige un estado distinto al actual.');
    if (nota.length > 1000) errors.push('La nota admite hasta 1000 caracteres.');
  }

  return {
    errors,
    fields: { estado, nota },
    estado,
    nota: nota === '' ? null : nota,
  };
}
