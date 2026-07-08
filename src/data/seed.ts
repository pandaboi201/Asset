/**
 * Deterministic pseudo-random helpers so mock data is stable across reloads.
 * (A real backend would replace all of this.)
 */

let seed = 0x2f6e2b1;
function rng(): number {
  // Mulberry32
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function resetSeed(value = 0x2f6e2b1) {
  seed = value;
}

export function rand(): number {
  return rng();
}

export function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function pickMany<T>(items: readonly T[], count: number): T[] {
  const pool = [...items];
  const result: T[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(rng() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

export function chance(probability: number): boolean {
  return rng() < probability;
}

/** ISO date string offset by `days` from now (negative = past). */
export function dateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(randInt(8, 18), randInt(0, 59), 0, 0);
  return d.toISOString();
}

export function money(min: number, max: number): number {
  return Math.round((rng() * (max - min) + min) / 5) * 5;
}
