import { afterNextRender, ChangeDetectorRef, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomTransform } from 'd3-zoom';
import { firstValueFrom } from 'rxjs';
import { Dia, DiaResumen } from '../../models/dia';
import { DiasService } from '../../services/dias.service';
import { AuthService } from '../../services/auth.service';
import { MAP_W, MAP_H, project, unproject } from '../map/projection';
import { formatearFecha } from '../../utils/fechas';

const NS = 'http://www.w3.org/2000/svg';
const COLOR_NACIMIENTO = '#06fe00';
const COLOR_FALLECIMIENTO = '#fe0000';
const CLAMP_X = 8;
const CLAMP_Y = 6;

@Component({
  selector: 'app-admin',
  template: `
    <main class="admin-page">
      <button class="admin-volver" type="button" (click)="volver()">Volver</button>

      <section class="admin-editor">
        <div class="admin-mapa">
          @if (cargandoMapa()) {
            <div class="admin-cargando">Cargando mapa…</div>
          }
          <svg #svg class="admin-svg" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
            <g #zoomLayer></g>
          </svg>
          <span class="admin-tip">Arrastrá los círculos · Rueda para zoom · Arrastrá el mapa para mover</span>
        </div>

        <aside class="admin-panel">
          <h2 class="admin-titulo">{{ editandoId() === null ? 'Nuevo día' : 'Editando día' }}</h2>

          <label class="admin-campo">
            Nombre
            <input class="admin-input" [value]="nombre" (input)="nombre = $any($event.target).value" placeholder="José de San Martín" />
          </label>

          <div class="admin-grid">
            <label class="admin-campo">
              Año nacimiento
              <input class="admin-input" type="number" [value]="anioNac" (input)="anioNac = num($event)" />
            </label>
            <label class="admin-campo">
              Año fallecimiento
              <input class="admin-input" type="number" [value]="anioFall" (input)="anioFall = num($event)" />
            </label>
          </div>

          <div class="admin-grid">
            <label class="admin-campo">
              Lat nacimiento
              <input class="admin-input" type="number" step="0.01" [value]="latNac" (input)="latNac = num($event); pintarCirculos()" />
            </label>
            <label class="admin-campo">
              Lon nacimiento
              <input class="admin-input" type="number" step="0.01" [value]="lonNac" (input)="lonNac = num($event); pintarCirculos()" />
            </label>
          </div>

          <div class="admin-grid">
            <label class="admin-campo">
              Lat fallecimiento
              <input class="admin-input" type="number" step="0.01" [value]="latFall" (input)="latFall = num($event); pintarCirculos()" />
            </label>
            <label class="admin-campo">
              Lon fallecimiento
              <input class="admin-input" type="number" step="0.01" [value]="lonFall" (input)="lonFall = num($event); pintarCirculos()" />
            </label>
          </div>

          <label class="admin-campo">
            Fecha de disponibilidad (AAAA-MM-DD)
            <input class="admin-input" type="date" [value]="fecha" (input)="fecha = $any($event.target).value" />
          </label>

          <label class="admin-campo">
            Respuestas correctas (separadas por coma)
            <input class="admin-input" [value]="apodosTexto" (input)="apodosTexto = $any($event.target).value" placeholder="san martin, jose de san martin" />
          </label>

          <pre class="admin-preview">{{ previewJson() }}</pre>

          @if (aviso()) {
            <p class="admin-aviso" [class.error]="avisoError()" role="status">{{ aviso() }}</p>
          }

          <div class="admin-acciones">
            <button class="btn btn-primary" type="button" [disabled]="guardando()" (click)="guardar()">
              {{ guardando() ? 'Guardando…' : 'Guardar' }}
            </button>
            @if (editandoId() !== null) {
              <button class="btn btn-secondary" type="button" [disabled]="guardando()" (click)="eliminar()">Eliminar</button>
            }
            <button class="btn btn-secondary" type="button" (click)="nuevo()">Nuevo</button>
          </div>

          <div class="admin-lista">
            <h3 class="admin-sublista">Días existentes</h3>
            @for (d of dias(); track d.id) {
              <button class="admin-fila" [class.seleccionado]="editandoId() === d.id" type="button" (click)="editar(d)">
                {{ formatearFecha(d.fecha) }} — {{ d.nombre }}
              </button>
            } @empty {
              <p class="admin-vacio">Todavía no hay días guardados.</p>
            }
          </div>
        </aside>
      </section>
    </main>
  `,
  styles: `
    :host {
      display: block;
      height: 100dvh;
    }

    .admin-page {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #ffffff;
    }

    .admin-volver {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      z-index: 20;
      background: rgb(255 255 255 / 0.9);
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 0.3rem 0.75rem;
      font-size: 0.9rem;
      color: #0f172a;
      cursor: pointer;
    }

    .admin-volver:hover {
      background: #f1f5f9;
    }

    .admin-editor {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
    }

    .admin-mapa {
      position: relative;
      flex: 1 1 60%;
      min-width: 0;
      background: #eaf2f9;
      overflow: hidden;
    }

    .admin-svg {
      width: 100%;
      height: 100%;
      cursor: grab;
      touch-action: none;
      user-select: none;
    }

    .admin-svg:active {
      cursor: grabbing;
    }

    .admin-cargando {
      position: absolute;
      z-index: 1;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
    }

    .admin-tip {
      position: absolute;
      bottom: 0.5rem;
      left: 0.75rem;
      font-size: 0.7rem;
      color: #64748b;
      background: rgb(255 255 255 / 0.7);
      padding: 0.15rem 0.5rem;
      border-radius: 0.25rem;
      pointer-events: none;
    }

    .admin-panel {
      flex: 0 0 40%;
      overflow-y: auto;
      padding: 1rem 1.25rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      background: #ffffff;
      border-left: 1px solid #cbd5e1;
    }

    .admin-titulo {
      margin: 0;
      font-size: 1.15rem;
    }

    .admin-campo {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.8rem;
      color: #475569;
    }

    .admin-grid {
      display: flex;
      gap: 0.6rem;
    }

    .admin-grid .admin-campo {
      flex: 1;
    }

    .admin-input {
      padding: 0.45rem 0.6rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.4rem;
      font-size: 0.95rem;
      font-family: inherit;
      color: #0f172a;
    }

    .admin-input:focus {
      outline: 2px solid #2563eb;
      outline-offset: 1px;
      border-color: transparent;
    }

    .admin-preview {
      margin: 0;
      padding: 0.6rem;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 0.4rem;
      font-size: 0.7rem;
      line-height: 1.35;
      color: #334155;
      max-height: 9rem;
      overflow: auto;
      white-space: pre;
    }

    .admin-aviso {
      margin: 0;
      font-size: 0.85rem;
      color: #16a34a;
    }

    .admin-aviso.error {
      color: #dc2626;
    }

    .admin-acciones {
      display: flex;
      gap: 0.6rem;
    }

    .admin-lista {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .admin-sublista {
      margin: 0.5rem 0 0;
      font-size: 0.95rem;
    }

    .admin-fila {
      text-align: left;
      padding: 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.4rem;
      background: #ffffff;
      font-size: 0.85rem;
      font-family: inherit;
      color: #0f172a;
      cursor: pointer;
    }

    .admin-fila:hover {
      border-color: #94a3b8;
    }

    .admin-fila.seleccionado {
      border-color: #2563eb;
      background: #eff6ff;
    }

    .admin-vacio {
      margin: 0;
      font-size: 0.85rem;
      color: #64748b;
    }
  `,
})
export class AdminComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly diasService = inject(DiasService);

  private readonly svgRef = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  private readonly zoomLayerRef = viewChild.required<ElementRef<SVGGElement>>('zoomLayer');
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly dias = signal<DiaResumen[]>([]);
  protected readonly editandoId = signal<number | string | null>(null);
  protected readonly aviso = signal('');
  protected readonly avisoError = signal(false);

  protected cargandoMapa = signal(true);
  protected guardando = signal(false);

  protected nombre = '';
  protected apodosTexto = '';
  protected fecha = '';
  protected anioNac = 2026;
  protected anioFall = 2026;
  protected latNac = 0;
  protected lonNac = 0;
  protected latFall = 0;
  protected lonFall = 0;

  private circuloNac: SVGGElement | null = null;
  private circuloFall: SVGGElement | null = null;
  private textoNac: SVGTextElement | null = null;
  private textoFall: SVGTextElement | null = null;
  private circuloArrastrado: 'nac' | 'fall' | null = null;
  private listo = false;

  constructor() {
    if (!this.auth.esAdmin()) {
      void this.router.navigate(['/home']);
      return;
    }
    afterNextRender(() => {
      void this.initMapa();
    });
    void this.cargarLista();
  }

  protected formatearFecha = formatearFecha;

  protected num(ev: Event): number {
    return Number((ev.target as HTMLInputElement).value) || 0;
  }

  protected previewJson(): string {
    const dia: Dia = {
      nombre: this.nombre,
      apodos: this.apodosTexto.split(',').map((a) => a.trim()).filter((a) => a.length > 0),
      fecha: this.fecha,
      nacimiento: { lat: this.latNac, lon: this.lonNac, anio: this.anioNac },
      fallecimiento: { lat: this.latFall, lon: this.lonFall, anio: this.anioFall },
    };
    return JSON.stringify(dia, null, 2);
  }

  protected nuevo(): void {
    this.editandoId.set(null);
    this.nombre = '';
    this.apodosTexto = '';
    this.fecha = '';
    this.anioNac = 2026;
    this.anioFall = 2026;
    this.latNac = 0;
    this.lonNac = 0;
    this.latFall = 0;
    this.lonFall = 0;
    this.aviso.set('');
    this.avisoError.set(false);
    this.pintarCirculos();
  }

  protected async editar(resumen: DiaResumen): Promise<void> {
    try {
      const dia = await firstValueFrom(this.diasService.dia(String(resumen.id)));
      this.editandoId.set(resumen.id);
      this.nombre = dia.nombre;
      this.apodosTexto = dia.apodos.join(', ');
      this.fecha = dia.fecha;
      this.anioNac = dia.nacimiento.anio;
      this.anioFall = dia.fallecimiento.anio;
      this.latNac = dia.nacimiento.lat;
      this.lonNac = dia.nacimiento.lon;
      this.latFall = dia.fallecimiento.lat;
      this.lonFall = dia.fallecimiento.lon;
      this.aviso.set('');
      this.avisoError.set(false);
      this.pintarCirculos();
    } catch {
      this.avisoError.set(true);
      this.aviso.set('No se pudo cargar el día');
    }
  }

  protected async guardar(): Promise<void> {
    if (!this.nombre.trim() || !this.fecha) {
      this.avisoError.set(true);
      this.aviso.set('Falta el nombre o la fecha');
      return;
    }
    this.guardando.set(true);
    this.aviso.set('');
    this.avisoError.set(false);
    const dia: Dia = {
      nombre: this.nombre.trim(),
      apodos: this.apodosTexto.split(',').map((a) => a.trim()).filter((a) => a.length > 0),
      fecha: this.fecha,
      nacimiento: { lat: this.latNac, lon: this.lonNac, anio: this.anioNac },
      fallecimiento: { lat: this.latFall, lon: this.lonFall, anio: this.anioFall },
    };
    try {
      const id = this.editandoId();
      if (id === null) {
        await firstValueFrom(this.diasService.crear(dia));
        this.aviso.set('Día creado');
      } else {
        await firstValueFrom(this.diasService.actualizar(Number(id), dia));
        this.aviso.set('Día actualizado');
      }
      await this.cargarLista();
    } catch {
      this.avisoError.set(true);
      this.aviso.set('No se pudo guardar (¿sesión de administrador?)');
    } finally {
      this.guardando.set(false);
    }
  }

  protected async eliminar(): Promise<void> {
    const id = this.editandoId();
    if (id === null) {
      return;
    }
    this.guardando.set(true);
    try {
      await firstValueFrom(this.diasService.eliminar(Number(id)));
      this.nuevo();
      await this.cargarLista();
    } catch {
      this.avisoError.set(true);
      this.aviso.set('No se pudo eliminar');
    } finally {
      this.guardando.set(false);
    }
  }

  protected volver(): void {
    void this.router.navigate(['/home']);
  }

  private async initMapa(): Promise<void> {
    const res = await fetch('/world.svg');
    if (!res.ok) {
      this.cargandoMapa.set(false);
      return;
    }
    const doc = new DOMParser().parseFromString(await res.text(), 'image/svg+xml');
    const zoomLayer = this.zoomLayerRef().nativeElement;
    const countries = document.createElementNS(NS, 'g');
    for (const p of Array.from(doc.querySelectorAll('path'))) {
      countries.appendChild(document.importNode(p, true));
    }
    const circulos = document.createElementNS(NS, 'g');
    circulos.setAttribute('class', 'admin-circulos');
    const nac = this.crearCirculo(COLOR_NACIMIENTO, 'nac');
    const fall = this.crearCirculo(COLOR_FALLECIMIENTO, 'fall');
    this.circuloNac = nac;
    this.circuloFall = fall;
    this.textoNac = this.crearEtiqueta(COLOR_NACIMIENTO);
    this.textoFall = this.crearEtiqueta(COLOR_FALLECIMIENTO);
    circulos.append(nac, fall, this.textoNac, this.textoFall);
    zoomLayer.append(countries, circulos);

const svg = this.svgRef().nativeElement;
    const zoom = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 20])
      .filter((event) => !(event.target as Element).closest('.admin-circulos'))
      .on('zoom', (event) => {
        select(zoomLayer).attr(
          'transform',
          `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`,
        );
      });
    select(svg).call(zoom);

    this.cargandoMapa.set(false);
    this.listo = true;
    this.pintarCirculos();
  }

  private crearCirculo(color: string, tipo: 'nac' | 'fall'): SVGGElement {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', `admin-circulo admin-${tipo}`);

    const zona = document.createElementNS(NS, 'circle');
    zona.setAttribute('r', '12');
    zona.setAttribute('fill', 'transparent');
    zona.setAttribute('cursor', 'grab');
    g.appendChild(zona);

    const elipse = document.createElementNS(NS, 'ellipse');
    elipse.setAttribute('class', 'admin-elipse');
    elipse.setAttribute('rx', '4');
    elipse.setAttribute('ry', '4');
    elipse.setAttribute('fill', 'none');
    elipse.setAttribute('stroke', color);
    elipse.setAttribute('stroke-width', '1.1');
    g.appendChild(elipse);

    g.addEventListener('pointerdown', (e) => this.iniciarArrastre(tipo, e));
    g.addEventListener('pointermove', (e) => this.arrastrar(e));
    g.addEventListener('pointerup', (e) => this.finArrastre(e));
    g.addEventListener('pointercancel', (e) => this.finArrastre(e));
    return g;
  }

  private crearEtiqueta(color: string): SVGTextElement {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('class', 'admin-etiqueta');
    t.setAttribute('font-size', '6');
    t.setAttribute('fill', color);
    t.setAttribute('stroke', '#000000');
    t.setAttribute('stroke-width', '0.35');
    t.setAttribute('stroke-linejoin', 'round');
    t.setAttribute('paint-order', 'stroke');
    t.setAttribute('text-anchor', 'middle');
    return t;
  }

  protected pintarCirculos(): void {    if (!this.listo) {
      return;
    }
    const svg = this.svgRef().nativeElement;
    const nac = this.circuloNac;
    const fall = this.circuloFall;
    if (nac) {
      this.posicionar(nac, this.textoNac, this.latNac, this.lonNac, this.anioNac);
    }
    if (fall) {
      this.posicionar(fall, this.textoFall, this.latFall, this.lonFall, this.anioFall);
    }
  }

  private posicionar(
    c: SVGGElement,
    t: SVGTextElement | null,
    lat: number,
    lon: number,
    anio: number,
  ): void {
    const { x, y } = project(clampLat(lat), clampLon(lon));
    const elipse = c.querySelector('.admin-elipse');
    if (elipse) {
      elipse.setAttribute('cx', String(x));
      elipse.setAttribute('cy', String(y));
    }
    if (t) {
      t.setAttribute('x', String(x));
      t.setAttribute('y', String(y - 5));
      t.textContent = String(anio);
    }
  }

  private iniciarArrastre(tipo: 'nac' | 'fall', e: PointerEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.circuloArrastrado = tipo;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }

  private arrastrar(e: PointerEvent): void {
    const tipo = this.circuloArrastrado;
    if (!tipo || !this.listo) {
      return;
    }
    const svg = this.svgRef().nativeElement;
    const transform = zoomTransform(svg);
    const ctm = svg.getScreenCTM();
    if (!ctm) {
      return;
    }
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const worldX = (p.x - transform.x) / transform.k;
    const worldY = (p.y - transform.y) / transform.k;
    const { lat, lon } = unproject(clampX(worldX), clampY(worldY));
    if (tipo === 'nac') {
      this.latNac = roundCoords(lat);
      this.lonNac = roundCoords(lon);
    } else {
      this.latFall = roundCoords(lat);
      this.lonFall = roundCoords(lon);
    }
    this.pintarCirculos();
    this.cdr.markForCheck();
  }

  private finArrastre(e: PointerEvent): void {
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    this.circuloArrastrado = null;
  }

  private async cargarLista(): Promise<void> {
    try {
      const idx = await firstValueFrom(this.diasService.indice());
      this.dias.set(idx.dias as unknown as DiaResumen[]);
    } catch {
      this.avisoError.set(true);
      this.aviso.set('No se pudo cargar la lista de días');
    }
  }
}

function clampX(x: number): number {
  return Math.min(Math.max(x, -CLAMP_X), MAP_W + CLAMP_X);
}

function clampY(y: number): number {
  return Math.min(Math.max(y, -CLAMP_Y), MAP_H + CLAMP_Y);
}

function clampLat(lat: number): number {
  return Math.min(Math.max(lat, -90), 90);
}

function clampLon(lon: number): number {
  return Math.min(Math.max(lon, -180), 180);
}

function roundCoords(v: number): number {
  return Math.round(v * 100) / 100;
}