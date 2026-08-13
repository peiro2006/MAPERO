import { Component, inject, signal, viewChild } from '@angular/core';
import { ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Dia } from '../../models/dia';
import { DiasService } from '../../services/dias.service';
import { fechaHoyISO } from '../../utils/fechas';
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
        <app-map [dia]="dia()" />

        @if (cargando()) {
          <div class="juego-overlay">
            <div class="juego-cartel">
              <p class="juego-revelacion">Cargando…</p>
            </div>
          </div>
        } @else if (sinDia()) {
          <div class="juego-overlay">
            <div class="juego-cartel">
              <p class="juego-revelacion">Hoy no hay día programado</p>
              <button class="btn btn-primary" type="button" (click)="volver()">Volver al inicio</button>
            </div>
          </div>
        } @else if (estado() === 'resultado') {
          <div class="juego-overlay">
            <div class="juego-cartel" [class.correcto]="acerto()" [class.incorrecto]="!acerto()">
              @if (acerto()) {
                <p class="juego-veredicto">¡CORRECTO!</p>
              } @else {
                <p class="juego-veredicto">INCORRECTO...</p>
                <p class="juego-revelacion">Era <strong>{{ dia()?.nombre }}</strong></p>
              }
              <button class="btn btn-primary" type="button" (click)="volver()">Volver al inicio</button>
            </div>
          </div>
        }
      </section>

      <section class="juego-consola">
        @if (estado() === 'jugando' && !sinDia() && !cargando()) {
          <p class="juego-pregunta">¿Qué figura histórica es?</p>
          <form class="juego-form" (ngSubmit)="enviar($event)">
            <input
              #respuesta
              class="juego-input"
              type="text"
              placeholder="Escribí tu respuesta…"
              autocomplete="off"
              [disabled]="enviando()"
              (keydown.enter)="enviar($event)"
            />
            <button class="btn btn-primary" type="button" (click)="enviar()" [disabled]="enviando()">
              {{ enviando() ? 'Enviando…' : 'Enviar' }}
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
  private readonly route = inject(ActivatedRoute);
  private readonly dias = inject(DiasService);

  private readonly respuestaRef = viewChild<ElementRef<HTMLInputElement>>('respuesta');

  protected readonly dia = signal<Dia | null>(null);
  protected readonly estado = signal<Estado>('jugando');
  protected readonly acerto = signal(false);
  protected readonly error = signal('');
  protected readonly cargando = signal(true);
  protected readonly sinDia = signal(false);
  protected readonly enviando = signal(false);

  constructor() {
    void this.iniciar();
  }

  protected enviar(ev?: Event): void {
    ev?.preventDefault();
    const d = this.dia();
    if (!d || this.enviando() || this.estado() !== 'jugando') {
      return;
    }
    const texto = this.respuestaRef()?.nativeElement.value ?? '';
    if (!texto.trim()) {
      this.error.set('Escribí una respuesta');
      return;
    }
    this.enviando.set(true);
    this.acerto.set(esRespuestaCorrecta(d, texto));
    this.error.set('');
    this.estado.set('resultado');
    this.enviando.set(false);
  }

  protected volver(): void {
    this.router.navigate(['/home']);
  }

  private async iniciar(): Promise<void> {
    try {
      const idParam = this.route.snapshot.paramMap.get('id');
      if (idParam) {
        await this.cargarDia(idParam);
        return;
      }
      const idx = await firstValueFrom(this.dias.indice());
      const hoy = fechaHoyISO();
      let resumen = idx.dias.find((d) => d.fecha === hoy);
      if (!resumen) {
        const pasados = idx.dias
          .filter((d) => d.fecha < hoy)
          .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
        resumen = pasados[0] ?? null;
      }
      if (!resumen) {
        this.sinDia.set(true);
        this.cargando.set(false);
        return;
      }
      await this.cargarDia(resumen.id);
    } catch (err) {
      console.error('No se pudo iniciar el juego', err);
      this.sinDia.set(true);
      this.cargando.set(false);
      this.error.set('No se pudieron cargar los días');
    }
  }

  private async cargarDia(id: string): Promise<void> {
    this.dia.set(await firstValueFrom(this.dias.dia(id)));
    this.estado.set('jugando');
    this.acerto.set(false);
    this.error.set('');
    this.enviando.set(false);
    this.sinDia.set(false);
    this.cargando.set(false);
    const input = this.respuestaRef();
    if (input) {
      input.nativeElement.value = '';
    }
  }
}