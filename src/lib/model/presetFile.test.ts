import { describe, expect, it } from 'vitest'
import { createDefaultPage } from './defaults'
import { decodePreset, encodePreset } from './presetFile'
import { toWorkFile } from './workfile'
import type { WorkFile } from './types'

// A tiny PNG and some arbitrary bytes, as data URLs.
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const bytes = Uint8Array.from({ length: 3000 }, (_, i) => (i * 37) % 256)
const BLOB = `data:image/webp;base64,${btoa(String.fromCharCode(...bytes))}`

function sample(): WorkFile {
  const page = createDefaultPage(new Date(2026, 10, 2))
  page.header.name = 'Denní Kronika ❧'
  page.grid.cells[0].node = { kind: 'leaf', id: 'a', element: { type: 'image', assetId: 'one', caption: 'Kozy', ink: true, fit: 'crop' } }
  page.grid.cells[1].node = { kind: 'leaf', id: 'b', element: { type: 'image', assetId: 'two', caption: '', ink: false, fit: 'scale' } }
  return toWorkFile(page, { one: PNG, two: BLOB })
}

describe('preset files', () => {
  it('round-trips a work file exactly, images byte for byte', async () => {
    const file = sample()
    const decoded = await decodePreset(await encodePreset(file))
    expect(decoded).toEqual(file)
  })

  it('is smaller than the JSON form', async () => {
    const file = sample()
    const binary = await encodePreset(file)
    expect(binary.size).toBeLessThan(new Blob([JSON.stringify(file)]).size * 0.8)
  })

  it('still reads presets saved as JSON', async () => {
    const file = sample()
    expect(await decodePreset(new Blob([JSON.stringify(file)]))).toEqual(file)
  })

  it('rejects other files', async () => {
    expect(await decodePreset(new Blob([JSON.stringify({ hello: 'world' })]))).toBeNull()
  })
})
