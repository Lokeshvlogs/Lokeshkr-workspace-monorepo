'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useAuth } from "../../components/authProvider";

export default function LoginPage() {
  const LOGIN_URL = "/api/login/";

  const auth = useAuth();

  const [username, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const dataObject = Object.fromEntries(formData);
    const jsonData = JSON.stringify(dataObject);

    const requestOptions: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonData,
    };

    try {
      const response = await fetch(LOGIN_URL, requestOptions);

      let data: any = {};
      try {
        data = await response.json();
      } catch {}

      if (response.ok) {
        auth.login(data?.username);
      } else {
        setMessage(data?.error || "Login failed.");
      }
    } catch (error) {
      setMessage("Network error.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="w-full max-w-md">
        <div className="card-flashy p-6">
          <h1 className="text-2xl font-bold">Login to Vivah4U</h1>
          <p className="text-sm text-gray-600 mt-2">Welcome back — continue where you left off.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username or Email</label>
              <input name="identifier" value={username} onChange={(e) => setUserName(e.target.value)} type="text" className="input mt-1" placeholder="username or you@example.com" autoComplete="username" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  className="input mt-1 pr-20"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  name="password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                </button>
              </div>
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
