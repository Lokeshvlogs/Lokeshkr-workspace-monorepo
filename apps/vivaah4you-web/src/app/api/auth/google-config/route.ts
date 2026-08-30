import { NextResponse } from "next/server"

import { DJANGO_API_ENDPOINT } from '@/config/defaults'

/**
 * Whether "Continue with Google" can be offered yet.
 *
 * The client id lives on the service, so the button renders in a disabled,
 * self-explaining state until one is configured rather than failing when it is
 * pressed. Reachability problems are reported as "not configured" for the same
 * reason - either way the button cannot work right now.
 */
export async function GET() {
    try {
        const response = await fetch(`${DJANGO_API_ENDPOINT}/auth_api/google/config`, {
            cache: 'no-store',
        })
        const data = await response.json().catch(() => ({}))
        return NextResponse.json(
            { configured: Boolean(data.configured), clientId: data.client_id ?? '' },
            { status: 200 },
        )
    } catch {
        return NextResponse.json({ configured: false, clientId: '' }, { status: 200 })
    }
}
