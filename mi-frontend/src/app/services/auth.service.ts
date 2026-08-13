import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface AuthResponse {
  id: number;
  token: string;
  nombre: string;
  email: string;
  rol: string;
}

const SESION_KEY = 'mapero.sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private sesion: AuthResponse | null =
    typeof localStorage !== 'undefined' ? this.leerSesion() : null;

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password });
  }

  register(nombre: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', { nombre, email, password });
  }

  guardarSesion(respuesta: AuthResponse): void {
    this.sesion = respuesta;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SESION_KEY, JSON.stringify(respuesta));
    }
  }

  cerrarSesion(): void {
    this.sesion = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SESION_KEY);
    }
  }

  get token(): string | null {
    return this.sesion?.token ?? null;
  }

  get rol(): string | null {
    return this.sesion?.rol ?? null;
  }

  esAdmin(): boolean {
    return this.sesion?.rol === 'ADMIN';
  }

  private leerSesion(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(SESION_KEY);
      return raw ? (JSON.parse(raw) as AuthResponse) : null;
    } catch {
      return null;
    }
  }

  errorMessage(err: unknown): string {
    const body = (err as { error?: Record<string, string> }).error;
    if (body && typeof body === 'object') {
      if (body['error']) {
        return body['error'];
      }
      const first = Object.values(body)[0];
      if (first) {
        return first;
      }
    }
    return 'Ocurrió un error inesperado';
  }
}