// Editor drafts: projects with their media, kept in this browser (IndexedDB), never uploaded.
// { id, name, savedAt, size, thumb, duration, still, project, media: { [mediaId]: Blob } }

const DB_NAME = 'lucymixer-drafts'

export type DraftMeta = {
  id: string
  name: string
  savedAt: number
  size: number
  thumb: string
  duration: number
  still: boolean
}

type Draft = DraftMeta & { project: object; media: Record<string, Blob> }

type DraftInput = {
  id?: string
  name?: string
  project: object
  media?: Record<string, Blob>
  thumb?: string
  duration?: number
  still?: boolean
}

let dbPromise: Promise<IDBDatabase> | null = null

function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore('drafts', { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      dbPromise = null
      reject(req.error || new Error('Drafts are unavailable in this browser'))
    }
  })
  return dbPromise
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest | void): Promise<T> {
  const d = await db()
  return new Promise((resolve, reject) => {
    const t = d.transaction('drafts', mode)
    let result: T
    const req = fn(t.objectStore('drafts'))
    if (req) req.onsuccess = () => (result = req.result)
    t.oncomplete = () => resolve(result)
    t.onerror = () => reject(t.error || new Error('Drafts error'))
    t.onabort = () => reject(t.error || new Error('Drafts aborted'))
  })
}

function meta(d: Draft): DraftMeta {
  return { id: d.id, name: d.name, savedAt: d.savedAt, size: d.size, thumb: d.thumb, duration: d.duration, still: d.still }
}

async function get(id: string): Promise<Draft> {
  const d = await tx<Draft | undefined>('readonly', (s) => s.get(String(id)))
  if (!d) throw new Error('This draft was not found')
  return d
}

export const drafts = {
  list: async (): Promise<DraftMeta[]> => {
    const all = (await tx<Draft[]>('readonly', (s) => s.getAll())) || []
    return all.map(meta).sort((a, b) => b.savedAt - a.savedAt)
  },
  // A new id when none is given.
  save: async (input: DraftInput): Promise<DraftMeta> => {
    if (!input.project || typeof input.project !== 'object') throw new Error('Nothing to save')
    const media: Record<string, Blob> = {}
    let size = JSON.stringify(input.project).length
    for (const [k, blob] of Object.entries(input.media || {})) {
      if (!(blob instanceof Blob)) continue
      media[k] = blob
      size += blob.size
    }
    const id = typeof input.id === 'string' && /^[0-9a-f-]{36}$/.test(input.id) ? input.id : crypto.randomUUID()
    const draft: Draft = {
      id,
      name: String(input.name || 'Draft').slice(0, 80),
      savedAt: Date.now(),
      size,
      thumb: typeof input.thumb === 'string' && input.thumb.startsWith('data:image/') ? input.thumb.slice(0, 200_000) : '',
      duration: Number(input.duration) || 0,
      still: Boolean(input.still),
      project: input.project,
      media
    }
    await tx('readwrite', (s) => s.put(draft))
    return meta(draft)
  },
  load: (id: string) => get(id),
  rename: async (id: string, name: string): Promise<DraftMeta> => {
    const d = await get(id)
    d.name = String(name || d.name).slice(0, 80)
    await tx('readwrite', (s) => s.put(d))
    return meta(d)
  },
  remove: async (id: string) => {
    await tx('readwrite', (s) => s.delete(String(id)))
    return { ok: true }
  }
}
