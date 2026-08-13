export function fechaHoyISO(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  if (!anio || !mes || !dia) {
    return iso;
  }
  return `${dia}-${mes}-${anio}`;
}