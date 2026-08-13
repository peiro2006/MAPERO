export interface Punto {
  lat: number;
  lon: number;
  anio: number;
}

export interface Dia {
  nombre: string;
  apodos: string[];
  fecha: string;
  nacimiento: Punto;
  fallecimiento: Punto;
}

export interface DiaResumen {
  id: string;
  nombre: string;
  fecha: string;
}

export interface IndiceDias {
  dias: DiaResumen[];
}