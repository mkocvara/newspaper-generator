import type { GridCell, Page } from './types'

export const DEFAULT_FONT = 'Caladea'

export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

// Header date hint, e.g. "5. 3. 2026".
export function formatDate(date: Date): string {
  return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`
}

function emptyCell(col: number, row: number): GridCell {
  return {
    id: newId(),
    col,
    row,
    colSpan: 1,
    rowSpan: 1,
    node: { kind: 'leaf', id: newId(), element: null },
  }
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
      border: { widthPt: 0.75, color: '#222222' },
    },
  }
}
