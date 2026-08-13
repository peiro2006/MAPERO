import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DiaResumen } from '../../models/dia';
import { DiasService } from '../../services/dias.service';
import { fechaHoyISO, formatearFecha } from '../../utils/fechas';

@Component({
  selector: 'app-dias-anteriores',
  template: `
    <main class="da-page">
      <section class="da-lista">
        <button class="da-volver" type="button" (click)="volver()">Volver</button>
        @if (cargando()) {
          <p class="da-vacio">Cargando…</p>
        } @else if (dias().length === 0) {
          <p class="da-vacio">Todavía no hay días anteriores.</p>
        } @else {
          <ul class="da-filas">
            @for (d of dias(); track d.id) {
              <li>
                <button
                  class="da-fila"
                  [class.seleccionada]="seleccionId() === d.id"
                  type="button"
                  (click)="seleccionar(d)"
                >
                  {{ formatearFecha(d.fecha) }}
                </button>
              </li>
            }
          </ul>
        }
      </section>

      <section class="da-consola">
        <button
          class="btn btn-primary btn-jugar"
          type="button"
          [disabled]="!seleccionId()"
          (click)="jugar()"
        >
          ¡JUGAR!
        </button>
      </section>
    </main>
  `,
  styles: `
    .da-page {
      height: 100dvh;
      display: flex;
      flex-direction: column;
      background: #ffffff;
    }

    .da-lista {
      position: relative;
      flex: 1 1 80%;
      min-height: 0;
      overflow-y: auto;
      background: #eaf2f9;
      padding: 1.5rem;
    }

    .da-volver {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      z-index: 5;
      background: rgb(255 255 255 / 0.9);
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 0.3rem 0.75rem;
      font-size: 0.9rem;
      color: #0f172a;
      cursor: pointer;
    }

    .da-volver:hover {
      background: #f1f5f9;
    }

    .da-vacio {
      margin: 0;
      padding-top: 3rem;
      text-align: center;
      color: #64748b;
    }

    .da-filas {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 40rem;
      margin-inline: auto;
      padding-top: 2.5rem;
    }

    .da-fila {
      width: 100%;
      padding: 1rem 1.25rem;
      border: 2px solid #cbd5e1;
      border-radius: 0.625rem;
      background: #ffffff;
      font-size: 1.05rem;
      font-family: inherit;
      color: #0f172a;
      cursor: pointer;
      text-align: left;
    }

    .da-fila:hover {
      border-color: #94a3b8;
    }

    .da-fila.seleccionada {
      border-color: #2563eb;
      background: #eff6ff;
      box-shadow: 0 0 0 2px rgb(37 99 235 / 0.25);
    }

    .da-consola {
      flex: 0 0 20%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: #ffffff;
      border-top: 1px solid #cbd5e1;
    }

    .da-consola .btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  `,
})
export class DiasAnterioresComponent {
  private readonly router = inject(Router);
  private readonly diasService = inject(DiasService);

  protected readonly dias = signal<DiaResumen[]>([]);
  protected readonly seleccionId = signal<string | null>(null);
  protected readonly cargando = signal(true);

  constructor() {
    void this.cargar();
  }

  protected formatearFecha = formatearFecha;

  protected seleccionar(d: DiaResumen): void {
    this.seleccionId.set(d.id);
  }

  protected jugar(): void {
    const id = this.seleccionId();
    if (id) {
      this.router.navigate(['/juego', id]);
    }
  }

  protected volver(): void {
    this.router.navigate(['/home']);
  }

  private async cargar(): Promise<void> {
    try {
      const idx = await firstValueFrom(this.diasService.indice());
      const hoy = fechaHoyISO();
      this.dias.set(idx.dias.filter((d) => d.fecha < hoy).sort((a, b) => (a.fecha < b.fecha ? 1 : -1)));
    } catch (err) {
      console.error('No se pudieron cargar los días anteriores', err);
    } finally {
      this.cargando.set(false);
    }
  }
}