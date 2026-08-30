import { NextRequest, NextResponse } from "next/server"

import { DJANGO_API_ENDPOINT } from '@/config/defaults'
import { setRefreshToken, setToken } from '@/lib/auth'
import { djangoFetch } from '@/lib/djangoFetch'

const OTP_VERIFY_URL = `${DJANGO_API_ENDPOINT}/auth_api/otp/verify`

/**
 * Confirm a passcode and sign the member in.
 *
 * Verification IS the sign-in: the service returns a token pair, which is
 * stored in the same httpOnly cookies the password flow uses, so the caller
 * lands authenticated with no second step.
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}))

    const payload = {
        phone: String(body.phone ?? '').trim(),
        code: String(body.code ?? '').trim(),
        country_code: String(body.country_code ?? ''),
        purpose: body.purpose === 'login' ? 'login' : 'signup',
    }

    if (!payload.phone || !payload.code) {
        return NextResponse.json(
            { verified: false, detail: 'Enter the code we sent you.' },
            { status: 400 },
        )
    }

    let response: Response
    try {
        response = await fetch(OTP_VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
    } catch {
        return NextResponse.json(
            { verified: false, detail: 'Could not reach the Vivah4U service. Please try again.' },
            { status: 503 },
        )
    }

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
        return NextResponse.json(
            { verified: false, detail: data.detail ?? 'That code is incorrect or has expired.' },
            { status: response.status },
        )
    }

    await setToken(data.access)
    await setRefreshToken(data.refresh)

    // Decide the landing page here, while the token is already in hand, so the
    // client does not need a second round trip to know where to go.
    const me = await djangoFetch('/profiles/me')

    return NextResponse.json(
        {
            verified: true,
            username: data.username,
            profileId: data.profile_id ?? (me.ok ? me.data.profile_id ?? '' : ''),
            isProfileComplete: me.ok ? Boolean(me.data.is_complete) : false,
            profileCompleteness: me.ok ? Number(me.data.profile_completeness ?? 0) : 0,
        },
        { status: 200 },
    )
}
