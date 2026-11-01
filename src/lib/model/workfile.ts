import type { Assets, CellNode, Page, WorkFile } from './types'

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
  return data as unknown as WorkFile
}
