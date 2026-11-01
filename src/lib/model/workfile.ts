import { createDefaultPage } from './defaults'
import type { Assets, CellNode, NameDecoration, Page, Style, WorkFile } from './types'

export function collectAssetIds(page: Page): Set<string> {
  const ids = new Set<string>()
  const visit = (node: CellNode) => {
    if (node.kind === 'split') node.children.forEach(visit)
    else if (node.element?.type === 'image' && node.element.assetId) ids.add(node.element.assetId)
  }
  page.grid.cells.forEach((cell) => visit(cell.node))
  return ids
}

// Bundle a page with only the assets it still references.
export function toWorkFile(page: Page, assets: Assets): WorkFile {
  const used: Assets = {}
  for (const id of collectAssetIds(page)) {
    if (assets[id]) used[id] = assets[id]
  }
  return { app: 'newspaper-generator', version: 1, page, assets: used }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

// Shallow structural check; returns null for anything that isn't a work file.
export function parseWorkFile(data: unknown): WorkFile | null {
  if (!isObject(data) || data.app !== 'newspaper-generator' || data.version !== 1) return null
  const { page, assets } = data
  if (!isObject(page) || !isObject(assets)) return null
  if (!isObject(page.header) || !isObject(page.footer) || !isObject(page.style)) return null
  const grid = page.grid
  if (!isObject(grid) || !Array.isArray(grid.cols) || !Array.isArray(grid.rows)) return null
  if (!Array.isArray(grid.cells)) return null
  const file = data as unknown as WorkFile
  return { ...file, page: { ...file.page, style: withStyleDefaults(file.page.style) } }
}

// Symbol ornament presets older pages may use; they load as custom symbols.
const LEGACY_ORNAMENTS: Record<string, [string, string]> = {
  stars: ['★', '★'],
  diamonds: ['◆', '◆'],
}

function withDecorationDefaults(decoration: Partial<NameDecoration> = {}): NameDecoration {
  const merged = { ...createDefaultPage().style.nameDecoration, ...decoration }
  const legacy = LEGACY_ORNAMENTS[merged.ornament]
  return legacy ? { ...merged, ornament: 'custom', customBefore: legacy[0], customAfter: legacy[1] } : merged
}

// Fill in style options added after a file was saved, so older work files and
// autosaves keep loading.
function withStyleDefaults(style: Partial<Style>): Style {
  const defaults = createDefaultPage().style
  const frameStyle = (style.frameStyle as string) === 'thick-thin' ? 'thick-outer' : style.frameStyle
  return {
    ...defaults,
    ...style,
    frameStyle: frameStyle ?? defaults.frameStyle,
    fonts: { ...defaults.fonts, ...style.fonts },
    sizes: { ...defaults.sizes, ...style.sizes },
    border: { ...defaults.border, ...style.border },
    nameDecoration: withDecorationDefaults(style.nameDecoration),
  }
}
