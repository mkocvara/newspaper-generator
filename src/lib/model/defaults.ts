import { emptyCell } from './grid'
import type { GridCell, Page } from './types'

export { newId } from './ids'

export const DEFAULT_FONT = 'Caladea'

// Header date hint, e.g. "5. 3. 2026".
export function formatDate(date: Date): string {
  return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`
}

export function createDefaultPage(today = new Date()): Page {
  const size = 3
  const cells: GridCell[] = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) cells.push(emptyCell(col, row))
  }

  return {
    header: { heightMm: 30, date: formatDate(today), name: '', location: '' },
    footer: { heightMm: 10, left: '', center: '', right: 'Page 1' },
    grid: { cols: Array(size).fill(1), rows: Array(size).fill(1), cells },
    style: {
      fonts: {
        body: DEFAULT_FONT,
        heading: DEFAULT_FONT,
        caption: DEFAULT_FONT,
        eyecatcher: DEFAULT_FONT,
        headerFooter: DEFAULT_FONT,
        name: DEFAULT_FONT,
      },
      customFonts: [],
      sizes: { bodyPt: 9, headingPt: 14, captionPt: 8 },
      frameStyle: 'double',
      ink: '#1b1a17',
      border: { widthPt: 0.75 },
      nameDecoration: { ornament: 'none', customBefore: '', customAfter: '', effect: 'none' },
    },
  }
}
