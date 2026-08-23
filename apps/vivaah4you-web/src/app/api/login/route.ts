import { NextRequest, NextResponse } from "next/server"

import { DJANGO_API_ENDPOINT } from '@/config/defaults'
import { setRefreshToken, setToken } from "@/lib/auth"
import { djangoFetch } from '@/lib/djangoFetch'

const DJANGO_API_LOGIN_USERNAME_URL = `${DJANGO_API_ENDPOINT}/auth_api/login/username`
const DJANGO_API_LOGIN_EMAIL_URL = `${DJANGO_API_ENDPOINT}/auth_api/login/email`

export async function POST(request: NextRequest) {
    const requestData = await request.json()

    const identifier: string = (
        requestData.identifier || requestData.username || requestData.email || ''
    ).trim()
    const password = requestData.password

    if (!identifier || !password) {
        return NextResponse.json(
            { loggedIn: false, detail: "Please enter your username and password." },
            { status: 400 },
        )
    }

    // Accounts are created with the email as the username, but the form accepts
    // either - route to whichever Django endpoint matches what was typed.
    const isEmail = identifier.includes("@")
    const url = isEmail ? DJANGO_API_LOGIN_EMAIL_URL : DJANGO_API_LOGIN_USERNAME_URL
    const payload = isEmail
        ? { email: identifier, password }
        : { username: identifier, password }

    let response: Response
    try {
        response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
    } catch {
        return NextResponse.json(
            { loggedIn: false, detail: "Could not reach the Vivah4U service. Please try again." },
            { status: 503 },
        )
    }

    const responseData = await response.json().catch(() => ({}))

    if (!response.ok) {
        return NextResponse.json(
            { loggedIn: false, detail: responseData.detail ?? "Invalid username or password." },
            { status: response.status },
        )
    }

    const { username, access, refresh } = responseData
    await setToken(access)
    await setRefreshToken(refresh)

    // Resolve where to send the user next while the token is already in hand.
    const me = await djangoFetch('/profiles/me')

    return NextResponse.json(
        {
            loggedIn: true,
            username,
            isProfileComplete: me.ok ? Boolean(me.data.is_complete) : false,
            profileCompleteness: me.ok ? Number(me.data.profile_completeness ?? 0) : 0,
            profileId: me.ok ? me.data.profile_id ?? '' : '',
        },
        { status: 200 },
    )
}
