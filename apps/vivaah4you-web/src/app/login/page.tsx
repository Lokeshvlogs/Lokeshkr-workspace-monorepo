'use client'

import { Suspense, useState, FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from "../../components/authProvider";

function LoginCard() {
  const LOGIN_URL = "/api/login";

  const auth = useAuth();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === '1';

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

    try {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataObject),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch { }

      if (response.ok && data?.loggedIn) {
        // login() decides between the profile wizard and the home page.
        auth.login({
          username: data.username,
          isProfileComplete: data.isProfileComplete,
          profileId: data.profileId,
        });
      } else {
        setMessage(data?.detail || "Login failed.");
        setLoading(false);
      }
    } catch (error) {
      setMessage("Network error.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="w-full max-w-md">
        <div className="card-flashy p-6">
          <h1 className="text-2xl font-bold">Login to Vivah4U</h1>
          <p className="text-sm text-gray-600 mt-2">Welcome back — continue where you left off.</p>

          {justRegistered && (
            <div className="mt-4 rounded-md border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-800" role="status">
              Your account is ready. Sign in to finish building your profile.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">Username or Email</label>
              <input id="identifier" name="identifier" value={username} onChange={(e) => setUserName(e.target.value)} type="text" className="input mt-1" placeholder="username or you@example.com" autoComplete="username" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  id="password"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-color-primary hover:opacity-80"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button type="submit" className="btn bg-color-primary text-white" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
              <Link href="/" className="text-sm text-gray-600 hover:underline">Back to home</Link>
            </div>

            {message && <div className="text-sm text-red-600" role="alert">{message}</div>}
          </form>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">New here? <Link href="/#register" className="text-color-primary">Create an account</Link></div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary during prerendering.
  return (
    <Suspense fallback={null}>
      <LoginCard />
    </Suspense>
  )
}
