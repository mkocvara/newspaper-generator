// The whole editable newspaper page. Everything here is plain JSON so it can be
// snapshotted for undo/redo, autosaved, and exported as a work file.
export interface Page {
  header: Header
  footer: Footer
  grid: Grid
  style: Style
}

export interface Header {
  heightMm: number
  date: string
  name: string
  location: string
}

export interface Footer {
  heightMm: number
  left: string
  center: string
  right: string
}

// The body grid. Column and row sizes are relative weights (like CSS `fr`).
export interface Grid {
  cols: number[]
  rows: number[]
  cells: GridCell[]
}

// A rectangle of grid tracks. Merged cells simply span more than one track.
export interface GridCell {
  id: string
  col: number
  row: number
  colSpan: number
  rowSpan: number
  node: CellNode
}

// Splitting a cell only subdivides that cell, so a cell holds a small tree
// rather than adding grid lines that would affect the rest of the layout.
export type CellNode = LeafNode | SplitNode

export interface LeafNode {
  kind: 'leaf'
  id: string
  element: Element | null
}

export interface SplitNode {
  kind: 'split'
  id: string
  // 'row' places children side by side, 'column' stacks them.
  direction: 'row' | 'column'
  sizes: [number, number]
  children: [CellNode, CellNode]
}

export type Element = EyecatcherElement | TextElement | ImageElement

export interface EyecatcherElement {
  type: 'eyecatcher'
  main: string
  sub: string
}

export interface TextElement {
  type: 'text'
  heading: string
  body: string
}

export interface ImageElement {
  type: 'image'
  // Key into the asset map; image data is kept outside the page so undo
  // snapshots stay small.
  assetId: string | null
  caption: string
  greyscale: boolean
  fit: 'scale' | 'crop'
}

export type FrameStyle = 'single' | 'double' | 'thick-thin'

export interface Style {
  fonts: Fonts
  customFonts: CustomFont[]
  sizes: {
    bodyPt: number
    headingPt: number
    captionPt: number
  }
  frameStyle: FrameStyle
  border: {
    widthPt: number
    color: string
  }
}

export interface Fonts {
  body: string
  heading: string
  caption: string
  eyecatcher: string
  headerFooter: string
  name: string
}

export interface CustomFont {
  family: string
  url: string
}

// Image data URLs, keyed by asset id.
export type Assets = Record<string, string>

// The JSON work file (also the autosave format).
export interface WorkFile {
  app: 'newspaper-generator'
  version: 1
  page: Page
  assets: Assets
}
