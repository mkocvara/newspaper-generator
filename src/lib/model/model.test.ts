import { describe, expect, it } from 'vitest'
import { createDefaultPage, formatDate } from './defaults'
import { parseWorkFile, toWorkFile } from './workfile'

describe('formatDate', () => {
  it('formats as d. m. YYYY without padding', () => {
    expect(formatDate(new Date(2026, 2, 5))).toBe('5. 3. 2026')
    expect(formatDate(new Date(2026, 10, 21))).toBe('21. 11. 2026')
  })
})

describe('createDefaultPage', () => {
  it('starts as an empty 3x3 grid', () => {
    const { grid } = createDefaultPage()
    expect(grid.cols).toEqual([1, 1, 1])
    expect(grid.rows).toEqual([1, 1, 1])
    expect(grid.cells).toHaveLength(9)
    expect(grid.cells.every((c) => c.node.kind === 'leaf' && c.node.element === null)).toBe(true)
  })

  it('prefills the date and page number only', () => {
    const { header, footer } = createDefaultPage(new Date(2026, 0, 1))
    expect(header).toMatchObject({ date: '1. 1. 2026', name: '', location: '' })
    expect(footer).toMatchObject({ left: '', center: '', right: 'Page 1' })
  })
})

describe('parseWorkFile', () => {
  it('round-trips a work file through JSON', () => {
    const file = toWorkFile(createDefaultPage(), {})
    expect(parseWorkFile(JSON.parse(JSON.stringify(file)))).toEqual(file)
  })

  it('fills in style options missing from older files', () => {
    const file = toWorkFile(createDefaultPage(), {})
    const old = JSON.parse(JSON.stringify(file))
    delete old.page.style.nameDecoration
    old.page.style.frameStyle = 'thick-thin'
    const parsed = parseWorkFile(old)!
    expect(parsed.page.style.nameDecoration).toEqual(file.page.style.nameDecoration)
    expect(parsed.page.style.frameStyle).toBe('thick-outer')
  })

  it('rejects other JSON', () => {
    expect(parseWorkFile({ hello: 'world' })).toBeNull()
    expect(parseWorkFile(null)).toBeNull()
    expect(parseWorkFile({ app: 'newspaper-generator', version: 2 })).toBeNull()
  })
})
