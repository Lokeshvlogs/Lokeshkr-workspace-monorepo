import { DJANGO_API_ENDPOINT } from '@/config/defaults'
import { getRefreshToken, getToken, setToken } from '@/lib/auth'

export type DjangoResult = {
  ok: boolean
  status: number
  data: any
}

/**
 * Exchange the refresh cookie for a fresh access token.
 *
 * Access tokens are short-lived, so a user who spends a few minutes on one step
 * of the profile wizard would otherwise hit "Given token not valid for any token
 * type" on the next save. Returns the new access token, or null when the refresh
 * token is itself expired/invalid (the caller should then send the user to log in).
 */
async function refreshAccessToken(): Promise<string | null> {
  const refresh = await getRefreshToken()
  if (!refresh) return null

  try {
    const response = await fetch(`${DJANGO_API_ENDPOINT}/auth_api/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
      cache: 'no-store',
    })

    if (!response.ok) return null

    const data = await response.json().catch(() => ({}))
    if (!data.access) return null

    await setToken(data.access)
    return data.access
  } catch {
    return null
  }
}

async function call(path: string, init: RequestInit, token?: string): Promise<Response> {
  return fetch(`${DJANGO_API_ENDPOINT}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
}

/**
 * Call the Django service, attaching the httpOnly JWT when `authenticated`.
 * A 401 triggers one silent token refresh and a single retry.
 */
export async function djangoFetch(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<DjangoResult> {
  const token = authenticated ? await getToken() : undefined

  if (authenticated && !token) {
    // No access cookie at all - the refresh cookie may still be valid.
    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      return { ok: false, status: 401, data: { detail: 'Not signed in' } }
    }
    return djangoFetchWith(path, init, refreshed, false)
  }

  return djangoFetchWith(path, init, token, authenticated)
}

async function djangoFetchWith(
  path: string,
  init: RequestInit,
  token: string | undefined,
  allowRetry: boolean,
): Promise<DjangoResult> {
  try {
    let response = await call(path, init, token)

    if (response.status === 401 && allowRetry) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        response = await call(path, init, refreshed)
      }
    }

    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, status: response.status, data }
  } catch {
    return {
      ok: false,
      status: 503,
      data: { detail: 'Could not reach the Vivah4U service.' },
    }
  }
}
