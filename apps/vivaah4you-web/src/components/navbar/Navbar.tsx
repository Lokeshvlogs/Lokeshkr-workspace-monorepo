'use client'

import Link from 'next/link'
import { MouseEvent, useEffect, useState } from 'react'
import { useAuth } from "@/components/authProvider";
import { useMessenger } from '@/components/messenger/MessengerProvider';

export default function Navbar() {
  const auth = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  /* Outstanding interests, for the badge. Read once per sign-in rather than
     polled: nothing here is time-critical, and a navbar that refetches on a
     timer is a request every member makes on every page. */
  const [interestCount, setInterestCount] = useState(0);
  const { openDrawer, unreadTotal } = useMessenger();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      setInterestCount(0);
      return;
    }

    let cancelled = false;
    fetch('/api/interests/counts')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setInterestCount(Number(data?.receivedPending ?? 0));
      })
      .catch(() => {
        // A badge that cannot load should disappear, not break the navbar.
      });

    return () => {
      cancelled = true;
    };
  }, [auth.isAuthenticated]);

  const handleLogoutClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    auth.logout();
  }

  const links = (
    <>
      {/* `/` is the dashboard now, not the matches grid, so "Matches" points at
          its own route and home gets its own link. */}
      <Link
        href={auth.isAuthenticated ? '/' : '/#register'}
        className="text-gray-700 hover:text-gray-900"
      >
        {auth.isAuthenticated ? 'Dashboard' : 'Join free'}
      </Link>
      {auth.isAuthenticated ? (
        <>
          <Link href="/matches" className="text-gray-700 hover:text-gray-900">Matches</Link>
          {/* Opens the drawer rather than navigating - chat is a panel over
              whatever you are doing now, not a destination. */}
          <button
            type="button"
            onClick={() => openDrawer()}
            aria-haspopup="dialog"
            className="nav-with-badge text-gray-700 hover:text-gray-900"
          >
            Chats
            {unreadTotal > 0 && <span className="nav-badge">{unreadTotal}</span>}
          </button>
          <Link href="/interests" className="nav-with-badge text-gray-700 hover:text-gray-900">
            Interests
            {interestCount > 0 && <span className="nav-badge">{interestCount}</span>}
          </Link>
          <Link href="/visitors" className="text-gray-700 hover:text-gray-900">Visitors</Link>
          <Link href="/profile/me" className="text-gray-700 hover:text-gray-900">My Profile</Link>
          <Link href="/settings" className="text-gray-700 hover:text-gray-900">Settings</Link>
          <button
            type="button"
            onClick={handleLogoutClick}
            className="rounded-md bg-color-primary px-4 py-2 text-white transition hover:opacity-90"
          >
            Logout
          </button>
        </>
      ) : (
        <Link href="/login" className="rounded-md bg-color-primary px-4 py-2 text-white transition hover:opacity-90">
          Login
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/60 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-color-primary font-bold text-white">V</div>
          <div className="font-semibold">Vivah4U</div>
        </Link>

        <nav className="hidden items-center gap-4 md:flex">{links}</nav>

        <div className="md:hidden">
          <button
            type="button"
            className="p-2"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menu
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-3 border-t bg-white px-6 py-4 md:hidden">{links}</nav>
      )}
    </header>
  )
}
