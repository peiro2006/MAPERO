export const MAP_W = 1000;
export const MAP_H = 500;

export interface PuntoProyectado {
  x: number;
  y: number;
}

export function project(lat: number, lon: number): PuntoProyectado {
  return {
    x: ((lon + 180) / 360) * MAP_W,
    y: ((90 - lat) / 180) * MAP_H,
  };
}