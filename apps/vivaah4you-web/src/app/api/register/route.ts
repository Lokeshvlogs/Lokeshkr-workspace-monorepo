import { NextRequest, NextResponse } from "next/server"

import { DJANGO_API_ENDPOINT } from '@/config/defaults'

const DJANGO_API_REGISTER_URL = `${DJANGO_API_ENDPOINT}/auth_api/register`

// Sign-up proxy. Registration deliberately does NOT log the user in - the account
// is inert until the mobile number is confirmed. No tokens are minted here; the
// client goes to /verify next, and it is the passcode that signs the member in.
export async function POST(request: NextRequest) {
    const requestData = await request.json()

    const payload = {
        email: requestData.email,
        first_name: requestData.first_name,
        surname: requestData.surname,
        profile_for: requestData.profile_for,
        age: Number(requestData.age),
        looking_for: requestData.looking_for ?? null,
        managed_by: requestData.managed_by ?? null,
        country_code: requestData.country_code,
        phone: requestData.phone,
        password: requestData.password,
    }

    let response: Response
    try {
        response = await fetch(DJANGO_API_REGISTER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
    } catch {
        return NextResponse.json(
            { registered: false, detail: "Could not reach the Vivah4U service. Please try again." },
            { status: 503 },
        )
    }

    const responseData = await response.json().catch(() => ({}))

    if (response.ok) {
        return NextResponse.json(
            {
                registered: true,
                username: responseData.username,
                profile_id: responseData.profile_id,
                // Echoed so /verify can address the code to the right number.
                phone: responseData.phone ?? requestData.phone,
                country_code: responseData.country_code ?? requestData.country_code,
                verificationRequired: responseData.verification_required !== false,
            },
            { status: 200 },
        )
    }

    return NextResponse.json(
        { registered: false, detail: responseData.detail ?? "Registration failed. Please check your details." },
        { status: response.status },
    )
}
