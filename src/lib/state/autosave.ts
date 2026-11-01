import type { WorkFile } from '../model/types'
import { parseWorkFile } from '../model/workfile'

// The work-in-progress page is cached in IndexedDB rather than localStorage,
// because embedded images can easily exceed localStorage's ~5 MB quota.
const DB_NAME = 'newspaper-generator'
const STORE = 'autosave'
const KEY = 'current'

// The connection stays open so a save issued as the tab closes starts
// immediately instead of waiting to reconnect.
let connection: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  connection ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  connection.catch(() => (connection = null))
  return connection
}

// Resolves to null (start fresh) if nothing is saved or IndexedDB is unusable.
// Deliberately no timeout: starting fresh while a slow load is still pending
// would let the next autosave overwrite the user's work.
export async function loadAutosave(): Promise<WorkFile | null> {
  try {
    const db = await openDb()
    const data = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction(STORE).objectStore(STORE).get(KEY)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    return parseWorkFile(data)
  } catch (error) {
    console.warn('Could not load autosave', error)
    return null
  }
}

export async function saveAutosave(file: WorkFile): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(file, KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (error) {
    console.warn('Could not autosave', error)
  }
}
