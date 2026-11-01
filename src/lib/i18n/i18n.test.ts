import { describe, expect, it } from 'vitest'
import { cs } from './cs'
import { en } from './en'

// Paths to every leaf, so the two languages can be compared key by key.
function leaves(value: unknown, path = ''): [string, unknown][] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, v]) => leaves(v, path ? `${path}.${key}` : key))
  }
  return [[path, value]]
}

describe('translations', () => {
  it('Czech has exactly the English keys', () => {
    expect(leaves(cs).map(([path]) => path)).toEqual(leaves(en).map(([path]) => path))
  })

  it('has no empty text', () => {
    for (const strings of [en, cs]) {
      for (const [path, value] of leaves(strings)) {
        const text = typeof value === 'function' ? value(['x'], ['y'], 'z') : value
        expect(String(text).trim(), path).not.toBe('')
      }
    }
  })

  it('formats percentages the Czech way', () => {
    expect(en.percent(105)).toBe('105%')
    expect(cs.percent(105)).toBe('105 %')
  })
})
