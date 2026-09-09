import { NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

/** Headline figures for the member dashboard. All counted from real rows. */
export async function GET() {
    const result = await djangoFetch('/profiles/stats')

    if (!result.ok) {
        return NextResponse.json(
            { detail: result.data?.detail ?? 'Could not load your activity.' },
            { status: result.status },
        )
    }

    return NextResponse.json(
        {
            windowDays: Number(result.data.window_days ?? 30),
            profileViews: Number(result.data.profile_views ?? 0),
            uniqueVisitors: Number(result.data.unique_visitors ?? 0),
            repeatVisitors: Number(result.data.repeat_visitors ?? 0),
            viewsMade: Number(result.data.views_made ?? 0),
            matches: Number(result.data.matches ?? 0),
            newMatches: Number(result.data.new_matches ?? 0),
            recentlyJoined: Number(result.data.recently_joined ?? 0),
            interestsReceived: Number(result.data.interests_received ?? 0),
            interestsUnseen: Number(result.data.interests_unseen ?? 0),
            interestsAccepted: Number(result.data.interests_accepted ?? 0),
            completeness: Number(result.data.completeness ?? 0),
            photos: Number(result.data.photos ?? 0),
        },
        { status: 200 },
    )
}
