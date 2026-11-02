import type { WorkFile } from './types'
import { parseWorkFile } from './workfile'

// The preset file (.newspaper): a compact binary form of the work file. Images
// are nearly all of a preset, and as data URLs in JSON they're base64 text, a
// third bigger than their bytes. So the file holds the page data as gzipped
// JSON, then each image's raw bytes:
//
//   "NWSP"                 4 bytes, identifies the format
//   format version         1 byte (1)
//   header length          4 bytes, big-endian
//   header                 gzipped JSON: the work file, with each asset as
//                          { type, offset, length } into the image bytes
//   image bytes            each image's file bytes, one after another
//
// Nothing is lost: the work file comes back exactly, images byte for byte.
// Older presets are plain JSON work files; reading accepts both.

const MAGIC = [0x4e, 0x57, 0x53, 0x50] // "NWSP"
const FORMAT_VERSION = 1

interface AssetEntry {
  type: string
  offset: number
  length: number
}

type Bytes = Uint8Array<ArrayBuffer>

async function gzip(bytes: Bytes, mode: 'compress' | 'decompress'): Promise<Bytes> {
  const stream =
    mode === 'compress' ? new CompressionStream('gzip') : new DecompressionStream('gzip')
  const result = new Response(new Blob([bytes]).stream().pipeThrough(stream))
  return new Uint8Array(await result.arrayBuffer())
}

function dataUrlBytes(dataUrl: string): { type: string; bytes: Bytes } {
  const comma = dataUrl.indexOf(',')
  const meta = dataUrl.slice(5, comma) // after "data:"
  const type = meta.split(';')[0] || 'application/octet-stream'
  const body = dataUrl.slice(comma + 1)
  if (!meta.endsWith(';base64')) return { type, bytes: new TextEncoder().encode(decodeURIComponent(body)) }
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return { type, bytes }
}

function bytesDataUrl(type: string, bytes: Bytes): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return `data:${type};base64,${btoa(binary)}`
}

export async function encodePreset(file: WorkFile): Promise<Blob> {
  const assets: Record<string, AssetEntry> = {}
  const chunks: Bytes[] = []
  let offset = 0
  for (const [id, dataUrl] of Object.entries(file.assets)) {
    const { type, bytes } = dataUrlBytes(dataUrl)
    assets[id] = { type, offset, length: bytes.length }
    chunks.push(bytes)
    offset += bytes.length
  }
  const header = await gzip(new TextEncoder().encode(JSON.stringify({ ...file, assets })), 'compress')
  const prefix = new Uint8Array(9)
  prefix.set(MAGIC)
  prefix[4] = FORMAT_VERSION
  new DataView(prefix.buffer).setUint32(5, header.length)
  return new Blob([prefix, header, ...chunks], { type: 'application/octet-stream' })
}

// Read a preset in either form; null if it isn't one.
export async function decodePreset(blob: Blob): Promise<WorkFile | null> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  if (!MAGIC.every((b, i) => bytes[i] === b)) return parseWorkFile(JSON.parse(new TextDecoder().decode(bytes)))
  if (bytes[4] !== FORMAT_VERSION) return null
  const headerLength = new DataView(bytes.buffer, bytes.byteOffset).getUint32(5)
  const header = JSON.parse(new TextDecoder().decode(await gzip(bytes.subarray(9, 9 + headerLength), 'decompress')))
  const data = bytes.subarray(9 + headerLength)
  const assets: Record<string, string> = {}
  for (const [id, entry] of Object.entries(header.assets ?? {}) as [string, AssetEntry][]) {
    assets[id] = bytesDataUrl(entry.type, data.subarray(entry.offset, entry.offset + entry.length))
  }
  return parseWorkFile({ ...header, assets })
}
