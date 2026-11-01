import { FONT_CHOICES } from '../fonts'
import type { CustomFont, Fonts, Style } from '../model/types'

const STORAGE_KEY = 'newspaper:fonts'

// The fallback for text whose font is removed from the list.
export const FALLBACK_FONT = 'Caladea'

const defaults = (): CustomFont[] => FONT_CHOICES.map((family) => ({ family, url: '' }))

// The fonts offered in the font menus. Kept per browser rather than in the
// work file; it starts as the built-in fonts and the user can add or remove
// any. A url is set for fonts added by Google Fonts link.
export class FontLibrary {
  fonts = $state<CustomFont[]>([])
  families = $derived(this.fonts.map((f) => f.family))
  missingDefaults = $derived(FONT_CHOICES.filter((family) => !this.families.includes(family)))

  #storage: Storage | undefined

  constructor(storage?: Storage) {
    this.#storage = storage
    this.fonts = this.#read() ?? defaults()
  }

  // Add fonts, or update the link of ones already listed.
  add(fonts: CustomFont[]) {
    const next = [...this.fonts]
    for (const font of fonts) {
      const i = next.findIndex((f) => f.family === font.family)
      if (i === -1) next.push(font)
      else if (font.url) next[i] = font
    }
    this.#set(next)
  }

  remove(family: string) {
    this.#set(this.fonts.filter((f) => f.family !== family))
  }

  restoreDefaults() {
    this.add(defaults())
  }

  urlFor(family: string): string {
    return this.fonts.find((f) => f.family === family)?.url ?? ''
  }

  // Add any font a page uses (or knows a link for) that isn't listed, e.g.
  // after importing a work file made elsewhere.
  adopt(style: Style) {
    const missing = [
      ...style.customFonts,
      ...Object.values(style.fonts).map((family) => ({ family, url: '' })),
    ].filter((font) => !this.families.includes(font.family))
    if (missing.length) this.add(missing)
  }

  // The links a page needs for the fonts it uses.
  sourcesFor(fonts: Fonts): CustomFont[] {
    return [...new Set(Object.values(fonts))]
      .map((family) => ({ family, url: this.urlFor(family) }))
      .filter((font) => font.url)
  }

  #set(fonts: CustomFont[]) {
    this.fonts = fonts
    try {
      this.#storage?.setItem(STORAGE_KEY, JSON.stringify(fonts))
    } catch {
      // Storage unavailable (e.g. private mode); the list just isn't remembered.
    }
  }

  #read(): CustomFont[] | null {
    try {
      const fonts = JSON.parse(this.#storage?.getItem(STORAGE_KEY) ?? 'null')
      if (!Array.isArray(fonts)) return null
      return fonts
        .filter((f) => typeof f?.family === 'string')
        .map((f) => ({ family: f.family, url: typeof f.url === 'string' ? f.url : '' }))
    } catch {
      return null
    }
  }
}

function browserStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

export const fontLibrary = new FontLibrary(browserStorage())
