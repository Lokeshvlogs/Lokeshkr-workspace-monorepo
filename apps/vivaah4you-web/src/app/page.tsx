
"use client"
import { useState } from 'react'
import Link from 'next/link'
import MatchesSection from '../components/profile/MatchesSection'
import { useAuth } from '../components/authProvider';
import RegisterForm from './Register/RegisterForm'
import { ScrollableDropdown, SelectDropdown } from '@lokesh-workspace/ui';
 


export default function Home() {
    const REGISTER_URL = "/api/register/"; 
    const auth = useAuth();
    

  return (
      <div className="hero-bg min-h-screen">
        <div className="absolute left-1/2 transform -translate-x-1/2 top-[80px] max-w-4xl z-50">
          <form onSubmit={(e) => e.preventDefault()} className="bg-white rounded-full shadow-lg border px-4 py-3 flex items-center gap-3">
            <ScrollableDropdown
              label="I'm a"
              options={[{ value: 'male', label: 'Man' }, { value: 'female', label: 'Woman' }]}
              className="w-36 text-sm"
              optionButtonClassName='w-36 text-sm'
            />
            <ScrollableDropdown
              label="Age"
              options={Array.from({ length: 43 }, (_, i) => {
                const v = (18 + i).toString();
                return { value: v, label: v };
              })}
              className="w-24 text-sm"
            />
            <ScrollableDropdown
              label="Looking for"
              options={[{ value: 'male', label: 'Man' }, { value: 'female', label: 'Woman' }]}
              className="w-36 text-sm"
              optionButtonClassName='w-36 text-sm'
            />
            <ScrollableDropdown
              label="Min age"
              options={Array.from({ length: 43 }, (_, i) => {
                const v = (18 + i).toString();
                return { value: v, label: v };
              })}
              className="w-20 text-sm"
            />
            <ScrollableDropdown
              label="Max age"
              options={Array.from({ length: 43 }, (_, i) => {
                const v = (18 + i).toString();
                return { value: v, label: v };
              })}
              className="w-20 text-sm"
            />
            <button type="submit" className="btn-primary px-4 py-2 rounded-full">Search</button>
          </form>
        </div>
      <div className="container mx-auto px-6 py-16 relative">
        <section id="Home-Top" className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div id="TagLine" className="max-w-xl">
            <div className="pb-6">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">Vivah4U — Where Traditions Meet</h1>
              <p className="mt-4 text-lg text-gray-600">Find curated, verified profiles with family-friendly matchmaking tools and a modern, secure experience. Beautifully designed for meaningful connections.</p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link href="#profiles" className="btn bg-color-primary text-white">Explore Profiles</Link>
                <Link href="#features" className="btn border border-gray-200">Learn More</Link>
              </div>
              <div className="mt-4 text-sm text-gray-500">Join thousands of happy families. Your privacy is our priority.</div>
            </div>

            <div className="flex items-center my-6" aria-hidden>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <div className="pt-6" id="register">
              {auth.isAuthenticated ? (
                <div className="rounded-lg border border-color-border bg-white p-6 text-center">
                  <p className="font-semibold text-gray-900">Welcome back{auth.username ? `, ${auth.username.split('@')[0]}` : ''}!</p>
                  <p className="mt-1 text-sm text-color-placeholder-text">
                    {auth.isProfileComplete
                      ? 'Your profile is live. Browse your matches below.'
                      : 'Finish your profile to start appearing in match results.'}
                  </p>
                  <Link
                    href={auth.isProfileComplete ? '/profile/me' : '/profile/register'}
                    className="btn-primary mt-4 inline-flex"
                  >
                    {auth.isProfileComplete ? 'View my profile' : 'Complete my profile'}
                  </Link>
                </div>
              ) : (
                <RegisterForm />
              )}
            </div>
          </div>
          <div className="img-collage grid grid-cols-2 gap-1 pulse relative top-[100px]">
            <img src="https://i.pinimg.com/1200x/42/26/91/422691e09e79e96b7075ef306a9c2d07.jpg" alt="portrait4"/>
            <img src="https://i.pinimg.com/1200x/5b/ff/eb/5bffeb824946fb9eee89e22cbbdab46b.jpg" alt="portrait3" />
            <img src="https://i.pinimg.com/1200x/69/82/29/69822936198d9451e50eab281ca524a1.jpg" alt="portrait" />
            <img src="https://i.pinimg.com/736x/a5/4c/14/a54c14db0cdadc4fe97ec3e6d26a020b.jpg" alt="portrait2" />
          </div>
          
        </section>


        <MatchesSection />

        <section id="features" className="mt-16">
          <h2 className="text-2xl font-bold">Why Vivah4U</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg shadow">
              <h4 className="font-semibold">Verified Profiles</h4>
              <p className="mt-2 text-gray-600">Profiles with verified contact and identity checks.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h4 className="font-semibold">Privacy Controls</h4>
              <p className="mt-2 text-gray-600">Control who sees your profile and photos.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h4 className="font-semibold">Matchmaking Assistance</h4>
              <p className="mt-2 text-gray-600">Expert suggestions and family-friendly tools.</p>
            </div>
          </div>
        </section>

        <footer className="mt-24 text-center text-sm text-gray-500">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div>© {new Date().getFullYear()} Vivah4U — Built with ❤️</div>
            <Link href="/contact" className="btn bg-color-primary text-white px-4 py-2 rounded-md">Contact Us</Link>
          </div>
        </footer>
      </div>
    </div>  
  )
}
