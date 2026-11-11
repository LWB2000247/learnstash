import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

function crc32(buf) {
  let c = ~0
  for (const b of buf) {
    c ^= b
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function inRoundRect(px, py, x, y, w, h, r) {
  if (px < x || py < y || px >= x + w || py >= y + h) return false
  const left = px < x + r
  const right = px >= x + w - r
  const top = py < y + r
  const bottom = py >= y + h - r
  if (!left && !right) return true
  if (!top && !bottom) return true
  const cx = left ? x + r : x + w - r
  const cy = top ? y + r : y + h - r
  const dx = px + 0.5 - cx
  const dy = py + 0.5 - cy
  return dx * dx + dy * dy <= r * r
}

function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  const bg = [30, 77, 134, 255]
  const card = [255, 255, 255, 255]
  const ghost = [255, 255, 255, 120]
  const s = size / 512
  const back = { x: 118 * s, y: 96 * s, w: 276 * s, h: 196 * s, r: 28 * s }
  const front = { x: 96 * s, y: 176 * s, w: 320 * s, h: 220 * s, r: 32 * s }
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      let color = bg
      if (inRoundRect(x, y, back.x, back.y, back.w, back.h, back.r)) color = ghost
      if (inRoundRect(x, y, front.x, front.y, front.w, front.h, front.r)) color = card
      const i = y * (size * 4 + 1) + 1 + x * 4
      raw[i] = color[0]
      raw[i + 1] = color[1]
      raw[i + 2] = color[2]
      raw[i + 3] = color[3]
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', png(192))
writeFileSync('public/icons/icon-512.png', png(512))
console.log('wrote icons')
