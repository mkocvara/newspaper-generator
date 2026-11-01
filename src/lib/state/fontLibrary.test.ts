import { describe, expect, it } from 'vitest'
import { FONT_CHOICES } from '../fonts'
import { createDefaultPage } from '../model/defaults'
import { FontLibrary } from './fontLibrary.svelte'

function memoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (i) => [...items.keys()][i] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  }
}

describe('FontLibrary', () => {
  it('starts with the built-in fonts', () => {
    expect(new FontLibrary(memoryStorage()).families).toEqual(FONT_CHOICES)
  })

  it('remembers additions and removals in storage', () => {
    const storage = memoryStorage()
    const library = new FontLibrary(storage)
    library.add([{ family: 'Lobster', url: 'https://fonts.googleapis.com/css2?family=Lobster' }])
    library.remove('Anton')

    const again = new FontLibrary(storage)
    expect(again.families).toContain('Lobster')
    expect(again.families).not.toContain('Anton')
    expect(again.urlFor('Lobster')).toBe('https://fonts.googleapis.com/css2?family=Lobster')
    expect(again.missingDefaults).toEqual(['Anton'])
  })

  it('restores removed built-in fonts and keeps added ones', () => {
    const library = new FontLibrary(memoryStorage())
    library.add([{ family: 'Lobster', url: '' }])
    library.remove('Anton')
    library.remove('Caladea')
    library.restoreDefaults()
    expect(library.missingDefaults).toEqual([])
    expect(library.families).toContain('Lobster')
  })

  it('adopts the fonts a page uses that are not listed', () => {
    const library = new FontLibrary(memoryStorage())
    library.remove('Lora')
    const { style } = createDefaultPage()
    style.fonts.body = 'Lora'
    style.fonts.name = 'Lobster'
    style.customFonts = [{ family: 'Lobster', url: 'https://example.com/lobster.css' }]

    library.adopt(style)
    expect(library.families).toEqual(expect.arrayContaining(['Lora', 'Lobster']))
    expect(library.urlFor('Lobster')).toBe('https://example.com/lobster.css')
  })

  it('lists the links a page needs for its fonts', () => {
    const library = new FontLibrary(memoryStorage())
    library.add([{ family: 'Lobster', url: 'https://example.com/lobster.css' }])
    const { fonts } = createDefaultPage().style
    expect(library.sourcesFor(fonts)).toEqual([])
    expect(library.sourcesFor({ ...fonts, name: 'Lobster' })).toEqual([
      { family: 'Lobster', url: 'https://example.com/lobster.css' },
    ])
  })
})
