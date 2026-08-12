#!/usr/bin/env node
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';
const DATA_FILE = path.join(__dirname, 'data', 'ne_110m_admin_0_countries.geojson');
const OUT_FILE = path.join(__dirname, '..', 'public', 'world.svg');

const W = 1000;
const H = 500;
const TOLERANCE = 0.35;

const project = ([lon, lat]) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];

function perpDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

function simplifyRing(points, tol) {
  if (points.length < 4) return points;
  let maxD = 0;
  let idx = 0;
  const first = points[0];
  const last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDistance(points[i], first, last);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > tol) {
    const left = simplifyRing(points.slice(0, idx + 1), tol);
    const right = simplifyRing(points.slice(idx), tol);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

function ringToPath(ring) {
  if (ring.length === 0) return null;
  let d = `M${ring[0][0]},${ring[0][1]}`;
  for (let i = 1; i < ring.length; i++) d += `L${ring[i][0]},${ring[i][1]}`;
  return d + 'Z';
}

function geometryToPath(geometry) {
  const polys =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
  let d = '';
  for (const poly of polys) {
    for (const ring of poly) {
      const projected = simplifyRing(ring.map(project), TOLERANCE).map(([x, y]) => [
        Math.round(x * 100) / 100,
        Math.round(y * 100) / 100,
      ]);
      const sub = ringToPath(projected);
      if (sub) d += sub;
    }
  }
  return d || null;
}

function pointInRing(point, ring) {
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point, polygon) {
  if (!pointInRing(point, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(point, polygon[i])) return false;
  }
  return true;
}

function pointInGeometry(point, geometry) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
  return polys.some((p) => pointInPolygon(point, p));
}

async function downloadData() {
  try {
    await access(DATA_FILE);
    console.log(`[+] Usando GeoJSON local: ${path.relative(__dirname, DATA_FILE)}`);
    return;
  } catch {
    /* no existe aun */
  }
  console.log(`[~] Descargando Natural Earth 110m desde GitHub...`);
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Fallo la descarga: HTTP ${res.status}`);
  const text = await res.text();
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, text, 'utf8');
  console.log(`[+] GeoJSON descargado (${(text.length / 1024).toFixed(0)} KB): ${path.relative(__dirname, DATA_FILE)}`);
}

async function main() {
  await downloadData();

  const raw = await readFile(DATA_FILE, 'utf8');
  const geojson = JSON.parse(raw);

  let paths = '';
  let count = 0;
  const seen = new Set();
  for (const feature of geojson.features) {
    const iso = feature.properties?.ISO_A2;
    const eh = feature.properties?.ISO_A2_EH;
    const id = iso && iso !== '-99' ? iso : eh && eh !== '-99' ? eh : feature.properties?.ADM0_A3;
    if (!id || id === 'AQ') continue;
    if (seen.has(id)) continue;
    seen.add(id);
    const d = geometryToPath(feature.geometry);
    if (!d) continue;
    paths += `  <path id="${id}" d="${d}"/>\n`;
    count++;
  }

  const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <g fill="#bcbcbc" fill-rule="evenodd">
${paths}  </g>
</svg>
`;

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, svg, 'utf8');

  const checks = [
    { nombre: 'Yapeyu (nacimiento)', pais: 'AR', lat: -27.79, lon: -55.89 },
    { nombre: 'Boulogne-sur-Mer (fallecimiento)', pais: 'FR', lat: 50.73, lon: 1.59 },
    { nombre: 'Durazno (interior UY)', pais: 'UY', lat: -33.38, lon: -56.52 },
  ];

  console.log(`\n[+] ${count} paises -> ${path.relative(process.cwd(), OUT_FILE)} (${(svg.length / 1024).toFixed(0)} KB)`);
  for (const check of checks) {
    const rawPoint = [check.lon, check.lat];
    let inside = false;
    for (const feature of geojson.features) {
      const iso = feature.properties?.ISO_A2;
      const eh = feature.properties?.ISO_A2_EH;
      const id = iso && iso !== '-99' ? iso : eh && eh !== '-99' ? eh : feature.properties?.ADM0_A3;
      if (id !== check.pais) continue;
      if (pointInGeometry(rawPoint, feature.geometry)) {
        inside = true;
        break;
      }
    }
    if (!inside) {
      for (const feature of geojson.features) {
        const geoIso = feature.properties?.ISO_A2;
        const geoEh = feature.properties?.ISO_A2_EH;
        const geoId = geoIso && geoIso !== '-99' ? geoIso : geoEh && geoEh !== '-99' ? geoEh : feature.properties?.ADM0_A3;
        if (!geoId) continue;
        if (pointInGeometry(rawPoint, feature.geometry)) {
          console.log(`[!] ${check.nombre} (${check.lat},${check.lon}) -> cae en ${id} (esperado ${check.pais}; revisar datos)`);
          break;
        }
      }
    }
    console.log(`${inside ? '[OK]' : '[FAIL]'} ${check.nombre} -> ${check.pais}`);
  }
}

main().catch((err) => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});