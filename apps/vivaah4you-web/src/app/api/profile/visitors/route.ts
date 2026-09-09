import { NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

/** Recent visitors to the signed-in member's profile, one entry per person. */
export async function GET(request: Request) {
    // `?filter=repeat` narrows the list to people who came back.
    const filter = new URL(request.url).searchParams.get('filter') === 'repeat' ? '?filter=repeat' : ''
    const result = await djangoFetch(`/profiles/visitors${filter}`)

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
            visits: Number(visitor.visits ?? 1),
            isRepeat: Boolean(visitor.is_repeat),
            presence: visitor.presence ?? null,
        })),
        { status: 200 },
    )
}
