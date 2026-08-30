import { NextResponse } from "next/server"

import { DJANGO_API_ENDPOINT } from '@/config/defaults'

/**
 * Passcode timings, plus the development bypass code when one is configured.
 *
 * Sign-up issues its code server-side, so the verification screen never calls
 * /otp/request and would otherwise have no way to tell a tester what to type.
 * `devCode` is null in any deployment that clears OTP_DEV_CODE.
 */
export async function GET() {
    try {
        const response = await fetch(`${DJANGO_API_ENDPOINT}/auth_api/otp/config`, {
            cache: 'no-store',
        })
        const data = await response.json().catch(() => ({}))
        return NextResponse.json(
            {
                devCode: data.dev_code ?? null,
                expiresIn: Number(data.expires_in ?? 300),
                retryAfter: Number(data.retry_after ?? 30),
            },
            { status: 200 },
        )
    } catch {
        return NextResponse.json({ devCode: null, expiresIn: 300, retryAfter: 30 }, { status: 200 })
    }
}
