import { encodePreset } from './model/presetFile'
import type { WorkFile } from './model/types'
import { refitAll } from './ui/fitText'

// Exports render the page at A4 300 dpi (the page is laid out at 96 px/inch).
const PIXEL_RATIO = 300 / 96

export type ExportKind = 'png' | 'jpeg' | 'pdf'

function download(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

// html-to-image copies each element's computed styles into its clone. Where
// the browser doesn't offer them as one cssText (Firefox), it copies them one
// by one and rounds every font size down and subtracts 0.1px, which narrows
// the text enough to wrap lines differently from the screen. So stamp each
// element with its exact font size (attributes survive the cloning) and put
// those back into the clone's SVG before drawing it.
const FONT_SIZE = 'data-export-font-size'

function stampFontSizes(page: HTMLElement): () => void {
  const elements = [page, ...page.querySelectorAll<HTMLElement>('*')]
  for (const element of elements) element.setAttribute(FONT_SIZE, getComputedStyle(element).fontSize)
  return () => elements.forEach((element) => element.removeAttribute(FONT_SIZE))
}

function restoreFontSizes(svgDataUrl: string): string {
  const prefix = svgDataUrl.slice(0, svgDataUrl.indexOf(',') + 1)
  const svg = new DOMParser().parseFromString(decodeURIComponent(svgDataUrl.slice(prefix.length)), 'image/svg+xml')
  for (const element of svg.querySelectorAll<HTMLElement>(`[${FONT_SIZE}]`)) {
    element.style.setProperty('font-size', element.getAttribute(FONT_SIZE))
    element.removeAttribute(FONT_SIZE)
  }
  return prefix + encodeURIComponent(new XMLSerializer().serializeToString(svg))
}

// Draw an SVG data URL at the export resolution, as html-to-image would.
async function rasterize(svgDataUrl: string, width: number, height: number, type: 'png' | 'jpeg'): Promise<string> {
  const image = new Image()
  image.decoding = 'sync'
  image.src = svgDataUrl
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * PIXEL_RATIO)
  canvas.height = Math.round(height * PIXEL_RATIO)
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
  return type === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.92)
}

// Render the page without editing aids (placeholders, handles, focus).
// `beforeRender` runs once the page is laid out for export and may return a
// cleanup; the PDF export uses it to measure the text and hide what it draws.
async function renderPage(
  type: 'png' | 'jpeg',
  beforeRender?: (page: HTMLElement) => Promise<(() => void) | void>,
): Promise<string> {
  const page = document.querySelector<HTMLElement>('article.page')
  if (!page) throw new Error('Page not found')
  ;(document.activeElement as HTMLElement | null)?.blur()
  page.classList.add('exporting')
  let cleanup: (() => void) | void = undefined
  let unstamp: (() => void) | undefined
  try {
    refitAll()
    await nextFrame()
    await nextFrame()
    cleanup = await beforeRender?.(page)
    unstamp = stampFontSizes(page)
    const { toSvg } = await import('html-to-image')
    const svg = await toSvg(page, { filter: (node: HTMLElement) => !node.classList?.contains('ui-only') })
    return await rasterize(restoreFontSizes(svg), page.offsetWidth, page.offsetHeight, type)
  } finally {
    unstamp?.()
    cleanup?.()
    page.classList.remove('exporting')
    refitAll()
  }
}

export async function exportPage(kind: ExportKind, basename: string) {
  if (kind === 'png') return download(await renderPage('png'), `${basename}.png`)
  if (kind === 'jpeg') return download(await renderPage('jpeg'), `${basename}.jpg`)

  // A4 with the page image, and its text on top as real (or, where the font
  // isn't available, invisible but selectable) text.
  const [{ jsPDF }, text] = await Promise.all([import('jspdf'), import('./pdf/pdfExport')])
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  let words: import('./pdf/pdfExport').Word[] = []
  const image = await renderPage('jpeg', async (page) => {
    words = text.collectWords(page)
    await text.prepareFonts(pdf, words)
    return text.hideRealText(words)
  })
  pdf.addImage(image, 'JPEG', 0, 0, 210, 297)
  text.drawWords(pdf, words)
  pdf.save(`${basename}.pdf`)
}

// The preset, in its compact binary form (see model/presetFile.ts).
export async function exportWorkFile(file: WorkFile, basename: string) {
  const url = URL.createObjectURL(await encodePreset(file))
  download(url, `${basename}.newspaper`)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// A file name from the newspaper name, e.g. "the-daily-chronicle".
export function exportBasename(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'newspaper'
}
