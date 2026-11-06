// An animated emoji (Google's Noto Emoji, CC BY 4.0) for the editor's stickers, when the browser
// can't fetch it from Google directly. Only those files: the codepoint is validated.
export async function GET(_req: Request, { params }: { params: Promise<{ cp: string }> }) {
  const { cp } = await params
  if (!/^[0-9a-f]{2,6}(_[0-9a-f]{2,6}){0,7}$/.test(cp)) return new Response('Invalid sticker', { status: 400 })
  const res = await fetch(`https://fonts.gstatic.com/s/e/notoemoji/latest/${cp}/512.gif`, { cache: 'force-cache' })
  if (!res.ok) return new Response('Sticker not found', { status: res.status === 404 ? 404 : 502 })
  const blob = await res.blob()
  if (blob.type !== 'image/gif' || blob.size > 8 * 1024 * 1024) return new Response('Invalid sticker', { status: 502 })
  return new Response(blob, {
    headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'public, max-age=604800, immutable' }
  })
}
