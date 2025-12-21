'use client'

import Link from 'next/link'
import { useAuth } from "@/components/authProvider";

export default function Navbar() { 
  const auth = useAuth();

  const handleLogoutClick = (e) => {
    e.preventDefault(); 
    auth.logout(); // This function should clear local storage, cookies, etc.
  }

  return (
    <header className="w-full border-b bg-white/60 backdrop-blur sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-brand-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">V</div>
          <div className="font-semibold">Vivah4U</div>
        </Link>
        <nav className="hidden md:flex gap-4 items-center">
          <Link href="#features" className="text-gray-700 hover:text-gray-900">Features</Link>
          <Link href="#" className="text-gray-700 hover:text-gray-900">Success Stories</Link>
          {!auth.isAuthenticated ? (
            <Link href="/login" className="bg-brand-500 text-white px-4 py-2 rounded-md">Login</Link>
          ) : (
            <Link href="/dashboard" onClick={handleLogoutClick} className="bg-brand-500 text-white px-4 py-2 rounded-md">Logout</Link>
          )}
        </nav>
        <div className="md:hidden">
          <button className="p-2">Menu</button>
        </div>
      </div>
    </header>
  )
}
