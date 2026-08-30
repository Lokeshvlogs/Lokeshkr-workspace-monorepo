import { NextRequest, NextResponse } from "next/server"

import { setRefreshToken, setToken } from '@/lib/auth'
import { djangoFetch } from '@/lib/djangoFetch'

/**
 * Credential changes, one route per action.
 *
 * The action is matched against this map rather than interpolated into the
 * upstream path - a dynamic segment is caller-controlled, and an allowlist is
 * what stops it being used to reach any other endpoint on the service.
 * Each entry also names the fields to forward, so nothing else in the body
 * (say, an unexpected `is_staff`) is passed through.
 */
const ACTIONS: Record<string, { path: string; fields: string[] }> = {
    password: { path: '/auth_api/account/password', fields: ['current_password', 'new_password'] },
    email: { path: '/auth_api/account/email', fields: ['password', 'new_email'] },
    username: { path: '/auth_api/account/username', fields: ['password', 'new_username'] },
    phone: { path: '/auth_api/account/phone', fields: ['phone', 'country_code', 'code'] },
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ action: string }> },
) {
    const { action } = await params
    const spec = ACTIONS[action]

    if (!spec) {
        return NextResponse.json({ detail: 'Unknown account action.' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const payload: Record<string, unknown> = {}
    for (const field of spec.fields) {
        payload[field] = body[field] ?? ''
    }

    const result = await djangoFetch(spec.path, {
        method: 'POST',
        body: JSON.stringify(payload),
    })

    if (!result.ok) {
        return NextResponse.json(
            { success: false, detail: result.data?.detail ?? 'Could not save that change.' },
            { status: result.status },
        )
    }

    // Changing the password or username invalidates nothing on its own, but the
    // service hands back a fresh pair so the member is not silently logged out
    // by a stale token. Store it in the same cookies the login flow uses.
    if (result.data?.access && result.data?.refresh) {
        await setToken(result.data.access)
        await setRefreshToken(result.data.refresh)
    }

    return NextResponse.json(
        {
            success: true,
            username: result.data?.username,
            email: result.data?.email,
            phone: result.data?.phone,
            countryCode: result.data?.country_code,
        },
        { status: 200 },
    )
}
