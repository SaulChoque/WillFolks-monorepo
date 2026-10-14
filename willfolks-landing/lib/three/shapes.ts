/**
 * Point-cloud formations for the feature showcase. Every generator returns
 * `count` xyz triples that fit roughly inside a 1.5-unit radius, so the
 * particle system can morph between them without rescaling.
 */

type Vec3 = [number, number, number];
type Sampler = (rand: () => number) => Vec3;
type Part = [weight: number, sampler: Sampler];

export type ShapeName = "lock" | "alarm" | "hourglass" | "pin" | "spark" | "coins";

const TAU = Math.PI * 2;

/** Small seeded PRNG so each formation is identical on every visit. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(count: number, seed: number, parts: Part[]): Float32Array {
  const rand = mulberry32(seed);
  const total = parts.reduce((sum, [weight]) => sum + weight, 0);
  const out = new Float32Array(count * 3);
  let written = 0;
  parts.forEach(([weight, sampler], partIndex) => {
    const isLast = partIndex === parts.length - 1;
    const n = isLast ? count - written : Math.round((weight / total) * count);
    for (let i = 0; i < n && written < count; i++, written++) {
      const [x, y, z] = sampler(rand);
      out[written * 3] = x;
      out[written * 3 + 1] = y;
      out[written * 3 + 2] = z;
    }
  });
  return out;
}

// ---------- primitives ----------

const boxSurface =
  (w: number, h: number, d: number, c: Vec3 = [0, 0, 0]): Sampler =>
  (r) => {
    const areas = [w * h, w * h, w * d, w * d, h * d, h * d];
    let pick = r() * (2 * (w * h + w * d + h * d));
    let face = 0;
    while (pick > areas[face] && face < 5) pick -= areas[face++];
    const u = r() - 0.5;
    const v = r() - 0.5;
    const s = face % 2 === 0 ? 0.5 : -0.5;
    if (face < 2) return [c[0] + u * w, c[1] + v * h, c[2] + s * d];
    if (face < 4) return [c[0] + u * w, c[1] + s * h, c[2] + v * d];
    return [c[0] + s * w, c[1] + u * h, c[2] + v * d];
  };

/** Torus lying in the XY plane, optionally a partial arc. */
const torus =
  (R: number, tube: number, c: Vec3 = [0, 0, 0], arcStart = 0, arcLength = TAU): Sampler =>
  (r) => {
    const theta = arcStart + r() * arcLength;
    const phi = r() * TAU;
    const ring = R + tube * Math.cos(phi);
    return [c[0] + ring * Math.cos(theta), c[1] + ring * Math.sin(theta), c[2] + tube * Math.sin(phi)];
  };

/** Torus lying flat in the XZ plane. */
const flatRing =
  (R: number, tube: number, c: Vec3 = [0, 0, 0]): Sampler =>
  (r) => {
    const theta = r() * TAU;
    const phi = r() * TAU;
    const ring = R + tube * Math.cos(phi);
    return [c[0] + ring * Math.cos(theta), c[1] + tube * Math.sin(phi), c[2] + ring * Math.sin(theta)];
  };

const sphere =
  (radius: number, c: Vec3 = [0, 0, 0], minY = -Infinity): Sampler =>
  (r) => {
    for (;;) {
      const u = r() * 2 - 1;
      const theta = r() * TAU;
      const s = Math.sqrt(1 - u * u);
      const y = u * radius;
      if (y >= minY) return [c[0] + s * Math.cos(theta) * radius, c[1] + y, c[2] + s * Math.sin(theta) * radius];
    }
  };

/** Lateral surface between two radii along Y (a cone or cylinder wall). */
const cone =
  (r0: number, y0: number, r1: number, y1: number, c: Vec3 = [0, 0, 0]): Sampler =>
  (r) => {
    // Bias samples towards the wider end so density stays even.
    const big = Math.max(r0, r1);
    for (;;) {
      const t = r();
      const radius = r0 + (r1 - r0) * t;
      if (r() * big <= radius || big === 0) {
        const theta = r() * TAU;
        return [c[0] + Math.cos(theta) * radius, c[1] + y0 + (y1 - y0) * t, c[2] + Math.sin(theta) * radius];
      }
    }
  };

/** Filled cone volume: apex at (y1, r1≈0) widening to (y0, r0). */
const coneFill =
  (r0: number, y0: number, r1: number, y1: number, c: Vec3 = [0, 0, 0]): Sampler =>
  (r) => {
    const big = Math.max(r0, r1);
    for (;;) {
      const t = r();
      const limit = r0 + (r1 - r0) * t;
      if (r() * big * big <= limit * limit) {
        const radius = Math.sqrt(r()) * limit;
        const theta = r() * TAU;
        return [c[0] + Math.cos(theta) * radius, c[1] + y0 + (y1 - y0) * t, c[2] + Math.sin(theta) * radius];
      }
    }
  };

/** Horizontal annulus (XZ plane) with a little thickness. */
const disc =
  (inner: number, outer: number, y: number, thickness = 0.03, c: Vec3 = [0, 0, 0]): Sampler =>
  (r) => {
    const radius = Math.sqrt(inner * inner + r() * (outer * outer - inner * inner));
    const theta = r() * TAU;
    return [c[0] + Math.cos(theta) * radius, c[1] + y + (r() - 0.5) * thickness, c[2] + Math.sin(theta) * radius];
  };

/** Upright annulus (XY plane). */
const face =
  (inner: number, outer: number, c: Vec3 = [0, 0, 0], thickness = 0.03): Sampler =>
  (r) => {
    const radius = Math.sqrt(inner * inner + r() * (outer * outer - inner * inner));
    const theta = r() * TAU;
    return [c[0] + Math.cos(theta) * radius, c[1] + Math.sin(theta) * radius, c[2] + (r() - 0.5) * thickness];
  };

const line =
  (a: Vec3, b: Vec3, thickness = 0.05): Sampler =>
  (r) => {
    const t = r();
    return [
      a[0] + (b[0] - a[0]) * t + (r() - 0.5) * thickness,
      a[1] + (b[1] - a[1]) * t + (r() - 0.5) * thickness,
      a[2] + (b[2] - a[2]) * t + (r() - 0.5) * thickness,
    ];
  };

/** Concave four-point star: the surface |x|^p + |y|^p + |z|^p = 1 with p < 1. */
const star =
  (scale: Vec3, c: Vec3 = [0, 0, 0], p = 0.55): Sampler =>
  (r) => {
    const u = r() * 2 - 1;
    const theta = r() * TAU;
    const s = Math.sqrt(1 - u * u);
    const d: Vec3 = [s * Math.cos(theta), u, s * Math.sin(theta)];
    const k = Math.pow(Math.abs(d[0]) ** p + Math.abs(d[1]) ** p + Math.abs(d[2]) ** p, -1 / p);
    return [c[0] + d[0] * k * scale[0], c[1] + d[1] * k * scale[1], c[2] + d[2] * k * scale[2]];
  };

// ---------- formations ----------

function lock(count: number) {
  return build(count, 11, [
    [50, boxSurface(1.9, 1.45, 0.7, [0, -0.5, 0])],
    [22, torus(0.56, 0.13, [0, 0.58, 0], 0, Math.PI)],
    [5, line([-0.56, 0.22, 0], [-0.56, 0.58, 0], 0.24)],
    [5, line([0.56, 0.22, 0], [0.56, 0.58, 0], 0.24)],
    [9, face(0, 0.19, [0, -0.36, 0.37], 0.02)],
    [9, boxSurface(0.14, 0.42, 0.02, [0, -0.68, 0.37])],
  ]);
}

function alarm(count: number) {
  const ticks: Part[] = Array.from({ length: 12 }, (_, i): Part => {
    const a = (i / 12) * TAU;
    const major = i % 3 === 0;
    const inner = major ? 0.7 : 0.8;
    return [
      major ? 1.4 : 0.8,
      line([Math.cos(a) * inner, Math.sin(a) * inner, 0.02], [Math.cos(a) * 0.92, Math.sin(a) * 0.92, 0.02], 0.045),
    ];
  });
  return build(count, 23, [
    [30, torus(1.08, 0.095)],
    [5, face(0, 1.0, [0, 0, -0.16], 0.02)],
    ...ticks,
    [7, line([0, 0, 0.06], [0, 0.7, 0.06], 0.07)],
    [5, line([0, 0, 0.06], [0.44, 0.2, 0.06], 0.07)],
    [3, sphere(0.1, [0, 0, 0.08])],
    [9, sphere(0.3, [-0.82, 1.06, 0], -0.05)],
    [9, sphere(0.3, [0.82, 1.06, 0], -0.05)],
    [3, boxSurface(0.2, 0.22, 0.2, [0, 1.3, 0])],
    [4, line([-0.68, -0.86, 0], [-0.96, -1.32, 0], 0.11)],
    [4, line([0.68, -0.86, 0], [0.96, -1.32, 0], 0.11)],
  ]);
}

function hourglass(count: number) {
  const posts: Part[] = [0, 1, 2].map((i): Part => {
    const a = (i / 3) * TAU + 0.4;
    const x = Math.cos(a) * 0.88;
    const z = Math.sin(a) * 0.88;
    return [3, line([x, -1.28, z], [x, 1.28, z], 0.06)];
  });
  return build(count, 37, [
    [10, disc(0, 0.92, 1.3, 0.08)],
    [10, disc(0, 0.92, -1.3, 0.08)],
    [21, cone(0.78, 1.24, 0.07, 0.02)],
    [21, cone(0.78, -1.24, 0.07, -0.02)],
    [9, coneFill(0.46, 0.74, 0.05, 0.06)],
    [4, line([0, 0, 0], [0, -0.7, 0], 0.035)],
    [16, coneFill(0.62, -1.22, 0.02, -0.56)],
    ...posts,
  ]);
}

function pin(count: number) {
  return build(count, 41, [
    [40, sphere(0.86, [0, 0.56, 0], -0.42)],
    [26, cone(0.75, 0.14, 0.02, -1.34)],
    [12, torus(0.33, 0.07, [0, 0.6, 0])],
    [9, flatRing(0.52, 0.025, [0, -1.38, 0])],
    [13, flatRing(1.0, 0.025, [0, -1.38, 0])],
  ]);
}

function spark(count: number) {
  return build(count, 53, [
    [60, star([1.3, 1.3, 0.55], [-0.18, -0.12, 0])],
    [20, star([0.52, 0.52, 0.24], [0.98, 0.9, 0.1])],
    [11, star([0.34, 0.34, 0.16], [0.82, -0.94, -0.1])],
    [9, flatRing(1.5, 0.012, [-0.18, -0.12, 0])],
  ]);
}

function coins(count: number) {
  const stack: Part[] = [
    [-1.12, 0],
    [-0.84, 0.1],
    [-0.56, -0.07],
    [-0.28, 0.06],
  ].flatMap(([y, x]): Part[] => [
    [7, cone(0.95, y - 0.1, 0.95, y + 0.1, [x, 0, 0])],
    [5, disc(0.72, 0.95, y + 0.1, 0.01, [x, 0, 0])],
    [3, disc(0.32, 0.46, y + 0.1, 0.01, [x, 0, 0])],
  ]);
  return build(count, 67, [
    ...stack,
    // One coin standing on its edge above the stack.
    [14, torus(0.66, 0.07, [0.16, 0.86, 0])],
    [8, face(0.4, 0.52, [0.16, 0.86, 0], 0.04)],
    [6, line([0.16, 0.56, 0], [0.16, 1.16, 0], 0.09)],
  ]);
}

export const SHAPE_ORDER: ShapeName[] = ["lock", "alarm", "hourglass", "pin", "spark", "coins"];

export function buildShapes(count: number): Record<ShapeName, Float32Array> {
  return {
    lock: lock(count),
    alarm: alarm(count),
    hourglass: hourglass(count),
    pin: pin(count),
    spark: spark(count),
    coins: coins(count),
  };
}
