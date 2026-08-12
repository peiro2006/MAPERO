export interface Punto {
  lat: number;
  lon: number;
  anio: number;
}

export interface Dia {
  nombre: string;
  apodos: string[];
  nacimiento: Punto;
  fallecimiento: Punto;
}