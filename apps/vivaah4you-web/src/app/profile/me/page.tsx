import { redirect } from 'next/navigation'

/**
 * The member's own profile is part of the dashboard now, not a page of its own.
 *
 * Kept as a redirect rather than deleted: the wizard finishes by pushing here,
 * settings links to it, and members have it bookmarked.
 */
export default function MyProfileRedirect() {
  redirect('/?view=me')
}
