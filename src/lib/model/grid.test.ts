import { describe, expect, it } from 'vitest'
import { createDefaultPage } from './defaults'
import {
  canMergeLine,
  canMergeLeafToward,
  canMergeToward,
  canMove,
  equalizeTracks,
  insertColumn,
  insertRow,
  mergeLine,
  mergeLeafToward,
  mergeToward,
  moveCell,
  removeColumn,
  removeRow,
  resizeTracks,
  setElement,
  splitLeaf,
  splitPart,
} from './grid'
import { createElement } from './elements'
import type { CellNode, Grid, GridCell, LeafNode } from './types'

const grid3 = (): Grid => createDefaultPage().grid
const at = (g: Grid, col: number, row: number): GridCell =>
  g.cells.find((c) => col >= c.col && col < c.col + c.colSpan && row >= c.row && row < c.row + c.rowSpan)!
const text = (body: string): LeafNode => ({
  kind: 'leaf',
  id: `leaf-${body}`,
  element: { type: 'text', heading: '', body },
})
const withNode = (g: Grid, col: number, row: number, node: CellNode) => {
  at(g, col, row).node = node
  return g
}

// Every grid slot is covered by exactly one cell, and no cell leaves the grid.
function expectValidTiling(g: Grid) {
  const seen = new Map<string, string>()
  for (const c of g.cells) {
    expect(c.colSpan).toBeGreaterThan(0)
    expect(c.rowSpan).toBeGreaterThan(0)
    expect(c.col + c.colSpan).toBeLessThanOrEqual(g.cols.length)
    expect(c.row + c.rowSpan).toBeLessThanOrEqual(g.rows.length)
    for (let x = c.col; x < c.col + c.colSpan; x++) {
      for (let y = c.row; y < c.row + c.rowSpan; y++) {
        expect(seen.has(`${x},${y}`), `slot ${x},${y} covered twice`).toBe(false)
        seen.set(`${x},${y}`, c.id)
      }
    }
  }
  expect(seen.size).toBe(g.cols.length * g.rows.length)
}

describe('insert columns and rows', () => {
  it('adds a column taking 1/n of the width', () => {
    const g = insertColumn(grid3(), 1)
    expect(g.cols).toEqual([1, 1, 1, 1])
    expect(g.cells).toHaveLength(12)
    expectValidTiling(g)
  })

  it('keeps proportions when columns are uneven', () => {
    const g = insertColumn({ ...grid3(), cols: [2, 1, 1] }, 3)
    const total = g.cols.reduce((a, b) => a + b)
    expect(g.cols[3] / total).toBeCloseTo(1 / 4)
    expect(g.cols.slice(0, 3)).toEqual([2, 1, 1])
  })

  it('widens a merged cell that the new column cuts through', () => {
    const start = grid3()
    const merged = mergeToward(start, at(start, 0, 0).id, 'right')
    const id = at(merged, 0, 0).id
    const g = insertColumn(merged, 1)
    expect(g.cells.find((c) => c.id === id)).toMatchObject({ col: 0, colSpan: 3 })
    expectValidTiling(g)
  })

  it('adds a row at the end', () => {
    const g = insertRow(grid3(), 3)
    expect(g.rows).toEqual([1, 1, 1, 1])
    expect(at(g, 1, 3).node.kind).toBe('leaf')
    expectValidTiling(g)
  })
})

describe('remove columns and rows', () => {
  it('removes single cells and shrinks merged ones, keeping their content', () => {
    let g = withNode(grid3(), 0, 0, text('kept'))
    g = mergeToward(g, at(g, 0, 0).id, 'right')
    g = removeColumn(g, 1)
    expect(g.cols).toHaveLength(2)
    expect(at(g, 0, 0)).toMatchObject({ colSpan: 1, node: text('kept') })
    expect(g.cells).toHaveLength(6)
    expectValidTiling(g)
  })

  it('never removes the last column or row', () => {
    let g = grid3()
    g = removeColumn(removeColumn(g, 0), 0)
    expect(removeColumn(g, 0)).toBe(g)
    g = removeRow(removeRow(g, 0), 0)
    expect(removeRow(g, 0)).toBe(g)
    expect(g.cells).toHaveLength(1)
  })

  it('removes a row', () => {
    const g = removeRow(grid3(), 2)
    expect(g.rows).toEqual([1, 1])
    expectValidTiling(g)
  })
})

describe('resizeTracks', () => {
  it('moves width between the two tracks beside a border', () => {
    expect(resizeTracks([1, 1, 1], 1, 0.5, 0.1)).toEqual([1.5, 0.5, 1])
  })

  it('clamps so neither track goes below the minimum', () => {
    expect(resizeTracks([1, 1, 1], 1, 5, 0.25)).toEqual([1.75, 0.25, 1])
    expect(resizeTracks([1, 1, 1], 2, -5, 0.25)).toEqual([1, 0.25, 1.75])
  })
})

describe('equalizeTracks', () => {
  it('splits the two tracks beside a border 50/50', () => {
    expect(equalizeTracks([1, 1.5, 0.5], 2)).toEqual([1, 1, 1])
  })
})

describe('merging', () => {
  it('merges with the neighbour to the right', () => {
    const start = grid3()
    const g = mergeToward(start, at(start, 0, 0).id, 'right')
    expect(at(g, 0, 0)).toMatchObject({ col: 0, row: 0, colSpan: 2, rowSpan: 1 })
    expect(g.cells).toHaveLength(8)
    expectValidTiling(g)
  })

  it('grows to a rectangle when the neighbour is taller', () => {
    let g = grid3()
    g = mergeToward(g, at(g, 1, 0).id, 'down') // column 1, rows 0-1
    g = mergeToward(g, at(g, 0, 0).id, 'right') // must also take (0, 1)
    expect(at(g, 0, 0)).toMatchObject({ col: 0, row: 0, colSpan: 2, rowSpan: 2 })
    expectValidTiling(g)
  })

  it('cannot merge past the edge', () => {
    const g = grid3()
    expect(canMergeToward(g, at(g, 0, 0).id, 'left')).toBe(false)
    expect(canMergeToward(g, at(g, 0, 0).id, 'up')).toBe(false)
    expect(canMergeToward(g, at(g, 0, 0).id, 'down')).toBe(true)
  })

  it('keeps the content of the starting cell, or else the first non-empty one', () => {
    let g = withNode(withNode(grid3(), 0, 0, text('A')), 1, 0, text('B'))
    expect(at(mergeToward(g, at(g, 1, 0).id, 'left'), 0, 0).node).toEqual(text('B'))

    g = withNode(grid3(), 1, 0, text('B'))
    expect(at(mergeToward(g, at(g, 0, 0).id, 'right'), 0, 0).node).toEqual(text('B'))
  })

  it('merges a whole column or row', () => {
    let g = grid3()
    g = mergeLine(g, at(g, 1, 1).id, 'column')
    expect(at(g, 1, 0)).toMatchObject({ col: 1, row: 0, colSpan: 1, rowSpan: 3 })
    expect(canMergeLine(g, at(g, 1, 0).id, 'column')).toBe(false)
    expectValidTiling(g)

    g = mergeLine(g, at(g, 0, 0).id, 'row') // the merged column forces all rows
    expect(g.cells).toHaveLength(1)
  })
})

describe('moving', () => {
  it('moves a cell down its column, pushing the others up', () => {
    const g = grid3()
    const [top, middle, bottom] = [0, 1, 2].map((row) => at(g, 0, row).id)
    const moved = moveCell(g, top, bottom)
    expect([0, 1, 2].map((row) => at(moved, 0, row).id)).toEqual([middle, bottom, top])
    expectValidTiling(moved)
  })

  it('moves a cell along its row', () => {
    const g = grid3()
    const ids = [0, 1, 2].map((col) => at(g, col, 1).id)
    const moved = moveCell(g, ids[2], ids[0])
    expect([0, 1, 2].map((col) => at(moved, col, 1).id)).toEqual([ids[2], ids[0], ids[1]])
  })

  it('keeps cell heights when they differ', () => {
    let g = insertRow(grid3(), 3)
    g = mergeToward(g, at(g, 0, 0).id, 'down') // column 0: [2 rows, 1, 1]
    const tall = at(g, 0, 0).id
    const moved = moveCell(g, tall, at(g, 0, 3).id)
    expect(moved.cells.find((c) => c.id === tall)).toMatchObject({ row: 2, rowSpan: 2 })
    expectValidTiling(moved)
  })

  it('moves across rows and columns, shifting cells in reading order', () => {
    const g23 = removeColumn(grid3(), 2) // 2 columns x 3 rows
    const ids = g23.cells.slice().sort((a, b) => a.row - b.row || a.col - b.col).map((c) => c.id)
    const moved = moveCell(g23, ids[0], ids[5]) // top-left to bottom-right
    const order = moved.cells.slice().sort((a, b) => a.row - b.row || a.col - b.col).map((c) => c.id)
    expect(order).toEqual([ids[1], ids[2], ids[3], ids[4], ids[5], ids[0]])
    expectValidTiling(moved)
  })

  it('does not move across rows and columns past differently sized cells', () => {
    let g = grid3()
    g = mergeToward(g, at(g, 1, 1).id, 'right') // (1,1)-(2,1) merged
    expect(canMove(g, at(g, 0, 0).id, at(g, 2, 2).id)).toBe(false)
    expect(canMove(g, at(g, 1, 0).id, at(g, 0, 1).id)).toBe(true) // only 1x1 cells between
  })

  it('only moves where the layout allows it', () => {
    let g = grid3()
    g = mergeLine(g, at(g, 1, 0).id, 'column')
    // Into the neighbouring, fully merged column: not allowed.
    expect(canMove(g, at(g, 0, 0).id, at(g, 1, 0).id)).toBe(false)
    // Along row 0, the merged column is in the way (different height).
    expect(canMove(g, at(g, 0, 0).id, at(g, 2, 0).id)).toBe(false)
    expect(canMove(g, at(g, 0, 0).id, at(g, 0, 2).id)).toBe(true)
    expect(moveCell(g, at(g, 0, 0).id, at(g, 1, 0).id)).toBe(g)
  })
})

describe('setElement', () => {
  it('inserts and clears an element inside a split part', () => {
    let g = grid3()
    g = splitLeaf(g, at(g, 0, 0).node.id, 'row')
    const root = at(g, 0, 0).node
    if (root.kind !== 'split') throw new Error()
    const part = root.children[1].id
    g = setElement(g, part, createElement('eyecatcher'))
    const filled = at(g, 0, 0).node
    if (filled.kind !== 'split') throw new Error()
    expect(filled.children[1]).toMatchObject({ id: part, element: { type: 'eyecatcher', main: '', sub: '' } })
    expect(setElement(g, 'missing', null)).toBe(g)
  })
})

describe('splitting a merged cell', () => {
  it('splits a cell across two columns back into two grid cells', () => {
    let g = grid3()
    g = mergeToward(g, at(g, 0, 0).id, 'right')
    g = withNode(g, 0, 0, text('A'))
    const merged = at(g, 0, 0)
    g = splitPart(g, merged.id, 'leaf-A', 'row')
    expectValidTiling(g)
    expect(g.cells).toHaveLength(9)
    expect(at(g, 0, 0)).toMatchObject({ id: merged.id, colSpan: 1, node: text('A') })
    expect(at(g, 1, 0)).toMatchObject({ colSpan: 1, node: { kind: 'leaf', element: null } })
    expect(at(g, 1, 0).id).not.toBe(merged.id)
  })

  it('splits a 2x2 block into two cells, either way', () => {
    let g = grid3()
    g = mergeToward(g, at(g, 0, 0).id, 'right')
    g = mergeToward(g, at(g, 0, 0).id, 'down')
    const block = at(g, 0, 0)
    const sideBySide = splitPart(g, block.id, block.node.id, 'row')
    expectValidTiling(sideBySide)
    expect(at(sideBySide, 0, 0)).toMatchObject({ colSpan: 1, rowSpan: 2 })
    expect(at(sideBySide, 1, 1)).toMatchObject({ col: 1, colSpan: 1, rowSpan: 2 })
    const stacked = splitPart(g, block.id, block.node.id, 'column')
    expectValidTiling(stacked)
    expect(at(stacked, 0, 0)).toMatchObject({ colSpan: 2, rowSpan: 1 })
    expect(at(stacked, 1, 1)).toMatchObject({ row: 1, colSpan: 2, rowSpan: 1 })
  })

  it('cuts at the grid line closest to the middle', () => {
    const start = grid3()
    let g = mergeLine(start, at(start, 0, 0).id, 'row')
    g = { ...g, cols: [1, 1, 2] }
    expect(at(g, 0, 0).colSpan).toBe(3)
    const row = at(g, 0, 0)
    // Widths 1 | 1 | 2: the line after two columns is exactly in the middle.
    const split = splitPart(g, row.id, row.node.id, 'row')
    expect(at(split, 0, 0).colSpan).toBe(2)
    expect(at(split, 2, 0).colSpan).toBe(1)
    // Equal widths: both inner lines are as close; the first one wins.
    const even = splitPart({ ...g, cols: [1, 1, 1] }, row.id, row.node.id, 'row')
    expect(at(even, 0, 0).colSpan).toBe(1)
    expect(at(even, 1, 0).colSpan).toBe(2)
  })

  it('splits a full-width part of a split cell along the grid line through it', () => {
    // A column-high cell, privately split 75/25 into a top and a bottom part
    // (the reported layout): splitting the top part stacked uses the row line
    // nearest its middle, and the bottom part stays where it is on the page.
    const start = grid3()
    let g = mergeLine(start, at(start, 0, 0).id, 'column')
    const tall = at(g, 0, 0)
    const top = text('Top')
    const bottom = text('Bottom')
    g = withNode(g, 0, 0, { kind: 'split', id: 's', direction: 'column', sizes: [3, 1], children: [top, bottom] })
    g = splitPart(g, tall.id, 'leaf-Top', 'column')
    expectValidTiling(g)
    expect(at(g, 0, 0)).toMatchObject({ id: tall.id, row: 0, rowSpan: 1, node: top })
    const rest = at(g, 0, 1)
    expect(rest).toMatchObject({ row: 1, rowSpan: 2 })
    if (rest.node.kind !== 'split') throw new Error()
    expect(rest.node.children[1]).toEqual(bottom)
    // The bottom part still starts at 75% of the original column, and the
    // sizes fill the new cell (as flex-grow factors they must sum to 1).
    const [emptyPart, bottomPart] = rest.node.sizes
    expect(emptyPart + bottomPart).toBeCloseTo(1)
    expect(1 / 3 + (2 / 3) * emptyPart).toBeCloseTo(0.75)
  })

  it('divides a part privately if the grid line would also cut its neighbours', () => {
    const start = grid3()
    let g = mergeLine(start, at(start, 0, 0).id, 'column')
    const tall = at(g, 0, 0)
    // Side by side halves: a row line through the left one would cut the right one too.
    g = withNode(g, 0, 0, { kind: 'split', id: 's', direction: 'row', sizes: [1, 1], children: [text('L'), text('R')] })
    const after = splitPart(g, tall.id, 'leaf-L', 'column')
    expect(after.cells).toHaveLength(g.cells.length)
  })

  it('divides privately where there is no grid line to use', () => {
    let g = grid3()
    g = mergeToward(g, at(g, 0, 0).id, 'right')
    const merged = at(g, 0, 0)
    // Stacked halves of a one-row cell: no row line inside it.
    const stacked = splitPart(g, merged.id, merged.node.id, 'column')
    expect(stacked.cells).toHaveLength(g.cells.length)
    expect(at(stacked, 0, 0).node).toMatchObject({ kind: 'split', direction: 'column' })
    // A single cell, and a part of an already split cell.
    const single = at(g, 0, 1)
    expect(at(splitPart(g, single.id, single.node.id, 'row'), 0, 1).node.kind).toBe('split')
    const halves = at(stacked, 0, 0).node
    if (halves.kind !== 'split') throw new Error()
    const again = splitPart(stacked, merged.id, halves.children[0].id, 'row')
    expect(again.cells).toHaveLength(stacked.cells.length)
  })
})

describe('splitting', () => {
  it('splits a leaf and merges it back', () => {
    let g = withNode(grid3(), 0, 0, text('A'))
    g = splitLeaf(g, 'leaf-A', 'row')
    const node = at(g, 0, 0).node
    expect(node).toMatchObject({ kind: 'split', direction: 'row', sizes: [1, 1] })
    if (node.kind !== 'split') throw new Error()
    expect(node.children[0]).toEqual(text('A'))
    expect(g.cells).toHaveLength(9) // the rest of the layout is untouched

    const cell = at(g, 0, 0).id
    const empty = node.children[1].id
    // The right half merges back to the left; the content fills the cell again.
    expect(canMergeLeafToward(g, cell, empty, 'left')).toBe(true)
    expect(at(mergeLeafToward(g, cell, empty, 'left'), 0, 0).node).toEqual(text('A'))
    expect(at(mergeLeafToward(g, cell, 'leaf-A', 'right'), 0, 0).node).toEqual(text('A'))
  })

  it('splits nested parts independently', () => {
    let g = grid3()
    g = splitLeaf(g, at(g, 0, 0).node.id, 'row')
    const root = at(g, 0, 0).node
    if (root.kind !== 'split') throw new Error()
    g = splitLeaf(g, root.children[1].id, 'column')
    const after = at(g, 0, 0).node
    if (after.kind !== 'split' || after.children[1].kind !== 'split') throw new Error()
    expect(after.children[1]).toMatchObject({ kind: 'split', direction: 'column' })

    // Bottom-right part: "above" stays inside its own split; "left" collapses
    // the outer split; "right" leaves the cell and merges grid cells.
    const cell = at(g, 0, 0).id
    const bottomRight = after.children[1].children[1].id
    const above = at(mergeLeafToward(g, cell, bottomRight, 'up'), 0, 0).node
    expect(above).toMatchObject({ kind: 'split', direction: 'row' })
    expect(at(mergeLeafToward(g, cell, bottomRight, 'left'), 0, 0).node.kind).toBe('leaf')
    const right = mergeLeafToward(g, cell, bottomRight, 'right')
    expect(at(right, 0, 0)).toMatchObject({ colSpan: 2, node: after })
  })

  it('falls back to merging grid cells when the cell is not split', () => {
    const g = grid3()
    const cell = at(g, 0, 0)
    expect(canMergeLeafToward(g, cell.id, cell.node.id, 'left')).toBe(false)
    expect(at(mergeLeafToward(g, cell.id, cell.node.id, 'down'), 0, 0).rowSpan).toBe(2)
  })
})
