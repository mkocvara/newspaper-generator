import type { CustomFont } from './model/types'

// A starter set of Google Fonts that suit newspapers. More can be added by
// name or by pasting a Google Fonts link.
export const FONT_CHOICES = [
  'Caladea',
  'Abril Fatface',
  'Anton',
  'Bebas Neue',
  'Cinzel',
  'EB Garamond',
  'Libre Baskerville',
  'Lora',
  'Merriweather',
  'Old Standard TT',
  'Oswald',
  'Playfair Display',
  'PT Serif',
  'Roboto Slab',
  'Source Serif 4',
  'Spectral',
  'Special Elite',
  'UnifrakturMaguntia',
]

// CSS font-family for a chosen font, with fallbacks while it loads.
export const fontStack = (family: string) => `"${family}", Cambria, Georgia, serif`

const GOOGLE_CSS = 'https://fonts.googleapis.com/css2'
const loads = new Map<string, Promise<boolean>>()

function addStylesheet(href: string): Promise<boolean> {
  return new Promise((resolve) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    // CORS lets the image export read and embed the font.
    link.crossOrigin = 'anonymous'
    link.href = href
    link.onload = () => resolve(true)
    link.onerror = () => {
      link.remove()
      resolve(false)
    }
    document.head.append(link)
  })
}

// Google Fonts rejects requests for styles a family doesn't have, so ask for
// regular/bold/italic first and fall back to fewer styles.
async function loadGoogleFont(family: string): Promise<boolean> {
  const name = encodeURIComponent(family).replace(/%20/g, '+')
  for (const styles of [':ital,wght@0,400;0,700;1,400;1,700', ':wght@400;700', '']) {
    if (await addStylesheet(`${GOOGLE_CSS}?family=${name}${styles}&display=swap`)) return true
  }
  return false
}

// Load a font family once; resolves to whether it loaded.
export function loadFont(family: string, customFonts: CustomFont[] = []): Promise<boolean> {
  let load = loads.get(family)
  if (!load) {
    const url = customFonts.find((f) => f.family === family)?.url
    load = url ? addStylesheet(url) : loadGoogleFont(family)
    loads.set(family, load)
    load.then((ok) => !ok && loads.delete(family))
  }
  return load
}

// Turn what the user typed into fonts to add: either a Google Fonts link
// (which may name several families) or a plain family name.
export function parseFontInput(input: string): CustomFont[] {
  const text = input.trim()
  if (!/^https?:\/\//i.test(text)) return text ? [{ family: text, url: '' }] : []
  try {
    const url = new URL(text)
    return url.searchParams.getAll('family').map((f) => ({ family: f.split(':')[0].replace(/\+/g, ' '), url: text }))
  } catch {
    return []
  }
}
