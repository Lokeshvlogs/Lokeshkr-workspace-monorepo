import { supabase, signInWithGoogle } from './supabase'

// The editor's import sources on the web: the signed-in user's saved favorites and history, read
// from Supabase (only links and the user's own category names, tags and hints are stored there).
// Instagram media can't be loaded from a web page, so these are links: the editor opens them on
// Instagram (linksOnly). Local files are imported by the editor itself.

type Post = { code: string; link: string; label: string; thumb: string; at: string; hint: string; kind: 'post' | 'reel' }
type Category = { id: string; name: string; tags: string[]; items: Post[] }

const HISTORY_PAGE = 60

// A post link: https://www.instagram.com/[<user>/](p|reel)/<code>/ -> its parts, or null for a profile.
function parsePost(link: string): { user: string; code: string; reel: boolean } | null {
  const m = /^https:\/\/www\.instagram\.com\/(?:([A-Za-z0-9._]{1,30})\/)?(p|reel)\/([A-Za-z0-9_-]+)\/$/.exec(link)
  return m ? { user: m[1] || '', code: m[3], reel: m[2] === 'reel' } : null
}

function postOf(link: string, at: string, hint = ''): Post | null {
  const p = parsePost(link)
  if (!p) return null
  return { code: p.code, link, label: p.user ? `@${p.user}` : p.code, thumb: '', at, hint, kind: p.reel ? 'reel' : 'post' }
}

async function signedIn() {
  const { data } = await supabase().auth.getSession()
  return Boolean(data.session)
}

// All rows of a query, 1000 at a time.
async function allRows<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999)
    if (error) throw error
    out.push(...(data || []))
    if (!data || data.length < 1000) return out
  }
}

type CatRow = { id: string; name: string; tags: string[]; ig_account: string; created_at: string }
type FavRow = { link: string; category_ids: string[]; added_at: string; hint: string; ig_account: string }
type HistRow = { link: string; visited_at: string }

async function favorites() {
  if (!(await signedIn())) return { signedOut: true, categories: [] }
  const db = supabase()
  const [cats, favs] = await Promise.all([
    allRows<CatRow>((a, b) => db.from('favorite_categories').select('id,name,tags,ig_account,created_at').order('created_at').range(a, b)),
    allRows<FavRow>((a, b) => db.from('favorite_items').select('link,category_ids,added_at,hint,ig_account').order('added_at', { ascending: false }).range(a, b))
  ])
  // Each Instagram account the extension was used with keeps its own favorites (an opaque key).
  const accounts = [...new Set(cats.map((c) => c.ig_account))]
  const prefix = (key: string) => (accounts.length > 1 ? `Account ${accounts.indexOf(key) + 1} · ` : '')
  const categories: Category[] = cats.map((c) => ({ id: c.id, name: `${prefix(c.ig_account)}${c.name}`, tags: c.tags || [], items: [] }))
  const byId = new Map(categories.map((c) => [c.id, c]))
  for (const f of favs) {
    const post = postOf(f.link, f.added_at, f.hint)
    if (!post) continue
    for (const id of f.category_ids) byId.get(id)?.items.push(post)
  }
  return { categories }
}

// Newest first; `before` is the last row's time, `search` a username or post code.
async function history(before?: string, search = '') {
  if (!(await signedIn())) throw new Error('signed_out')
  let q = supabase()
    .from('history')
    .select('link,visited_at')
    .or('link.like.*/p/*,link.like.*/reel/*')
    .order('visited_at', { ascending: false })
    .limit(HISTORY_PAGE)
  if (before) q = q.lt('visited_at', before)
  const term = search.replace(/^@/, '').replace(/[^A-Za-z0-9._-]/g, '')
  if (term) q = q.ilike('link', `%${term}%`)
  const { data, error } = await q
  if (error) throw error
  const rows = (data || []) as HistRow[]
  const out = rows.map((r) => postOf(r.link, r.visited_at)).filter((p): p is Post => p != null)
  return Object.assign(out, { hasMore: rows.length === HISTORY_PAGE })
}

// An animated emoji GIF (Noto Emoji): straight from Google, else through this site's /api/emoji.
async function stickerGif(codepoint: string) {
  try {
    const res = await fetch(`https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoint}/512.gif`, { cache: 'force-cache', credentials: 'omit' })
    if (res.ok) return await res.blob()
  } catch {
    // blocked (CORS): the site's route fetches it
  }
  const res = await fetch(`/api/emoji/${codepoint}`)
  if (!res.ok) throw new Error("Couldn't load this sticker")
  return res.blob()
}

async function fontBytes(file: string) {
  const res = await fetch(`/editor/fonts/${file}`)
  if (!res.ok) throw new Error(`Font ${file} not found`)
  return res.arrayBuffer()
}

// Only local blobs are fetched (Instagram links aren't imported).
async function fetchBlob(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Couldn't load this file")
  return res.blob()
}

export const sources = {
  linksOnly: true,
  favorites,
  history,
  loadPost: async () => {
    throw new Error('Open it on Instagram, download it there, then drop the file into Files')
  },
  fetchBlob,
  stickerGif,
  fontBytes,
  signIn: () => signInWithGoogle(window.location.pathname)
}
