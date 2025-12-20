
import { DJANGO_API_ENDPOINT } from '@/config/defaults'
import { setRefreshToken, setToken } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

const DJANGO_API_LOGIN_URL = `${DJANGO_API_ENDPOINT}/auth_api/login/username`

export async function POST(request: NextRequest) {
    console.log("Sending login request to Django API start...")
    const requestData = await request.json()

    const identifier = requestData.identifier || requestData.username || requestData.email || ""
    const password = requestData.password || ""

    const payload: any = { password }
    if (identifier.includes("@")) {
        payload.email = identifier
    } else if (identifier) {
        payload.username = identifier
    }

    const jsonData = JSON.stringify(payload)
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: jsonData
    }

    console.log("Sending login request to Django API send now...")
    const response = await fetch(DJANGO_API_LOGIN_URL, requestOptions)
    const responseData = await response.json().catch(() => ({}))

    if (response.ok) {
        console.log("logged in")
        const {username, access, refresh} = responseData
        setToken(access)
        setRefreshToken(refresh)
        return NextResponse.json({"loggedIn": true, "username": username}, {status: 200})
    }

    return NextResponse.json({"loggedIn": false, ...responseData}, {status: 400})
}   