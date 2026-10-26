// Generates the furniture 3D models (public/models/*.glb) and vendors model-viewer.
// Run: npm run build:models   — outputs are committed; Cloudflare does not run this.
//
// Units are meters, origin at floor centre, +y up, front faces +z. Real-world size
// matters: AR ("View in your room") places the model at exactly this scale.

import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { Document, NodeIO } from "@gltf-transform/core";
import jpeg from "jpeg-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_MODELS = path.join(ROOT, "public/models");
const OUT_VENDOR = path.join(ROOT, "public/vendor");

// Material names are a contract with public/collection/catalog.js (finish swatches
// look materials up by name). Colours are sRGB hex; defaults are per product.
const MATERIALS = {
  Wood: { color: "#a8723f", roughness: 0.55, metallic: 0, texture: true },
  Metal: { color: "#2b2b2b", roughness: 0.38, metallic: 0.9 },
  Fabric: { color: "#cbbfae", roughness: 0.95, metallic: 0 },
  Bedding: { color: "#f1eee8", roughness: 0.92, metallic: 0 },
  BookRed: { color: "#7a2e2e", roughness: 0.7, metallic: 0 },
  BookBlue: { color: "#2f4a5c", roughness: 0.7, metallic: 0 },
  BookSand: { color: "#c9b48a", roughness: 0.75, metallic: 0 },
  BookGreen: { color: "#3e5a3a", roughness: 0.7, metallic: 0 },
};
const BOOKS = ["BookRed", "BookBlue", "BookSand", "BookGreen"];

const T = 0.018; // standard board thickness
const TEXTURE_WORLD_SIZE = 0.5; // one wood texture tile covers 0.5 m

// ---------- deterministic randomness ----------

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tileable 2D value noise: wraps every px lattice cells in x and py in y.
function tileNoise(seed, px, py) {
  const rnd = mulberry32(seed);
  const grid = Float32Array.from({ length: px * py }, rnd);
  const at = (i, j) => grid[(((j % py) + py) % py) * px + (((i % px) + px) % px)];
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const u = smooth(x - xi), v = smooth(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

// ---------- wood grain texture ----------

// Near-white grain so the material's base colour (the finish) does the tinting.
// Grain runs along u; it tiles in both directions.
function woodTextureJpeg(size = 512) {
  const warp = tileNoise(11, 4, 8);
  const drift = tileNoise(23, 2, 4);
  const pores = tileNoise(37, 8, 96);
  const data = Buffer.alloc(size * size * 4);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const u = i / size, v = j / size;
      const t = v * 32 + (warp(u * 4, v * 8) - 0.5) * 0.9 + (drift(u * 2, v * 4) - 0.5) * 0.5;
      const ring = Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * t), 3);
      const L = 0.92 - 0.13 * ring - 0.08 * (pores(u * 8, v * 96) - 0.5);
      const k = (j * size + i) * 4;
      data[k] = Math.round(255 * Math.min(1, L));
      data[k + 1] = Math.round(255 * Math.min(1, L * 0.97));
      data[k + 2] = Math.round(255 * Math.min(1, L * 0.93));
      data[k + 3] = 255;
    }
  }
  return jpeg.encode({ data, width: size, height: size }, 85).data;
}

// ---------- geometry builder ----------

// Planar UVs in world units, grain along the part's longest in-plane axis,
// with a random offset per part so neighbouring boards don't match.
function planarUV(geo, size, rnd) {
  const p = geo.attributes.position, n = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  const ou = rnd(), ov = rnd();
  for (let i = 0; i < p.count; i++) {
    const c = [p.getX(i), p.getY(i), p.getZ(i)];
    const an = [Math.abs(n.getX(i)), Math.abs(n.getY(i)), Math.abs(n.getZ(i))];
    const dom = an[0] >= an[1] && an[0] >= an[2] ? 0 : an[1] >= an[2] ? 1 : 2;
    const [a, b] = [0, 1, 2].filter((k) => k !== dom);
    const [along, across] = size[a] >= size[b] ? [a, b] : [b, a];
    uv[i * 2] = c[along] / TEXTURE_WORLD_SIZE + ou;
    uv[i * 2 + 1] = c[across] / TEXTURE_WORLD_SIZE + ov;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

class Builder {
  constructor(seed = 1) {
    this.groups = new Map();
    this.stack = [new THREE.Matrix4()];
    this.rnd = mulberry32(seed);
  }

  // Build fn's parts under an extra transform (used to place chairs around a table).
  at(position, rotY, fn) {
    const m = new THREE.Matrix4()
      .makeRotationY(rotY)
      .setPosition(new THREE.Vector3(...position));
    this.stack.push(this.stack.at(-1).clone().multiply(m));
    fn();
    this.stack.pop();
  }

  add(material, geo) {
    if (!MATERIALS[material]) throw new Error(`unknown material ${material}`);
    geo.applyMatrix4(this.stack.at(-1));
    if (!this.groups.has(material)) this.groups.set(material, []);
    // RoundedBoxGeometry is non-indexed, the others are indexed: unify, re-index after merge.
    this.groups.get(material).push(geo.index ? geo.toNonIndexed() : geo);
  }

  // Box from extents [x0,x1],[y0,y1],[z0,z1] with softened edges (radius r).
  block(material, [x0, x1], [y0, y1], [z0, z1], { r = 0.002, seg = 1, rotX = 0 } = {}) {
    const size = [x1 - x0, y1 - y0, z1 - z0];
    if (size.some((s) => s <= 0)) throw new Error(`bad extents ${[x0, x1, y0, y1, z0, z1]}`);
    const rr = Math.min(r, Math.min(...size) / 2 - 1e-4);
    const geo = rr > 0 ? new RoundedBoxGeometry(...size, seg, rr) : new THREE.BoxGeometry(...size);
    planarUV(geo, size, this.rnd);
    if (rotX) geo.rotateX(rotX);
    geo.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    this.add(material, geo);
  }

  // Cylinder between two points, radius rFrom at `from` and rTo at `to`.
  rod(material, from, to, rFrom, rTo = rFrom, segments = 16) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const len = a.distanceTo(b);
    const geo = new THREE.CylinderGeometry(rTo, rFrom, len, segments);
    planarUV(geo, [2 * rFrom, len, 2 * rFrom], this.rnd);
    const dir = b.clone().sub(a).normalize();
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
    geo.translate(...a.add(b).multiplyScalar(0.5).toArray());
    this.add(material, geo);
  }

  // Bar handle on a front face at z, centred on (x, y), along "x" or "y".
  handle(x, y, z, length, axis = "y") {
    const h = length / 2, off = 0.025, r = 0.006;
    const [p0, p1] = axis === "y" ? [[x, y - h, z + off], [x, y + h, z + off]] : [[x - h, y, z + off], [x + h, y, z + off]];
    this.rod("Metal", p0, p1, r);
    for (const p of [p0, p1]) {
      const inset = axis === "y" ? [p[0], p[1] + Math.sign(y - p[1]) * 0.015, z] : [p[0] + Math.sign(x - p[0]) * 0.015, p[1], z];
      this.rod("Metal", inset, [inset[0], inset[1], z + off], 0.005);
    }
  }
}

// ---------- furniture ----------

function wardrobe(b) {
  const W = 0.9, H = 1.8, D = 0.55, door = 0.02, plinth = 0.08;
  const zc = [-D / 2, D / 2 - door]; // carcass depth, doors overlay in front
  b.block("Wood", [-W / 2 + 0.02, W / 2 - 0.02], [0, plinth], [-D / 2 + 0.02, D / 2 - 0.05]);
  b.block("Wood", [-W / 2, -W / 2 + T], [0, H], zc);
  b.block("Wood", [W / 2 - T, W / 2], [0, H], zc);
  b.block("Wood", [-W / 2, W / 2], [H - T, H], zc);
  b.block("Wood", [-W / 2 + T, W / 2 - T], [plinth, plinth + T], zc);
  b.block("Wood", [-W / 2 + T, W / 2 - T], [plinth, H - T], [-D / 2, -D / 2 + 0.006], { r: 0 });
  b.block("Wood", [-W / 2 - 0.015, W / 2 + 0.015], [H, H + 0.03], [-D / 2, D / 2 + 0.015], { r: 0.004 });
  const gap = 0.003, zd = [D / 2 - door, D / 2];
  b.block("Wood", [-W / 2 + gap, -gap], [plinth + gap, H - gap], zd, { r: 0.003 });
  b.block("Wood", [gap, W / 2 - gap], [plinth + gap, H - gap], zd, { r: 0.003 });
  b.handle(-0.045, 1.0, D / 2, 0.3, "y");
  b.handle(0.045, 1.0, D / 2, 0.3, "y");
}

function bookshelf(b) {
  const W = 0.8, H = 1.8, D = 0.3, kick = 0.06;
  b.block("Wood", [-W / 2, -W / 2 + T], [0, H], [-D / 2, D / 2]);
  b.block("Wood", [W / 2 - T, W / 2], [0, H], [-D / 2, D / 2]);
  b.block("Wood", [-W / 2, W / 2], [H - T, H], [-D / 2, D / 2]);
  b.block("Wood", [-W / 2 + T, W / 2 - T], [0, kick], [D / 2 - 0.03, D / 2 - 0.012]);
  b.block("Wood", [-W / 2 + T, W / 2 - T], [kick, H - T], [-D / 2, -D / 2 + 0.006], { r: 0 });
  const levels = 5, inner = W - 2 * T;
  const pitch = (H - T - kick) / levels;
  const rnd = mulberry32(5);
  for (let s = 0; s < levels; s++) {
    const y = kick + s * pitch;
    b.block("Wood", [-W / 2 + T, W / 2 - T], [y, y + T], [-D / 2 + 0.006, D / 2 - 0.01]);
    if (s === 0) continue; // keep the bottom shelf clear
    const top = y + T;
    if (s === 3) {
      // a horizontal stack instead of a row
      let yy = top;
      for (let k = 0; k < 4; k++) {
        const th = 0.025 + rnd() * 0.015, w = 0.2 + rnd() * 0.05, d = 0.15 + rnd() * 0.04;
        const x0 = W / 2 - T - 0.03 - w;
        b.block(BOOKS[k % BOOKS.length], [x0, x0 + w], [yy, yy + th], [-D / 2 + 0.02, -D / 2 + 0.02 + d]);
        yy += th;
      }
      continue;
    }
    let x = -W / 2 + T + 0.01;
    const stop = x + inner * (0.45 + rnd() * 0.4);
    while (x < stop) {
      const w = 0.02 + rnd() * 0.025, h = Math.min(pitch - T - 0.03, 0.18 + rnd() * 0.09), d = 0.17 + rnd() * 0.05;
      b.block(BOOKS[Math.floor(rnd() * BOOKS.length)], [x, x + w], [top, top + h], [-D / 2 + 0.01, -D / 2 + 0.01 + d]);
      x += w + 0.001;
    }
  }
}

function diningTable(b, L = 1.8, Dp = 0.9, H = 0.76) {
  const top = 0.03, leg = 0.065, inset = 0.05, apron = 0.08;
  b.block("Wood", [-L / 2, L / 2], [H - top, H], [-Dp / 2, Dp / 2], { r: 0.006 });
  const lx = L / 2 - inset - leg, lz = Dp / 2 - inset - leg;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x0 = sx > 0 ? lx : -lx - leg, z0 = sz > 0 ? lz : -lz - leg;
    b.block("Wood", [x0, x0 + leg], [0, H - top], [z0, z0 + leg], { r: 0.003 });
  }
  const ya = [H - top - apron, H - top];
  b.block("Wood", [-lx, lx], ya, [lz + leg - 0.022, lz + leg - 0.004]);
  b.block("Wood", [-lx, lx], ya, [-lz - leg + 0.004, -lz - leg + 0.022]);
  b.block("Wood", [lx + leg - 0.022, lx + leg - 0.004], ya, [-lz, lz]);
  b.block("Wood", [-lx - leg + 0.004, -lx - leg + 0.022], ya, [-lz, lz]);
}

function diningChair(b) {
  const W = 0.44, D = 0.46, S = 0.45, leg = 0.035;
  const xl = W / 2 - leg, zf = D / 2 - leg, zb = -D / 2;
  for (const x0 of [-W / 2, xl]) {
    b.block("Wood", [x0, x0 + leg], [0, S - 0.02], [zf, zf + leg], { r: 0.003 });
    b.block("Wood", [x0, x0 + leg], [0, 0.92], [zb, zb + leg], { r: 0.003 });
    b.block("Wood", [x0 + 0.008, x0 + leg - 0.008], [0.12, 0.15], [zb + leg, zf], { r: 0.002 });
  }
  const ya = [S - 0.09, S - 0.02];
  b.block("Wood", [-xl, xl], ya, [zf, zf + 0.02]);
  b.block("Wood", [-xl, xl], ya, [zb + 0.005, zb + 0.025]);
  b.block("Wood", [-W / 2 + 0.005, -W / 2 + 0.025], ya, [zb + leg, zf]);
  b.block("Wood", [W / 2 - 0.025, W / 2 - 0.005], ya, [zb + leg, zf]);
  b.block("Wood", [-W / 2, W / 2], [S - 0.02, S], [zb + leg, D / 2], { r: 0.003 });
  b.block("Fabric", [-W / 2 + 0.01, W / 2 - 0.01], [S, S + 0.04], [zb + leg + 0.005, D / 2 - 0.005], { r: 0.015, seg: 2 });
  b.block("Wood", [-xl, xl], [0.8, 0.9], [zb, zb + 0.025], { r: 0.006 });
  b.block("Wood", [-xl, xl], [0.55, 0.59], [zb, zb + 0.025], { r: 0.004 });
  for (const x of [-0.09, 0, 0.09]) {
    b.block("Wood", [x - 0.0175, x + 0.0175], [0.59, 0.8], [zb + 0.004, zb + 0.021], { r: 0.002 });
  }
}

function diningSet(b) {
  diningTable(b);
  const z = 0.7; // chairs pulled slightly out, seat front at the table edge
  for (const x of [-0.45, 0.45]) {
    b.at([x, 0, z], Math.PI, () => diningChair(b));
    b.at([x, 0, -z], 0, () => diningChair(b));
  }
  b.at([1.15, 0, 0], -Math.PI / 2, () => diningChair(b));
  b.at([-1.15, 0, 0], Math.PI / 2, () => diningChair(b));
}

function coffeeTable(b) {
  const L = 1.1, Dp = 0.6, H = 0.45, leg = 0.05, inset = 0.04;
  b.block("Wood", [-L / 2, L / 2], [H - 0.03, H], [-Dp / 2, Dp / 2], { r: 0.01, seg: 3 });
  const lx = L / 2 - inset - leg, lz = Dp / 2 - inset - leg;
  for (const x0 of [-lx - leg, lx]) for (const z0 of [-lz - leg, lz]) {
    b.block("Wood", [x0, x0 + leg], [0, H - 0.03], [z0, z0 + leg], { r: 0.004 });
  }
  b.block("Wood", [-lx, lx], [0.1, 0.1 + T], [-lz - leg + 0.01, lz + leg - 0.01], { r: 0.003 });
  b.block("Wood", [-lx, lx], [H - 0.09, H - 0.03], [lz + leg - 0.02, lz + leg - 0.004]);
  b.block("Wood", [-lx, lx], [H - 0.09, H - 0.03], [-lz - leg + 0.004, -lz - leg + 0.02]);
}

function studyDesk(b) {
  const W = 1.2, D = 0.6, H = 0.75, top = 0.025, ped = 0.4, front = 0.02;
  const yTop = H - top, zc = [-D / 2, D / 2 - front];
  b.block("Wood", [-W / 2, W / 2], [yTop, H], [-D / 2, D / 2], { r: 0.004 });
  const px0 = -W / 2, px1 = -W / 2 + ped;
  b.block("Wood", [px0, px0 + T], [0, yTop], zc);
  b.block("Wood", [px1 - T, px1], [0, yTop], zc);
  b.block("Wood", [px0 + T, px1 - T], [0.04, 0.04 + T], zc);
  b.block("Wood", [px0 + T, px1 - T], [0, 0.04], [D / 2 - 0.06, D / 2 - 0.042]);
  b.block("Wood", [px0 + T, px1 - T], [0.04, yTop], [-D / 2, -D / 2 + 0.006], { r: 0 });
  const gap = 0.004, y0 = 0.04, span = yTop - gap - y0, n = 3;
  for (let k = 0; k < n; k++) {
    const a = y0 + (span * k) / n + gap, c = y0 + (span * (k + 1)) / n;
    b.block("Wood", [px0 + gap, px1 - gap], [a, c], [D / 2 - front, D / 2], { r: 0.003 });
    b.handle((px0 + px1) / 2, c - 0.05, D / 2, 0.14, "x");
  }
  b.block("Wood", [W / 2 - 0.025, W / 2], [0, yTop], [-D / 2, D / 2], { r: 0.003 });
  b.block("Wood", [px1, W / 2 - 0.025], [0.35, yTop], [-D / 2 + 0.03, -D / 2 + 0.03 + T]);
}

function bed(b) {
  const W = 1.6, L = 2.06, rail = [0.12, 0.34], zH = -L / 2, zF = L / 2;
  for (const x0 of [-W / 2, W / 2 - 0.06]) for (const z0 of [zH + 0.04, zF - 0.06]) {
    b.block("Wood", [x0, x0 + 0.06], [0, rail[0]], [z0, z0 + 0.06], { r: 0.004 });
  }
  b.block("Wood", [-W / 2, -W / 2 + 0.03], rail, [zH + 0.04, zF], { r: 0.004 });
  b.block("Wood", [W / 2 - 0.03, W / 2], rail, [zH + 0.04, zF], { r: 0.004 });
  b.block("Wood", [-W / 2, W / 2], [rail[0], 0.42], [zF - 0.03, zF], { r: 0.005 });
  b.block("Wood", [-W / 2, W / 2], [0, 1.05], [zH, zH + 0.04], { r: 0.012, seg: 3 });
  b.block("Fabric", [-W / 2 + 0.08, W / 2 - 0.08], [0.45, 0.98], [zH + 0.04, zH + 0.08], { r: 0.02, seg: 3 });
  const mx = [-W / 2 + 0.035, W / 2 - 0.035], mz = [zH + 0.045, zF - 0.035];
  b.block("Bedding", mx, [0.3, 0.52], mz, { r: 0.04, seg: 4 });
  b.block("Bedding", [mx[0] - 0.01, mx[1] + 0.01], [0.42, 0.55], [-0.15, mz[1] + 0.01], { r: 0.05, seg: 4 });
  for (const x of [-0.37, 0.37]) {
    b.block("Bedding", [x - 0.3, x + 0.3], [0.52, 0.64], [zH + 0.1, zH + 0.48], { r: 0.055, seg: 4, rotX: -0.25 });
  }
}

function sofa(b) {
  const arm = 0.15, W = 2.0, D = 0.88, base = [0.12, 0.3];
  const zBack = -D / 2, zFront = D / 2, xin = W / 2 - arm;
  b.block("Fabric", [-xin, xin], base, [zBack + 0.12, zFront], { r: 0.03, seg: 3 });
  for (const x0 of [-W / 2, xin]) b.block("Fabric", [x0, x0 + arm], [0.12, 0.62], [zBack, zFront], { r: 0.05, seg: 4 });
  b.block("Fabric", [-xin, xin], [0.12, 0.82], [zBack, zBack + 0.16], { r: 0.05, seg: 4 });
  const n = 3, cw = (2 * xin) / n;
  for (let k = 0; k < n; k++) {
    const x0 = -xin + k * cw + 0.004, x1 = x0 + cw - 0.008;
    b.block("Fabric", [x0, x1], [0.3, 0.43], [zBack + 0.16, zFront - 0.005], { r: 0.05, seg: 4 });
    b.block("Fabric", [x0, x1], [0.43, 0.8], [zBack + 0.13, zBack + 0.31], { r: 0.07, seg: 4, rotX: -0.17 });
  }
  for (const x of [-W / 2 + 0.06, W / 2 - 0.06]) for (const z of [zBack + 0.06, zFront - 0.06]) {
    b.rod("Wood", [x, 0, z], [x, 0.12, z], 0.014, 0.022);
  }
}

// id, builder, default colour overrides (sRGB), shown in the catalog
const PRODUCTS = [
  { id: "wardrobe", build: wardrobe, colors: { Wood: "#6b4430" } },
  { id: "bookshelf", build: bookshelf, colors: { Wood: "#d6b98c" } },
  { id: "dining-set", build: diningSet, colors: { Wood: "#a8723f" } },
  { id: "dining-chair", build: diningChair, colors: { Wood: "#a8723f" } },
  { id: "coffee-table", build: coffeeTable, colors: { Wood: "#6b4430" } },
  { id: "study-desk", build: studyDesk, colors: { Wood: "#d6b98c" } },
  { id: "bed", build: bed, colors: { Wood: "#6b4430", Fabric: "#8e8b86" } },
  { id: "sofa", build: sofa, colors: { Wood: "#6b4430", Fabric: "#cbbfae" } },
];

// ---------- glTF output ----------

function srgbHexToLinear(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return [...c.map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))), 1];
}

async function writeModel(product, woodJpeg) {
  const b = new Builder(product.id.length * 7919);
  product.build(b);

  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene(product.id);
  doc.getRoot().setDefaultScene(scene);
  let woodTexture;
  const box = new THREE.Box3();
  let vertices = 0;

  for (const [name, geos] of b.groups) {
    const merged = mergeGeometries(geos, false);
    if (!merged) throw new Error(`${product.id}: could not merge ${name} geometry`);
    const geo = mergeVertices(merged);
    geo.computeBoundingBox();
    box.union(geo.boundingBox);
    vertices += geo.attributes.position.count;

    const spec = MATERIALS[name];
    const material = doc
      .createMaterial(name)
      .setBaseColorFactor(srgbHexToLinear(product.colors[name] ?? spec.color))
      .setRoughnessFactor(spec.roughness)
      .setMetallicFactor(spec.metallic);
    if (spec.texture) {
      woodTexture ??= doc.createTexture("WoodGrain").setImage(woodJpeg).setMimeType("image/jpeg");
      material.setBaseColorTexture(woodTexture);
    }

    const accessor = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
    const index = geo.index.array;
    const prim = doc
      .createPrimitive()
      .setAttribute("POSITION", accessor("VEC3", new Float32Array(geo.attributes.position.array)))
      .setAttribute("NORMAL", accessor("VEC3", new Float32Array(geo.attributes.normal.array)))
      .setAttribute("TEXCOORD_0", accessor("VEC2", new Float32Array(geo.attributes.uv.array)))
      .setIndices(accessor("SCALAR", geo.attributes.position.count > 65535 ? new Uint32Array(index) : new Uint16Array(index)))
      .setMaterial(material);
    scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));
  }

  const glb = await new NodeIO().writeBinary(doc);
  await writeFile(path.join(OUT_MODELS, `${product.id}.glb`), glb);
  const size = box.getSize(new THREE.Vector3()).multiplyScalar(100).toArray().map(Math.round);
  if (Math.abs(box.min.y) > 1e-6) throw new Error(`${product.id}: model must sit on the floor, min y = ${box.min.y}`);
  console.log(`${product.id.padEnd(13)} ${String(Math.round(glb.byteLength / 1024)).padStart(4)} KB  ${String(vertices).padStart(6)} verts  W×D×H ${size[0]}×${size[2]}×${size[1]} cm`);
}

await mkdir(OUT_MODELS, { recursive: true });
await mkdir(OUT_VENDOR, { recursive: true });
const woodJpeg = woodTextureJpeg();
// Same texture for the page's finish swatches (tinted with CSS background-blend-mode).
await mkdir(path.join(ROOT, "public/images"), { recursive: true });
await writeFile(path.join(ROOT, "public/images/wood-grain.jpg"), woodJpeg);
for (const product of PRODUCTS) await writeModel(product, woodJpeg);
await copyFile(
  path.join(ROOT, "node_modules/@google/model-viewer/dist/model-viewer.min.js"),
  path.join(OUT_VENDOR, "model-viewer.min.js"),
);
console.log("vendored model-viewer.min.js");
