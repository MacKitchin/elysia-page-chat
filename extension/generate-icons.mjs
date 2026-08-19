import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "icons");
mkdirSync(dir, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const tag = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([len, tag, data, crc]);
}

function writePng(file, size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pixel(x, y, size);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", ihdr),
      chunk("IDAT", deflateSync(raw)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}

function pixel(x, y, s) {
  const nx = (x + 0.5) / s - 0.5;
  const ny = (y + 0.5) / s - 0.5;
  const ax = Math.abs(nx);
  const ay = Math.abs(ny);
  const radius = 0.46;
  const inRound =
    ax < radius &&
    ay < radius &&
    (ax < 0.3 || ay < 0.3 || Math.hypot(ax - 0.3, ay - 0.3) < 0.16);
  if (!inRound) return [0, 0, 0, 0];

  const ink = [13, 13, 13, 255];
  const paper = [255, 255, 255, 255];
  const r = Math.hypot(nx, ny);
  if (r < 0.08) return paper;
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const cx = Math.cos(a) * 0.2;
    const cy = Math.sin(a) * 0.2;
    if (Math.hypot(nx - cx, ny - cy) < 0.075) return paper;
  }
  return ink;
}

for (const size of [16, 32, 48, 128]) {
  writePng(join(dir, `${size}.png`), size, pixel);
}
