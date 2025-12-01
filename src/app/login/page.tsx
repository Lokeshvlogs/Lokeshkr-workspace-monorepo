'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    // Mock login flow
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    if (email && password) {
      setMessage('Login successful (mock). Redirecting...')
      // In a real app you'd call your API and redirect on success
    } else {
      setMessage('Please enter email and password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="w-full max-w-md">
        <div className="card-flashy p-6">
          <h1 className="text-2xl font-bold">Login to Vivah4U</h1>
          <p className="text-sm text-gray-600 mt-2">Welcome back — continue where you left off.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input mt-1" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="input mt-1" placeholder="••••••••" />
            </div>

            <div className="flex items-center justify-between">
              <button type="submit" className="btn bg-brand-500 text-white" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
              <Link href="/" className="text-sm text-gray-600 hover:underline">Back to home</Link>
            </div>

            {message && <div className="text-sm text-gray-700">{message}</div>}
          </form>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">New here? <Link href="#" className="text-brand-500">Create an account</Link></div>
      </div>
    </div>
  )
}
