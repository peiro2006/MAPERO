import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Dia, IndiceDias } from '../models/dia';

@Injectable({ providedIn: 'root' })
export class DiasService {
  private readonly http = inject(HttpClient);

  indice(): Observable<IndiceDias> {
    return this.http
      .get<IndiceDias>('/api/dias')
      .pipe(catchError(() => this.http.get<IndiceDias>('/dias/indice.json')));
  }

  dia(id: string): Observable<Dia> {
    return this.http
      .get<Dia>(`/api/dias/${id}`)
      .pipe(catchError(() => this.http.get<Dia>(`/dias/${id}.json`)));
  }

  crear(dia: Dia): Observable<Dia> {
    return this.http.post<Dia>('/api/admin/dias', dia);
  }

  actualizar(id: number, dia: Dia): Observable<Dia> {
    return this.http.put<Dia>(`/api/admin/dias/${id}`, dia);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/dias/${id}`);
  }
}