import { describe, expect, it } from 'vitest'
import { createDefaultPage } from './defaults'
import {
  canMergeLine,
  canMergeToward,
  canMergeWithSibling,
  canMove,
  insertColumn,
  insertRow,
  mergeLine,
  mergeToward,
  mergeWithSibling,
  moveCell,
  removeColumn,
  removeRow,
  resizeTracks,
  splitLeaf,
} from './grid'
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

describe('splitting', () => {
  it('splits a leaf and merges it back', () => {
    let g = withNode(grid3(), 0, 0, text('A'))
    g = splitLeaf(g, 'leaf-A', 'row')
    const node = at(g, 0, 0).node
    expect(node).toMatchObject({ kind: 'split', direction: 'row', sizes: [1, 1] })
    if (node.kind !== 'split') throw new Error()
    expect(node.children[0]).toEqual(text('A'))
    expect(g.cells).toHaveLength(9) // the rest of the layout is untouched

    const empty = node.children[1].id
    expect(canMergeWithSibling(g, empty)).toBe(true)
    // Merging the empty half lets the content fill the cell again.
    expect(at(mergeWithSibling(g, empty), 0, 0).node).toEqual(text('A'))
  })

  it('splits nested parts independently', () => {
    let g = grid3()
    g = splitLeaf(g, at(g, 0, 0).node.id, 'row')
    const root = at(g, 0, 0).node
    if (root.kind !== 'split') throw new Error()
    g = splitLeaf(g, root.children[1].id, 'column')
    const after = at(g, 0, 0).node
    if (after.kind !== 'split') throw new Error()
    expect(after.children[1]).toMatchObject({ kind: 'split', direction: 'column' })
    expect(canMergeWithSibling(g, root.children[0].id)).toBe(true)
  })

  it('cannot merge an unsplit cell with a sibling', () => {
    const g = grid3()
    expect(canMergeWithSibling(g, at(g, 0, 0).node.id)).toBe(false)
  })
})
