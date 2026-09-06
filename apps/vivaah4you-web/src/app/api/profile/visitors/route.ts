import { NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

/** Recent visitors to the signed-in member's profile, one entry per person. */
export async function GET() {
    const result = await djangoFetch('/profiles/visitors')

    // A failure here should not break the dashboard - the panel renders its own
    // empty state, which is indistinguishable from "nobody has visited yet".
    if (!result.ok || !Array.isArray(result.data)) {
        return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(
        result.data.map((visitor: Record<string, unknown>) => ({
            profileId: visitor.profile_id ?? '',
            name: [visitor.first_name, visitor.surname].filter(Boolean).join(' ').trim(),
            age: visitor.age ?? null,
            city: visitor.city ?? '',
            photo: visitor.photo ?? null,
            lastSeen: visitor.last_seen ?? null,
            verificationLevel: visitor.verification_level ?? 0,
        })),
        { status: 200 },
    )
}
