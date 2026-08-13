import { afterNextRender, Component, ElementRef, effect, input, viewChild } from '@angular/core';
import { select } from 'd3-selection';
import { zoom as d3Zoom } from 'd3-zoom';
import { Dia } from '../../models/dia';
import { MAP_W, MAP_H, project } from './projection';

const NS = 'http://www.w3.org/2000/svg';
const COLOR_NACIMIENTO = '#06fe00';
const COLOR_FALLECIMIENTO = '#fe0000';
const COPIES = [-1, 0, 1];

@Component({
  selector: 'app-map',
  template: `
    <div class="map-container">
      @if (loading) {
        <div class="map-loading">Cargando mapa…</div>
      }
      <svg #svg class="map-svg" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
        <g #zoomLayer></g>
      </svg>
      <span class="map-tip">Rueda para zoom · Arrastrá para mover · Doble click para reiniciar</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .map-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eaf2f9;
      overflow: hidden;
    }

    .map-svg {
      width: 100%;
      height: 100%;
      cursor: grab;
      touch-action: none;
      user-select: none;
    }

    .map-svg:active {
      cursor: grabbing;
    }

    .map-loading {
      position: absolute;
      z-index: 1;
      color: #64748b;
      font-size: 1rem;
    }

    .map-tip {
      position: absolute;
      bottom: 0.5rem;
      right: 0.75rem;
      font-size: 0.7rem;
      color: #64748b;
      background: rgb(255 255 255 / 0.7);
      padding: 0.15rem 0.5rem;
      border-radius: 0.25rem;
      pointer-events: none;
    }
  `,
})
export class MapComponent {
  readonly dia = input<Dia | null>(null);

  private readonly svgRef = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  private readonly zoomLayerRef = viewChild.required<ElementRef<SVGGElement>>('zoomLayer');

  protected loading = true;
  private ready = false;
  private copies: SVGGElement[] = [];

  constructor() {
    afterNextRender(() => {
      void this.init();
    });
    effect(() => {
      this.dia();
      if (this.ready) {
        this.renderMarkers();
      }
    });
  }

  private async init(): Promise<void> {
    const res = await fetch('/world.svg');
    if (!res.ok) {
      console.error('No se pudo cargar world.svg', res.status);
      this.loading = false;
      return;
    }
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const paths = Array.from(doc.querySelectorAll('path'));

    const zoomLayer = this.zoomLayerRef().nativeElement;
    for (const offset of COPIES) {
      const copy = document.createElementNS(NS, 'g');
      copy.setAttribute('class', 'world-copy');
      if (offset !== 0) {
        copy.setAttribute('transform', `translate(${offset * MAP_W} 0)`);
      }
      const countries = document.createElementNS(NS, 'g');
      countries.setAttribute('class', 'countries');
      for (const p of paths) {
        countries.appendChild(document.importNode(p, true));
      }
      const markers = document.createElementNS(NS, 'g');
      markers.setAttribute('class', 'markers');
      copy.append(countries, markers);
      zoomLayer.appendChild(copy);
      this.copies.push(copy);
    }

    this.loading = false;
    this.setupZoom();
    this.ready = true;
    this.renderMarkers();
  }

  private setupZoom(): void {
    const svg = this.svgRef().nativeElement;
    const zoom = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 16])
      .translateExtent([
        [-1e9, -MAP_H],
        [1e9, 2 * MAP_H],
      ])
      .on('zoom', (event) => {
        const t = event.transform;
        const worldW = MAP_W * t.k;
        let x = ((t.x % worldW) + worldW) % worldW;
        if (x > worldW / 2) {
          x -= worldW;
        }
        select(this.zoomLayerRef().nativeElement).attr(
          'transform',
          `translate(${x},${t.y}) scale(${t.k})`,
        );
      });
    select(svg).call(zoom);
  }

  private renderMarkers(): void {
    for (const copy of this.copies) {
      const markers = copy.querySelector('.markers') as SVGGElement | null;
      if (markers) {
        markers.replaceChildren();
      }
    }
    const dia = this.dia();
    if (!dia) {
      return;
    }
    for (const copy of this.copies) {
      const markers = copy.querySelector('.markers') as SVGGElement;
      this.renderMarker(markers, dia.nacimiento, COLOR_NACIMIENTO);
      this.renderMarker(markers, dia.fallecimiento, COLOR_FALLECIMIENTO);
    }
  }

  private renderMarker(
    layer: SVGGElement,
    punto: { lat: number; lon: number; anio: number },
    color: string,
  ): void {
    const { x, y } = project(punto.lat, punto.lon);

    const ellipse = document.createElementNS(NS, 'ellipse');
    ellipse.setAttribute('cx', String(x));
    ellipse.setAttribute('cy', String(y));
    ellipse.setAttribute('rx', '4');
    ellipse.setAttribute('ry', '4');
    ellipse.setAttribute('fill', 'none');
    ellipse.setAttribute('stroke', color);
    ellipse.setAttribute('stroke-width', '1.1');
    layer.appendChild(ellipse);

    const text = document.createElementNS(NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y - 5));
    text.setAttribute('font-size', '6');
    text.setAttribute('fill', color);
    text.setAttribute('stroke', '#000000');
    text.setAttribute('stroke-width', '0.35');
    text.setAttribute('stroke-linejoin', 'round');
    text.setAttribute('paint-order', 'stroke');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = String(punto.anio);
    layer.appendChild(text);
  }
}