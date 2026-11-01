import { createDefaultPage, newId } from '../model/defaults'
import type { Assets, Page, WorkFile } from '../model/types'
import { toWorkFile } from '../model/workfile'

const HISTORY_LIMIT = 200

// Holds the page being edited plus its undo/redo history.
//
// History stores whole-page snapshots. Every change goes through it: layout,
// style, and finished text edits (committed when a text box loses focus), so
// undoing one change can never silently drop another. Image data lives in
// `assets`, outside the snapshots; it is append-only during a session and
// pruned when a work file is produced.
export class Editor {
  page = $state<Page>(createDefaultPage())
  assets = $state.raw<Assets>({})

  #past = $state.raw<Page[]>([])
  #future = $state.raw<Page[]>([])
  #gestureStart: Page | null = null

  canUndo = $derived(this.#past.length > 0)
  canRedo = $derived(this.#future.length > 0)

  // Apply a discrete change as one undoable step (skipped if nothing changed).
  update(change: (page: Page) => void) {
    const before = this.#snapshot()
    change(this.page)
    this.#record(before)
  }

  // For continuous interactions (dragging a border): mutate `page` freely
  // between begin and end, and the whole drag becomes one undoable step.
  beginGesture() {
    this.#gestureStart = this.#snapshot()
  }

  endGesture() {
    if (!this.#gestureStart) return
    this.#record(this.#gestureStart)
    this.#gestureStart = null
  }

  undo() {
    const previous = this.#past.at(-1)
    if (!previous) return
    this.#past = this.#past.slice(0, -1)
    this.#future = [...this.#future, this.#snapshot()]
    this.page = previous
  }

  redo() {
    const next = this.#future.at(-1)
    if (!next) return
    this.#future = this.#future.slice(0, -1)
    this.#past = [...this.#past, this.#snapshot()]
    this.page = next
  }

  addAsset(dataUrl: string): string {
    const id = newId()
    this.assets = { ...this.assets, [id]: dataUrl }
    return id
  }

  toWorkFile(): WorkFile {
    return toWorkFile(this.#snapshot(), this.assets)
  }

  load(file: WorkFile) {
    this.page = file.page
    this.assets = file.assets
    this.#past = []
    this.#future = []
    this.#gestureStart = null
  }

  #snapshot(): Page {
    return $state.snapshot(this.page)
  }

  #record(before: Page) {
    if (JSON.stringify(before) === JSON.stringify(this.#snapshot())) return
    this.#past = [...this.#past, before].slice(-HISTORY_LIMIT)
    this.#future = []
  }
}

export const editor = new Editor()
