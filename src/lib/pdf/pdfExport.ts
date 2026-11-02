import type { jsPDF as JsPDF } from 'jspdf'
import manifest from './font-manifest.json'

// PDF export with real text. The page is laid out as for an image export,
// then every word is measured where the browser placed it. Text in the
// built-in fonts (whose TTFs we can fetch, see scripts/make-font-manifest.mjs)
// is hidden from the page image and drawn as real PDF text in its own font.
// Everything else (fonts the user added, the name with an effect, ornaments,
// text cut off with an ellipsis) stays in the image, with an invisible copy
// of its words on top so it can still be selected and searched.

type FontStyle = 'normal' | 'bold' | 'italic' | 'bolditalic'
type Manifest = Record<string, Partial<Record<FontStyle, string>>>
const FONTS = manifest as Manifest

// The font used for the invisible copy of image text: it covers Czech too.
const INVISIBLE_FONT = 'Caladea'
const PAGE_WIDTH_MM = 210
const PT_PER_PX = 72 / 96
const HIDDEN = 'data-pdf-text'

export interface Word {
  text: string
  // Position and size on the page, in mm; `baseline` is the text baseline.
  x: number
  baseline: number
  width: number
  sizePt: number
  family: string
  style: FontStyle
  color: [number, number, number]
  // Drawn as visible text (else it's in the image, and drawn invisibly).
  real: boolean
  element: Element
  // Whether the element's text is justified, and where its lines end (mm),
  // so lines that the browser stretched to the edge can be stretched too.
  justify: boolean
  lineEnd: number
}

// Characters the built-in fonts can be trusted to have: Latin, Latin
// Extended (Czech and most European languages), punctuation and currency.
// Text with anything else (symbols, emoji, other scripts) stays an image, as
// the browser may have drawn those letters from a fallback font.
const COVERED = /^[\u0000-ɏ -⁯₠-₿№™]*$/

function firstFamily(fontFamily: string): string {
  return fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '')
}

function fontStyle(style: CSSStyleDeclaration): FontStyle {
  const bold = parseInt(style.fontWeight, 10) >= 600
  const italic = style.fontStyle !== 'normal'
  return bold ? (italic ? 'bolditalic' : 'bold') : italic ? 'italic' : 'normal'
}

function parseColor(color: string): [number, number, number] {
  const [r = 0, g = 0, b = 0] = (color.match(/[\d.]+/g) ?? []).map(Number)
  return [r, g, b]
}

function applyTransform(text: string, transform: string): string {
  if (transform === 'uppercase') return text.toUpperCase()
  if (transform === 'lowercase') return text.toLowerCase()
  if (transform === 'capitalize') return text.replace(/(^|\s)(\S)/g, (_, space, ch) => space + ch.toUpperCase())
  return text
}

// Whether an element's text has to stay in the image.
function imageOnly(element: Element, text: string, family: string): boolean {
  if (!FONTS[family] || !COVERED.test(text)) return true
  if (element.closest('.ornament, .clamped')) return true
  const nameLine = element.closest('.name-line')
  return !!nameLine && !nameLine.classList.contains('effect-none')
}

// The visible area an element's text is clipped to, in screen px.
function clipRect(element: Element, page: Element): DOMRect {
  let clip = page.getBoundingClientRect()
  for (let el: Element | null = element; el && el !== page; el = el.parentElement) {
    const style = getComputedStyle(el)
    if (style.overflowX === 'visible' && style.overflowY === 'visible') continue
    const r = el.getBoundingClientRect()
    const left = Math.max(clip.left, r.left)
    const top = Math.max(clip.top, r.top)
    clip = new DOMRect(left, top, Math.min(clip.right, r.right) - left, Math.min(clip.bottom, r.bottom) - top)
  }
  return clip
}

const ascentCache = new Map<string, number>()
// The browser's ascent for a font, in CSS px: a text box's top plus this is
// its baseline.
function ascent(font: string): number {
  let value = ascentCache.get(font)
  if (value === undefined) {
    const context = document.createElement('canvas').getContext('2d')!
    context.font = font
    value = context.measureText('Hg').fontBoundingBoxAscent
    ascentCache.set(font, value)
  }
  return value
}

// Measure every word on the page as laid out now.
export function collectWords(page: HTMLElement): Word[] {
  const pageRect = page.getBoundingClientRect()
  // Screen px to mm, and screen px per CSS px (the view may be zoomed).
  const mm = PAGE_WIDTH_MM / pageRect.width
  const zoom = pageRect.width / page.offsetWidth
  const words: Word[] = []
  const range = document.createRange()

  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const element = node.parentElement
    const text = node.data
    if (!element || !text.trim() || element.closest('.ui-only')) continue
    const style = getComputedStyle(element)
    if (style.visibility !== 'visible') continue

    const family = firstFamily(style.fontFamily)
    const real = !imageOnly(element, element.textContent ?? '', family)
    const sizePx = parseFloat(style.fontSize)
    const top = ascent(`${style.fontStyle} ${style.fontWeight} ${sizePx}px ${style.fontFamily}`) * zoom
    const clip = clipRect(element, page)
    const box = element.getBoundingClientRect()
    const base = {
      sizePt: sizePx * PT_PER_PX,
      family,
      style: fontStyle(style),
      color: parseColor(style.color),
      real,
      element,
      justify: style.textAlign === 'justify',
      lineEnd: (box.right - parseFloat(style.paddingRight) * zoom - pageRect.left) * mm,
    }

    // Walk the characters, cutting words at spaces and at line breaks.
    let current: { chars: string; left: number; right: number; top: number } | null = null
    const flush = (hyphenate: boolean) => {
      if (!current) return
      const midX = (current.left + current.right) / 2
      const midY = current.top + sizePx * zoom * 0.5
      const visible = midX >= clip.left && midX <= clip.right && midY >= clip.top && midY <= clip.bottom
      const chars = current.chars.replace(/­/g, '')
      if (visible && chars) {
        const needsHyphen = hyphenate && !/[-‐–—]$/.test(chars)
        words.push({
          ...base,
          text: applyTransform(chars, style.textTransform) + (needsHyphen ? '-' : ''),
          x: (current.left - pageRect.left) * mm,
          baseline: (current.top + top - pageRect.top) * mm,
          width: (current.right - current.left) * mm,
        })
      }
      current = null
    }

    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (/\s/.test(ch)) {
        flush(false)
        continue
      }
      range.setStart(node, i)
      range.setEnd(node, i + 1)
      const rect = [...range.getClientRects()].find((r) => r.width > 0 || ch === '­')
      if (!rect) continue
      // A new line within a word: the browser hyphenated it there.
      if (current && Math.abs(rect.top - current.top) > sizePx * zoom * 0.5) flush(true)
      if (!current) current = { chars: '', left: rect.left, right: rect.right, top: rect.top }
      current.chars += ch
      current.right = Math.max(current.right, rect.right)
    }
    flush(false)
  }
  return words
}

// --- Fonts

const fontData = new Map<string, Promise<string | null>>()

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

// A built-in font's TTF as base64 (cached), or null if it can't be fetched.
function fetchFont(url: string): Promise<string | null> {
  let data = fontData.get(url)
  if (!data) {
    data = fetch(url)
      .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(String(response.status)))))
      .then(toBase64)
      .catch((error) => {
        console.warn('Could not fetch font for PDF', url, error)
        fontData.delete(url)
        return null
      })
    fontData.set(url, data)
  }
  return data
}

// The style actually available for a family, falling back towards regular;
// `fakeBold` means bold was wanted but the family has no bold.
function availableStyle(family: string, wanted: FontStyle): { style: FontStyle; fakeBold: boolean } {
  const files = FONTS[family] ?? {}
  const order: Record<FontStyle, FontStyle[]> = {
    bolditalic: ['bolditalic', 'bold', 'italic', 'normal'],
    bold: ['bold', 'normal'],
    italic: ['italic', 'normal'],
    normal: ['normal'],
  }
  const style = order[wanted].find((s) => files[s]) ?? 'normal'
  const fakeBold = (wanted === 'bold' || wanted === 'bolditalic') && !style.startsWith('bold')
  return { style, fakeBold }
}

// Fetch and register the fonts the words need. Words whose font can't be
// fetched stay in the image instead.
export async function prepareFonts(pdf: JsPDF, words: Word[]) {
  const needed = new Map<string, { family: string; style: FontStyle }>()
  for (const word of words) {
    const family = word.real ? word.family : INVISIBLE_FONT
    const style = word.real ? availableStyle(word.family, word.style).style : 'normal'
    needed.set(`${family}|${style}`, { family, style })
  }
  const failed = new Set<string>()
  await Promise.all(
    [...needed.values()].map(async ({ family, style }) => {
      const data = await fetchFont(FONTS[family][style]!)
      if (!data) return failed.add(`${family}|${style}`)
      const file = `${family}-${style}.ttf`
      pdf.addFileToVFS(file, data)
      pdf.addFont(file, family, style)
      registered.add(`${family}|${style}`)
    }),
  )
  for (const word of words) {
    if (word.real && failed.has(`${word.family}|${availableStyle(word.family, word.style).style}`)) word.real = false
  }
}

const registered = new Set<string>()

// A line of text as the browser laid it out: its words, in order.
interface Line {
  words: Word[]
}

const MM_PER_PT = 25.4 / 72

// Consecutive words of the same element on the same baseline form a line.
// Words come in document order, so each cell's lines stay together.
function groupLines(words: Word[]): Line[] {
  const lines: Line[] = []
  for (const word of words) {
    const line = lines.at(-1)
    const last = line?.words.at(-1)
    const sameLine =
      last &&
      last.element === word.element &&
      Math.abs(last.baseline - word.baseline) < word.sizePt * MM_PER_PT * 0.3 &&
      !last.text.endsWith('-')
    if (sameLine) line!.words.push(word)
    else lines.push({ words: [word] })
  }
  return lines
}

// Draw the text over the page image: real text visibly, image text
// invisibly. Each line is one text run with real spaces between its words,
// so PDF readers keep a cell's text together and selecting or copying it
// follows its lines (rather than stray words across columns and gaps). Lines
// the browser justified are justified to the same width, spreading the space
// between words as the browser does; others get a small letter-spacing
// correction so they end where the browser's did.
export function drawWords(pdf: JsPDF, words: Word[]) {
  for (const { words: lineWords } of groupLines(words)) {
    const first = lineWords[0]
    const last = lineWords[lineWords.length - 1]
    const family = first.real ? first.family : INVISIBLE_FONT
    const { style, fakeBold } = first.real
      ? availableStyle(first.family, first.style)
      : { style: 'normal' as const, fakeBold: false }
    // Without its font (the invisible one couldn't be fetched), skip it.
    if (!registered.has(`${family}|${style}`)) continue
    pdf.setFont(family, style)
    pdf.setFontSize(first.sizePt)
    pdf.setTextColor(...first.color)
    if (fakeBold) {
      pdf.setDrawColor(...first.color)
      pdf.setLineWidth(first.sizePt * 0.035 * MM_PER_PT)
    }
    const renderingMode = !first.real ? 'invisible' : fakeBold ? 'fillThenStroke' : 'fill'
    const text = lineWords.map((w) => w.text).join(' ')
    const width = last.x + last.width - first.x
    const stretched = first.justify && lineWords.length > 1 && first.lineEnd - (last.x + last.width) < 0.5
    if (stretched) {
      // jsPDF only justifies lines followed by another, hence the empty one.
      pdf.text([text, ''], first.x, first.baseline, { baseline: 'alphabetic', align: 'justify', maxWidth: width, renderingMode })
    } else {
      const letters = [...text].length
      const natural = pdf.getTextWidth(text)
      const charSpace = letters > 1 ? (width - natural) / (letters - 1) : 0
      pdf.text(text, first.x, first.baseline, { baseline: 'alphabetic', charSpace, renderingMode })
    }
  }
}

// Hide the real-text words' letters from the page image (layout stays).
export function hideRealText(words: Word[]): () => void {
  const elements = new Set(words.filter((w) => w.real).map((w) => w.element))
  for (const element of elements) element.setAttribute(HIDDEN, '')
  return () => {
    for (const element of elements) element.removeAttribute(HIDDEN)
  }
}
