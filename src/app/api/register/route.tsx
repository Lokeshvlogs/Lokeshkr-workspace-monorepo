import { DJANGO_API_ENDPOINT } from '@/config/defaults'
import { setRefreshToken, setToken } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

const DJANGO_API_REGISTER_URL = `${DJANGO_API_ENDPOINT}/auth_api/register`

//USER Registration api route
export async function POST(request: NextRequest) {
    console.log("POST Register request to Django API ...")
    const requestData = await request.json()

    const username = requestData.username 
    const email = requestData.email
    const password = requestData.password
    const phone = requestData.phone
    const payload: any = { username, email, phone, password }

    const jsonData = JSON.stringify(payload)
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: jsonData
    }

    console.log("POST register request to Django API send ...")
    const response = await fetch(DJANGO_API_REGISTER_URL, requestOptions)
    const responseData = await response.json().catch(() => ({}))

    if (response.ok) {
        console.log("Registered successfully!")
        const {username, access, refresh} = responseData
        setToken(access)
        setRefreshToken(refresh)
        return NextResponse.json({"Registered": true, "username": username}, {status: 200})
    }

    return NextResponse.json({"Registered": false, ...responseData}, {status: 400})
}   