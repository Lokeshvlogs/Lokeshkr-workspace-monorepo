import { NextResponse } from "next/server"

import { deleteTokens } from '@/lib/auth'

/**
 * Clear the session cookies.
 *
 * Logging out used to only reset localStorage, which is decorative - the real
 * credential is the httpOnly `auth-token`/`auth-refresh-token` pair, and it
 * survived a "logout" entirely. Only the server can delete those.
 */
export async function POST() {
    await deleteTokens()
    return NextResponse.json({ loggedOut: true }, { status: 200 })
}
