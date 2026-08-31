'use client'

import Link from 'next/link'
import { MouseEvent, useState } from 'react'
import { useAuth } from "@/components/authProvider";

export default function Navbar() {
  const auth = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogoutClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    auth.logout();
  }

  const links = (
    <>
      <Link
        href={auth.isAuthenticated ? '/#profiles' : '/#register'}
        className="text-gray-700 hover:text-gray-900"
      >
        {auth.isAuthenticated ? 'Matches' : 'Join free'}
      </Link>
      {auth.isAuthenticated ? (
        <>
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
