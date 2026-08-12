import { Dia } from '../models/dia';

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function esRespuestaCorrecta(dia: Dia, respuesta: string): boolean {
  const r = normalizar(respuesta.trim());
  if (!r) {
    return false;
  }
  return [dia.nombre, ...dia.apodos].some((a) => normalizar(a) === r);
}