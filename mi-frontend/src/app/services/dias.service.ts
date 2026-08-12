import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Dia } from '../models/dia';

@Injectable({ providedIn: 'root' })
export class DiasService {
  private readonly http = inject(HttpClient);

  indice(): Observable<{ dias: string[] }> {
    return this.http.get<{ dias: string[] }>('/dias/indice.json');
  }

  dia(id: string): Observable<Dia> {
    return this.http.get<Dia>(`/dias/${id}.json`);
  }
}