// Layout operations on the body grid. All functions are pure: they take a
// plain grid and return a new one (or the same grid when the operation isn't
// possible), and every result keeps the grid fully tiled by rectangles.
import { newId } from './ids'
import type { CellNode, Element, Grid, GridCell, LeafNode, SplitNode } from './types'

export type Direction = 'left' | 'right' | 'up' | 'down'
export type Axis = 'column' | 'row'

interface Rect {
  col: number
  row: number
  colSpan: number
  rowSpan: number
}

export const emptyLeaf = (): LeafNode => ({ kind: 'leaf', id: newId(), element: null })

export const emptyCell = (col: number, row: number): GridCell => ({
  id: newId(),
  col,
  row,
  colSpan: 1,
  rowSpan: 1,
  node: emptyLeaf(),
})

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

const overlaps = (a: Rect, b: Rect) =>
  a.col < b.col + b.colSpan && b.col < a.col + a.colSpan && a.row < b.row + b.rowSpan && b.row < a.row + a.rowSpan

const contains = (outer: Rect, inner: Rect) =>
  inner.col >= outer.col &&
  inner.row >= outer.row &&
  inner.col + inner.colSpan <= outer.col + outer.colSpan &&
  inner.row + inner.rowSpan <= outer.row + outer.rowSpan

function union(a: Rect, b: Rect): Rect {
  const col = Math.min(a.col, b.col)
  const row = Math.min(a.row, b.row)
  return {
    col,
    row,
    colSpan: Math.max(a.col + a.colSpan, b.col + b.colSpan) - col,
    rowSpan: Math.max(a.row + a.rowSpan, b.row + b.rowSpan) - row,
  }
}

// Row operations are column operations on the transposed grid. Cell contents
// (including split directions) are left alone, so transposing twice is exact.
function transpose(grid: Grid): Grid {
  return {
    cols: grid.rows,
    rows: grid.cols,
    cells: grid.cells.map((c) => ({ ...c, col: c.row, row: c.col, colSpan: c.rowSpan, rowSpan: c.colSpan })),
  }
}

const viaTranspose = (grid: Grid, op: (g: Grid) => Grid): Grid => {
  const transposed = transpose(grid)
  const result = op(transposed)
  return result === transposed ? grid : transpose(result)
}

const findCell = (grid: Grid, id: string) => grid.cells.find((c) => c.id === id)

// --- Columns and rows ---------------------------------------------------

// Insert a column before index `at` (0..n). The new column takes 1/(n+1) of
// the width; the others keep their relative proportions. A merged cell the
// new column cuts through grows to span it.
export function insertColumn(grid: Grid, at: number): Grid {
  const cells = grid.cells.map((c) => {
    if (c.col >= at) return { ...c, col: c.col + 1 }
    if (c.col + c.colSpan > at) return { ...c, colSpan: c.colSpan + 1 }
    return c
  })
  for (let row = 0; row < grid.rows.length; row++) {
    if (!cells.some((c) => overlaps(c, { col: at, row, colSpan: 1, rowSpan: 1 }))) cells.push(emptyCell(at, row))
  }
  const cols = [...grid.cols]
  cols.splice(at, 0, sum(grid.cols) / grid.cols.length)
  return { ...grid, cols, cells }
}

export const insertRow = (grid: Grid, at: number) => viaTranspose(grid, (g) => insertColumn(g, at))

// Delete a column. Cells only in that column are removed; merged cells that
// span it lose that column's width but keep their content.
export function removeColumn(grid: Grid, index: number): Grid {
  if (grid.cols.length <= 1) return grid
  const cells = grid.cells.flatMap((c) => {
    if (c.col > index) return [{ ...c, col: c.col - 1 }]
    if (c.col + c.colSpan <= index) return [c]
    return c.colSpan === 1 ? [] : [{ ...c, colSpan: c.colSpan - 1 }]
  })
  return { ...grid, cols: grid.cols.filter((_, i) => i !== index), cells }
}

export const removeRow = (grid: Grid, index: number) => viaTranspose(grid, (g) => removeColumn(g, index))

// Move `delta` of size across the border before track `border`, keeping both
// neighbouring tracks at least `min`.
export function resizeTracks(sizes: number[], border: number, delta: number, min: number): number[] {
  const before = sizes[border - 1]
  const after = sizes[border]
  const clamped = Math.max(min - before, Math.min(after - min, delta))
  if (before + after < 2 * min) return sizes
  const next = [...sizes]
  next[border - 1] = before + clamped
  next[border] = after - clamped
  return next
}

// Make the two tracks beside a border equal (a 50/50 split of their space).
export function equalizeTracks(sizes: number[], border: number): number[] {
  const half = (sizes[border - 1] + sizes[border]) / 2
  const next = [...sizes]
  next[border - 1] = next[border] = half
  return next
}

// --- Merging ------------------------------------------------------------

function hasContent(node: CellNode): boolean {
  return node.kind === 'leaf' ? node.element !== null : node.children.some(hasContent)
}

// Grow a box until no cell sticks out of it, so merging it yields a rectangle.
function closeBox(grid: Grid, box: Rect): Rect {
  let changed = true
  while (changed) {
    changed = false
    for (const c of grid.cells) {
      if (overlaps(c, box) && !contains(box, c)) {
        box = union(box, c)
        changed = true
      }
    }
  }
  return box
}

function boxToward(grid: Grid, cell: GridCell, dir: Direction): Rect | null {
  const rows = (c: Rect) => c.row < cell.row + cell.rowSpan && cell.row < c.row + c.rowSpan
  const cols = (c: Rect) => c.col < cell.col + cell.colSpan && cell.col < c.col + c.colSpan
  const touching = grid.cells.filter((c) => {
    if (dir === 'right') return c.col === cell.col + cell.colSpan && rows(c)
    if (dir === 'left') return c.col + c.colSpan === cell.col && rows(c)
    if (dir === 'down') return c.row === cell.row + cell.rowSpan && cols(c)
    return c.row + c.rowSpan === cell.row && cols(c)
  })
  if (touching.length === 0) return null
  return closeBox(grid, touching.reduce<Rect>(union, cell))
}

function lineBox(grid: Grid, cell: GridCell, axis: Axis): Rect {
  const line =
    axis === 'column'
      ? { col: cell.col, colSpan: cell.colSpan, row: 0, rowSpan: grid.rows.length }
      : { col: 0, colSpan: grid.cols.length, row: cell.row, rowSpan: cell.rowSpan }
  return closeBox(grid, line)
}

const cellsIn = (grid: Grid, box: Rect) => grid.cells.filter((c) => overlaps(c, box))

// Merge every cell in a (closed) box into one. It keeps the starting cell's
// content, or if that is empty, the first non-empty cell's in reading order.
function mergeBox(grid: Grid, cell: GridCell, box: Rect): Grid {
  const inside = cellsIn(grid, box)
  if (inside.length <= 1) return grid
  const readingOrder = [...inside].sort((a, b) => a.row - b.row || a.col - b.col)
  const node = hasContent(cell.node) ? cell.node : (readingOrder.find((c) => hasContent(c.node))?.node ?? cell.node)
  const merged: GridCell = { id: cell.id, ...box, node }
  return { ...grid, cells: [...grid.cells.filter((c) => !inside.includes(c)), merged] }
}

export function canMergeToward(grid: Grid, cellId: string, dir: Direction): boolean {
  const cell = findCell(grid, cellId)
  return !!cell && boxToward(grid, cell, dir) !== null
}

export function mergeToward(grid: Grid, cellId: string, dir: Direction): Grid {
  const cell = findCell(grid, cellId)
  const box = cell && boxToward(grid, cell, dir)
  return cell && box ? mergeBox(grid, cell, box) : grid
}

export function canMergeLine(grid: Grid, cellId: string, axis: Axis): boolean {
  const cell = findCell(grid, cellId)
  return !!cell && cellsIn(grid, lineBox(grid, cell, axis)).length > 1
}

export function mergeLine(grid: Grid, cellId: string, axis: Axis): Grid {
  const cell = findCell(grid, cellId)
  return cell ? mergeBox(grid, cell, lineBox(grid, cell, axis)) : grid
}

// --- Moving -------------------------------------------------------------

// The unbroken stack of same-width cells in a column that contains `cell`.
// A cell can only move within such a stack, which can't disturb anything else.
function columnRun(grid: Grid, cell: GridCell): GridCell[] {
  const stack = grid.cells
    .filter((c) => c.col === cell.col && c.colSpan === cell.colSpan)
    .sort((a, b) => a.row - b.row)
  let start = stack.indexOf(cell)
  let end = start
  while (start > 0 && stack[start - 1].row + stack[start - 1].rowSpan === stack[start].row) start--
  while (end < stack.length - 1 && stack[end].row + stack[end].rowSpan === stack[end + 1].row) end++
  return stack.slice(start, end + 1)
}

function moveInColumn(grid: Grid, fromId: string, toId: string): Grid {
  const from = findCell(grid, fromId)
  const to = findCell(grid, toId)
  if (!from || !to || from === to) return grid
  const run = columnRun(grid, from)
  if (!run.includes(to)) return grid

  const order = run.filter((c) => c !== from)
  order.splice(run.indexOf(to), 0, from)
  let row = run[0].row
  const placed = new Map(
    order.map((c) => {
      const moved = { ...c, row }
      row += c.rowSpan
      return [c.id, moved]
    }),
  )
  return { ...grid, cells: grid.cells.map((c) => placed.get(c.id) ?? c) }
}

const readingOrder = (cells: GridCell[]) => [...cells].sort((a, b) => a.row - b.row || a.col - b.col)
const sameSize = (a: GridCell, b: GridCell) => a.colSpan === b.colSpan && a.rowSpan === b.rowSpan

// Move across rows and columns: the cells between the two places (in reading
// order) shift one slot along. Only allowed when all of them are the same
// size, so every cell lands in a slot it exactly fills.
function moveInReadingOrder(grid: Grid, fromId: string, toId: string): Grid {
  const order = readingOrder(grid.cells)
  const from = order.findIndex((c) => c.id === fromId)
  const to = order.findIndex((c) => c.id === toId)
  if (from < 0 || to < 0 || from === to) return grid
  const range = order.slice(Math.min(from, to), Math.max(from, to) + 1)
  if (!range.every((c) => sameSize(c, range[0]))) return grid

  const slots = range.map(({ col, row }) => ({ col, row }))
  const occupants = from < to ? [...range.slice(1), range[0]] : [range.at(-1)!, ...range.slice(0, -1)]
  const placed = new Map(occupants.map((c, i) => [c.id, { ...c, ...slots[i] }]))
  return { ...grid, cells: grid.cells.map((c) => placed.get(c.id) ?? c) }
}

// Move a cell to another cell's place. Along its own column or row, the cells
// in between are pushed along (sizes may differ along that line); otherwise
// equally sized cells shift along in reading order.
export function moveCell(grid: Grid, fromId: string, toId: string): Grid {
  const vertical = moveInColumn(grid, fromId, toId)
  if (vertical !== grid) return vertical
  const horizontal = viaTranspose(grid, (g) => moveInColumn(g, fromId, toId))
  if (horizontal !== grid) return horizontal
  return moveInReadingOrder(grid, fromId, toId)
}

export const canMove = (grid: Grid, fromId: string, toId: string) => moveCell(grid, fromId, toId) !== grid

// --- Elements -----------------------------------------------------------

// Put an element into a cell part (or clear it with null).
export function setElement(grid: Grid, leafId: string, element: Element | null): Grid {
  return mapNodes(grid, (node) => (node.kind === 'leaf' && node.id === leafId ? { ...node, element } : null))
}

// --- Splitting (inside a single cell) -----------------------------------

export function findNode(grid: Grid, id: string): CellNode | undefined {
  const visit = (node: CellNode): CellNode | undefined =>
    node.id === id ? node : node.kind === 'split' ? (visit(node.children[0]) ?? visit(node.children[1])) : undefined
  for (const cell of grid.cells) {
    const found = visit(cell.node)
    if (found) return found
  }
}

function mapNodes(grid: Grid, replace: (node: CellNode) => CellNode | null): Grid {
  let changed = false
  const visit = (node: CellNode): CellNode => {
    const replaced = replace(node)
    if (replaced) {
      changed = true
      return replaced
    }
    if (node.kind === 'leaf') return node
    const children: [CellNode, CellNode] = [visit(node.children[0]), visit(node.children[1])]
    return children[0] === node.children[0] && children[1] === node.children[1] ? node : { ...node, children }
  }
  const cells = grid.cells.map((c) => {
    const node = visit(c.node)
    return node === c.node ? c : { ...c, node }
  })
  return changed ? { ...grid, cells } : grid
}

// Split a leaf in two: its content stays in the first half. 'row' places the
// halves side by side, 'column' stacks them.
export function splitLeaf(grid: Grid, leafId: string, direction: SplitNode['direction']): Grid {
  return mapNodes(grid, (node) =>
    node.kind === 'leaf' && node.id === leafId
      ? { kind: 'split', id: newId(), direction, sizes: [1, 1], children: [node, emptyLeaf()] }
      : null,
  )
}

// The splits from a cell's root down to a node, with which child the path
// takes at each one.
function pathTo(node: CellNode, id: string): { split: SplitNode; index: 0 | 1 }[] | null {
  if (node.id === id) return []
  if (node.kind === 'leaf') return null
  for (const index of [0, 1] as const) {
    const rest = pathTo(node.children[index], id)
    if (rest) return [{ split: node, index }, ...rest]
  }
  return null
}

// The innermost split that has a part on the `dir` side of the leaf.
function splitToward(cell: GridCell, leafId: string, dir: Direction) {
  const path = pathTo(cell.node, leafId) ?? []
  const [axis, side] = ({ right: ['row', 0], left: ['row', 1], down: ['column', 0], up: ['column', 1] } as const)[dir]
  return path.findLast(({ split, index }) => split.direction === axis && index === side)
}

export function canMergeLeafToward(grid: Grid, cellId: string, leafId: string, dir: Direction): boolean {
  const cell = findCell(grid, cellId)
  return !!cell && (!!splitToward(cell, leafId, dir) || canMergeToward(grid, cellId, dir))
}

// Merge a part of a split cell with whatever lies in `dir`: first the
// neighbouring part within the cell (undoing that split), else the
// neighbouring grid cell (merging the whole cell). Within a cell, the side the
// merge started from keeps the space if it has content; otherwise the other
// side (which may itself be split) takes over.
export function mergeLeafToward(grid: Grid, cellId: string, leafId: string, dir: Direction): Grid {
  const cell = findCell(grid, cellId)
  const target = cell && splitToward(cell, leafId, dir)
  if (!target) return mergeToward(grid, cellId, dir)
  const { split, index } = target
  const self = split.children[index]
  const other = split.children[index === 0 ? 1 : 0]
  return mapNodes(grid, (node) => (node.id === split.id ? (hasContent(self) ? self : other) : null))
}
