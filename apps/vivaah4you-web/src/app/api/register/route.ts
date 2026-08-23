import { NextRequest, NextResponse } from "next/server"

import { DJANGO_API_ENDPOINT } from '@/config/defaults'

const DJANGO_API_REGISTER_URL = `${DJANGO_API_ENDPOINT}/auth_api/register`

// Sign-up proxy. Registration deliberately does NOT log the user in: the user is
// sent to /login afterwards, so no tokens are minted or stored here.
export async function POST(request: NextRequest) {
    const requestData = await request.json()

    const payload = {
        email: requestData.email,
        first_name: requestData.first_name,
        surname: requestData.surname,
        profile_for: requestData.profile_for,
        age: Number(requestData.age),
        looking_for: requestData.looking_for ?? null,
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
            },
            { status: 200 },
        )
    }

    return NextResponse.json(
        { registered: false, detail: responseData.detail ?? "Registration failed. Please check your details." },
        { status: response.status },
    )
}
