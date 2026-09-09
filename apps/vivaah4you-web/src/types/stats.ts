/**
 * The dashboard's headline figures.
 *
 * Mirrors `/api/profile/stats`, which mirrors `profile_stats` in
 * `apps/profiles/api.py`. Lived inside `InsightsPanel` until that component was
 * split across the dashboard and `/visitors`, and several unrelated files had
 * to import a sidebar panel to name its own data.
 */
export interface MemberStats {
  windowDays: number
  profileViews: number
  uniqueVisitors: number
  repeatVisitors: number
  viewsMade: number
  matches: number
  newMatches: number
  recentlyJoined: number
  interestsReceived: number
  interestsUnseen: number
  interestsAccepted: number
  interestsSent: number
  interestsDeclined: number
  completeness: number
  photos: number
}
