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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password });
  }

  register(nombre: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', { nombre, email, password });
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