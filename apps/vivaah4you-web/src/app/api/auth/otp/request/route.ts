import { NextRequest, NextResponse } from "next/server"

import { DJANGO_API_ENDPOINT } from '@/config/defaults'

const OTP_REQUEST_URL = `${DJANGO_API_ENDPOINT}/auth_api/otp/request`

/**
 * Ask for a one-time passcode.
 *
 * Unauthenticated by design - it is used before sign-in exists, both to confirm
 * a new number at sign-up and to start a passwordless login.
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}))

    const payload = {
        phone: String(body.phone ?? '').trim(),
        country_code: String(body.country_code ?? ''),
        purpose: body.purpose === 'login' || body.purpose === 'phone_change' ? body.purpose : 'signup',
    }

    if (!payload.phone) {
        return NextResponse.json(
            { sent: false, detail: 'Enter your mobile number.' },
            { status: 400 },
        )
    }

    let response: Response
    try {
        response = await fetch(OTP_REQUEST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
    } catch {
        return NextResponse.json(
            { sent: false, detail: 'Could not reach the Vivah4U service. Please try again.' },
            { status: 503 },
        )
    }

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
        return NextResponse.json(
            { sent: false, detail: data.detail ?? 'Could not send the code. Please try again.' },
            { status: response.status },
        )
    }

    return NextResponse.json(
        {
            sent: true,
            expiresIn: Number(data.expires_in ?? 300),
            retryAfter: Number(data.retry_after ?? 30),
            // Present only while the service has a development passcode set, so
            // the screen can tell the tester what to type. Null in production.
            devCode: data.dev_code ?? null,
        },
        { status: 200 },
    )
}
