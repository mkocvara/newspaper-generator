import { describe, expect, it } from 'vitest'
import { Editor } from './editor.svelte'

describe('Editor history', () => {
  it('undoes and redoes an update', () => {
    const editor = new Editor()
    editor.update((p) => (p.header.name = 'The Daily Bugle'))
    expect(editor.page.header.name).toBe('The Daily Bugle')

    editor.undo()
    expect(editor.page.header.name).toBe('')
    expect(editor.canRedo).toBe(true)

    editor.redo()
    expect(editor.page.header.name).toBe('The Daily Bugle')
    expect(editor.canRedo).toBe(false)
  })

  it('does not record updates that change nothing', () => {
    const editor = new Editor()
    editor.update((p) => (p.header.name = ''))
    expect(editor.canUndo).toBe(false)
  })

  it('clears redo after a new change', () => {
    const editor = new Editor()
    editor.update((p) => (p.header.name = 'A'))
    editor.undo()
    editor.update((p) => (p.header.name = 'B'))
    expect(editor.canRedo).toBe(false)
  })

  it('records a gesture as one step', () => {
    const editor = new Editor()
    const start = editor.page.header.heightMm
    editor.beginGesture()
    editor.page.header.heightMm = start + 1
    editor.page.header.heightMm = start + 5
    editor.endGesture()

    editor.undo()
    expect(editor.page.header.heightMm).toBe(start)
    expect(editor.canUndo).toBe(false)
  })

  it('ignores a gesture that ends where it started', () => {
    const editor = new Editor()
    editor.beginGesture()
    editor.endGesture()
    expect(editor.canUndo).toBe(false)
  })

  it('keeps assets out of history and prunes unused ones from the work file', () => {
    const editor = new Editor()
    const used = editor.addAsset('data:image/png;base64,AAA')
    editor.addAsset('data:image/png;base64,BBB')
    editor.update((p) => {
      p.grid.cells[0].node = {
        kind: 'leaf',
        id: 'x',
        element: { type: 'image', assetId: used, caption: '', ink: false, fit: 'scale' },
      }
    })

    expect(Object.keys(editor.toWorkFile().assets)).toEqual([used])
  })

  it('imports a work file as an undoable step', () => {
    const source = new Editor()
    source.update((p) => (p.header.name = 'Imported'))
    const editor = new Editor()
    editor.importFile(source.toWorkFile())
    expect(editor.page.header.name).toBe('Imported')
    editor.undo()
    expect(editor.page.header.name).toBe('')
  })

  it('loads a work file and resets history', () => {
    const editor = new Editor()
    editor.update((p) => (p.header.name = 'Old'))
    const file = editor.toWorkFile()

    const other = new Editor()
    other.update((p) => (p.header.name = 'Something else'))
    other.load(file)
    expect(other.page.header.name).toBe('Old')
    expect(other.canUndo).toBe(false)
  })
})
