import { NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

/** The signed-in member's login credentials, for the settings page. */
export async function GET() {
    const result = await djangoFetch('/auth_api/account')

    if (!result.ok) {
        return NextResponse.json(
            { detail: result.data?.detail ?? 'Could not load your account settings.' },
            { status: result.status },
        )
    }

    return NextResponse.json(
        {
            username: result.data.username ?? '',
            email: result.data.email ?? '',
            phone: result.data.phone ?? '',
            countryCode: result.data.country_code ?? '',
            phoneVerified: Boolean(result.data.phone_verified),
            hasUsablePassword: Boolean(result.data.has_usable_password),
        },
        { status: 200 },
    )
}
