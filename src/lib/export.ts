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
  try {
    refitAll()
    await nextFrame()
    await nextFrame()
    cleanup = await beforeRender?.(page)
    const { toJpeg, toPng } = await import('html-to-image')
    const options = { pixelRatio: PIXEL_RATIO, filter: (node: HTMLElement) => !node.classList?.contains('ui-only') }
    return type === 'png' ? await toPng(page, options) : await toJpeg(page, { ...options, quality: 0.92 })
  } finally {
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

export function exportWorkFile(file: WorkFile, basename: string) {
  const blob = new Blob([JSON.stringify(file)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  download(url, `${basename}.json`)
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
