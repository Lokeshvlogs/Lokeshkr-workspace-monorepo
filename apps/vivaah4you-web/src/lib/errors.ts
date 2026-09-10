/**
 * A message safe to render, out of whatever an endpoint actually returned.
 *
 * `detail` is not always a string. django-ninja answers a schema violation with
 * an array of `{type, loc, msg}` objects, and passing one of those straight
 * into JSX throws "Objects are not valid as a React child" - which replaces a
 * form's inline error with a blank screen, so the one thing the member needed
 * to read is the thing that breaks the page.
 */
export function detailMessage(data: unknown, fallback: string): string {
  if (typeof data === 'string') return data || fallback

  if (Array.isArray(data)) {
    const parts = data
      .map((entry) => (typeof entry === 'string' ? entry : (entry as any)?.msg))
      .filter((part): part is string => typeof part === 'string' && part.length > 0)
    return parts.length ? parts.join('. ') : fallback
  }

  if (data && typeof data === 'object') {
    const detail = (data as any).detail
    // Recurse once: `{ detail: [{msg}] }` is the shape ninja actually sends.
    if (detail !== undefined && detail !== data) return detailMessage(detail, fallback)
  }

  return fallback
}
