export const ESTADOS = ['En proceso', 'Atendido', 'Finalizado', 'Escalado'] as const;

export type Estado = (typeof ESTADOS)[number];

export function esEstado(value: string): value is Estado {
  return (ESTADOS as readonly string[]).includes(value);
}

export function etiquetaEstado(estado: string) {
  if (estado === 'Escalado') return 'Escalado a dependencia superior';
  return estado;
}

export function claseEstado(estado: string) {
  switch (estado) {
    case 'En proceso':
      return 'bg-blue-100 text-blue-800 ring-blue-200';
    case 'Atendido':
      return 'bg-amber-100 text-amber-900 ring-amber-200';
    case 'Finalizado':
      return 'bg-green-100 text-green-800 ring-green-200';
    case 'Escalado':
      return 'bg-red-100 text-red-800 ring-red-200';
    default:
      return 'bg-stone-100 text-stone-700 ring-stone-200';
  }
}

export function puntoEstado(estado: string) {
  switch (estado) {
    case 'En proceso':
      return 'bg-blue-500';
    case 'Atendido':
      return 'bg-amber-500';
    case 'Finalizado':
      return 'bg-green-600';
    case 'Escalado':
      return 'bg-red-500';
    default:
      return 'bg-stone-400';
  }
}

export function bordeEstado(estado: string) {
  switch (estado) {
    case 'En proceso':
      return 'border-l-blue-500';
    case 'Atendido':
      return 'border-l-amber-500';
    case 'Finalizado':
      return 'border-l-green-600';
    case 'Escalado':
      return 'border-l-red-500';
    default:
      return 'border-l-stone-400';
  }
}
