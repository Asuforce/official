// Writes public/img/moon.jpg; needs ImageMagick's `magick` on PATH.
import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const W = 4000
const H = 325
const BAR = 28

let seed = 20251021
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const makeNoise = (cellsX, cellsY) => {
  const gx = cellsX + 2
  const gy = cellsY + 2
  const grid = Float32Array.from({ length: gx * gy }, rand)
  return (u, v) => {
    const x = u * cellsX
    const y = v * cellsY
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = x - ix
    const fy = y - iy
    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)
    const a = grid[iy * gx + ix]
    const b = grid[iy * gx + ix + 1]
    const c = grid[(iy + 1) * gx + ix]
    const d = grid[(iy + 1) * gx + ix + 1]
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
  }
}

const fbm = (cellsX, cellsY, octaves) => {
  const layers = Array.from({ length: octaves }, (_, o) => makeNoise(cellsX * 2 ** o, cellsY * 2 ** o))
  return (u, v) => {
    let sum = 0
    let amp = 1
    let norm = 0
    for (const layer of layers) {
      sum += layer(u, v) * amp
      norm += amp
      amp *= 0.5
    }
    return sum / norm
  }
}

const height = new Float32Array(W * H)
const rim = new Float32Array(W * H)

const broad = fbm(10, 2, 5)
const grain = fbm(260, 40, 3)
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    height[y * W + x] = 16 * broad(x / W, y / H) + 2.6 * grain(x / W, y / H)
  }
}

const footprint = (c) => {
  const rx = Math.max(1.2, c.r * (0.2 + 0.8 * (c.y / H)))
  return { rx, ry: Math.max(0.7, rx * 0.4) }
}

const candidates = []
for (let i = 0; i < 4200; i++) {
  const r = Math.min(120, 1.6 * (1 - rand()) ** (-1 / 1.15))
  const y = H * rand() ** 1.35
  candidates.push({ x: rand() * W, y, r, soft: 0.14 + rand() * 0.3, fresh: rand() ** 2 })
}
candidates.sort((a, b) => b.r - a.r)

const craters = []
for (const c of candidates) {
  const f = footprint(c)
  if (f.rx > 3) {
    const clear = craters.every((o) => {
      const g = footprint(o)
      return Math.hypot((c.x - o.x) / (f.rx + g.rx), (c.y - o.y) / (f.ry + g.ry)) > 1.05
    })
    if (!clear) continue
  }
  craters.push(c)
}

for (const c of craters) {
  const scale = 0.2 + 0.8 * (c.y / H)
  const rx = Math.max(1.2, c.r * scale)
  const ry = Math.max(0.7, rx * 0.4)
  const depth = rx * (rx > 24 ? 0.12 : 0.2) * (0.35 + 0.65 * c.fresh)
  const x0 = Math.max(0, Math.floor(c.x - rx * 2.4))
  const x1 = Math.min(W - 1, Math.ceil(c.x + rx * 2.4))
  const y0 = Math.max(0, Math.floor(c.y - ry * 2.4))
  const y1 = Math.min(H - 1, Math.ceil(c.y + ry * 2.4))
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot((x - c.x) / rx, (y - c.y) / ry)
      let dh = 0
      let rm = 0
      if (d < 1) {
        const bowl = rx > 24 ? Math.min(1, (1 - d * d) * 2.4) : 1 - d * d
        dh = -depth * bowl
      }
      const rimShape = Math.exp(-(((d - 1) / c.soft) ** 2))
      dh += depth * 0.5 * rimShape
      if (d > 1) dh += depth * 0.14 * Math.exp(-(d - 1) / 0.9) * (1 - smooth(1.6, 2.35, d))
      rm = rimShape * c.fresh
      height[y * W + x] += dh
      rim[y * W + x] = Math.max(rim[y * W + x], rm)
    }
  }
}

const maria = fbm(4, 1, 5)
const albedoGrain = fbm(520, 80, 3)
const lx = -0.55
const ly = -0.83
const lightC = 0.9
const lightZ = 0.43

const pixels = Buffer.alloc(W * H)
for (let y = 0; y < H; y++) {
  const t = y / H
  for (let x = 0; x < W; x++) {
    const i = y * W + x
    const xl = height[y * W + Math.max(0, x - 1)]
    const xr = height[y * W + Math.min(W - 1, x + 1)]
    const yu = height[Math.max(0, y - 1) * W + x]
    const yd = height[Math.min(H - 1, y + 1) * W + x]
    const gx = (xr - xl) / 2
    const gy = (yd - yu) / 2
    const ndotl = (lightC * (-gx * lx - gy * ly) + lightZ) / Math.sqrt(1 + gx * gx + gy * gy)
    const shade = Math.min(1.5, Math.max(0.06, ndotl / lightZ))

    const sea = smooth(0.45, 0.53, maria(x / W, y / H * 0.6 + 0.2))
    let albedo = 0.82 - 0.4 * sea
    albedo += (albedoGrain(x / W, y / H) - 0.5) * 0.22
    albedo += 0.16 * rim[i]

    const hn = Math.max(-1, Math.min(1, height[i] / 12))
    let lit = 1 - smooth(0.74, 1.0, t + 0.14 * hn)
    lit *= smooth(1, 0.95, t)

    const value = 255 * 0.68 * albedo * shade
    pixels[i] = Math.max(0, Math.min(255, BAR + (value - BAR) * lit))
  }
}

const dir = mkdtempSync(join(tmpdir(), 'moon-'))
const pgm = join(dir, 'moon.pgm')
writeFileSync(pgm, Buffer.concat([Buffer.from(`P5\n${W} ${H}\n255\n`), pixels]))
execFileSync('magick', [pgm, '-quality', '72', '-strip', 'public/img/moon.jpg'])
