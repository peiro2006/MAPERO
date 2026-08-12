import { Component, inject, signal, viewChild } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Dia } from '../../models/dia';
import { DiasService } from '../../services/dias.service';
import { esRespuestaCorrecta } from '../../utils/normalizar';
import { MapComponent } from '../map/map';

type Estado = 'jugando' | 'resultado';

@Component({
  selector: 'app-juego',
  imports: [MapComponent],
  template: `
    <main class="juego-page">
      <section class="juego-mapa">
        <button class="juego-volver" type="button" (click)="volver()">← Volver</button>
        <span class="juego-contador">Día {{ indiceActual + 1 }} de {{ indice().length }}</span>
        <app-map [dia]="dia()" />

        @if (estado() === 'resultado') {
          <div class="juego-overlay">
            <div class="juego-cartel" [class.correcto]="acerto()" [class.incorrecto]="!acerto()">
              @if (acerto()) {
                <p class="juego-veredicto">¡CORRECTO!</p>
              } @else {
                <p class="juego-veredicto">INCORRECTO...</p>
                <p class="juego-revelacion">Era <strong>{{ dia()?.nombre }}</strong></p>
              }
              <button class="btn btn-primary" type="button" (click)="continuar()">
                {{ esUltimo() ? 'Volver al inicio' : 'Siguiente día' }}
              </button>
            </div>
          </div>
        }
      </section>

      <section class="juego-consola">
        @if (estado() === 'jugando') {
          <p class="juego-pregunta">¿Qué figura histórica es?</p>
          <form class="juego-form" (ngSubmit)="enviar()">
            <input
              #respuesta
              class="juego-input"
              type="text"
              placeholder="Escribí tu respuesta…"
              autocomplete="off"
              [disabled]="enviando"
            />
            <button class="btn btn-primary" type="submit" [disabled]="enviando">
              {{ enviando ? 'Enviando…' : 'Enviar' }}
            </button>
          </form>
          @if (error()) {
            <p class="juego-error" role="alert">{{ error() }}</p>
          }
        }
      </section>
    </main>
  `,
  styles: `
    .juego-page {
      height: 100dvh;
      display: flex;
      flex-direction: column;
      background: #ffffff;
    }

    .juego-mapa {
      position: relative;
      flex: 1 1 80%;
      min-height: 0;
    }

    .juego-volver {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      z-index: 5;
      background: rgb(255 255 255 / 0.9);
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 0.3rem 0.75rem;
      font-size: 0.9rem;
      color: #0f172a;
      cursor: pointer;
    }

    .juego-volver:hover {
      background: #f1f5f9;
    }

    .juego-contador {
      position: absolute;
      top: 3.1rem;
      left: 0.75rem;
      font-size: 0.85rem;
      color: #0f172a;
      background: rgb(255 255 255 / 0.85);
      padding: 0.2rem 0.6rem;
      border-radius: 0.25rem;
    }

    .juego-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgb(15 23 42 / 0.35);
      z-index: 10;
    }

    .juego-cartel {
      background: #ffffff;
      border-radius: 0.75rem;
      padding: 1.5rem 2.25rem;
      box-shadow: 0 10px 30px rgb(0 0 0 / 0.25);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      min-width: 16rem;
    }

    .juego-veredicto {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
    }

    .juego-cartel.correcto .juego-veredicto {
      color: #16a34a;
    }

    .juego-cartel.incorrecto .juego-veredicto {
      color: #dc2626;
    }

    .juego-revelacion {
      margin: 0;
      font-size: 1.05rem;
      color: #0f172a;
    }

    .juego-consola {
      flex: 0 0 20%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: #ffffff;
      border-top: 1px solid #cbd5e1;
    }

    .juego-pregunta {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .juego-form {
      display: flex;
      gap: 0.75rem;
      width: 100%;
      max-width: 36rem;
    }

    .juego-input {
      flex: 1;
      padding: 0.6rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-family: inherit;
    }

    .juego-input:focus {
      outline: 2px solid #2563eb;
      outline-offset: 1px;
      border-color: transparent;
    }

    .juego-input:disabled {
      opacity: 0.6;
    }

    .juego-error {
      margin: 0;
      color: #dc2626;
      font-size: 0.9rem;
    }
  `,
})
export class JuegoComponent {
  private readonly router = inject(Router);
  private readonly dias = inject(DiasService);

  private readonly respuestaRef = viewChild<ElementRef<HTMLInputElement>>('respuesta');

  protected readonly indice = signal<string[]>([]);
  protected indiceActual = 0;
  protected readonly dia = signal<Dia | null>(null);
  protected readonly estado = signal<Estado>('jugando');
  protected readonly acerto = signal(false);
  protected readonly error = signal('');
  protected enviando = false;

  constructor() {
    void this.iniciar();
  }

  protected esUltimo(): boolean {
    return this.indiceActual >= this.indice().length - 1;
  }

  protected async enviar(): Promise<void> {
    const d = this.dia();
    if (!d || this.enviando || this.estado() !== 'jugando') {
      return;
    }
    const texto = this.respuestaRef()?.nativeElement.value ?? '';
    if (!texto.trim()) {
      this.error.set('Escribí una respuesta');
      return;
    }
    this.enviando = true;
    this.acerto.set(esRespuestaCorrecta(d, texto));
    this.error.set('');
    this.estado.set('resultado');
    this.enviando = false;
  }

  protected continuar(): void {
    if (this.esUltimo()) {
      this.volver();
      return;
    }
    void this.cargarDia(this.indiceActual + 1);
  }

  protected volver(): void {
    this.router.navigate(['/home']);
  }

  private async iniciar(): Promise<void> {
    try {
      const idx = await firstValueFrom(this.dias.indice());
      this.indice.set(idx.dias);
      if (idx.dias.length === 0) {
        throw new Error('No hay días cargados');
      }
      await this.cargarDia(0);
    } catch (err) {
      console.error('No se pudo iniciar el juego', err);
      this.error.set('No se pudieron cargar los días');
    }
  }

  private async cargarDia(i: number): Promise<void> {
    this.indiceActual = i;
    this.dia.set(await firstValueFrom(this.dias.dia(this.indice()[i])));
    this.estado.set('jugando');
    this.acerto.set(false);
    this.error.set('');
    this.enviando = false;
    const input = this.respuestaRef();
    if (input) {
      input.nativeElement.value = '';
    }
  }
}