const formato = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

export function formatoFecha(valor: Date | string) {
  return formato.format(new Date(valor));
}
