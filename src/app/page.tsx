
"use client"
import { useState } from 'react'
import Link from 'next/link'
import ProfileCard from '../components/profile/ProfileCard'
import RegisterSlider from "@/components/register/RegisterSlider";
import { useAuth } from '../components/authProvider';
import { REPLCommand } from 'repl';
import ScrollableDropdown from '@/components/dropdown/ScrollableDropdown';

const sampleProfiles = [
  {
    name: 'Ananya',
    age: 27,
    location: 'Bengaluru, India',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=1'
  },
  {
    name: 'Rohit',
    age: 30,
    location: 'Mumbai, India',
    image: 'https://easy-peasy.ai/cdn-cgi/image/quality=95,format=auto,width=800/https://media.easy-peasy.ai/27feb2bb-aeb4-4a83-9fb6-8f3f2a15885e/98cef342-430c-4522-8fa6-106d93297351.png'
  },
  {
    name: 'Priya',
    age: 26,
    location: 'Delhi, India',
    image: 'https://shoutoutla.s3.us-west-1.amazonaws.com/wp-content/uploads/2021/05/c-PersonalAvniBarman__IMG5900_1616723337432.jpg'
  },
  {
    name: 'Amit',
    age: 32,
    location: 'Chennai, India',
    image: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=4'
  }
]

export default function Home() {
    const REGISTER_URL = "/api/register/";
    const auth = useAuth();
    const [lookingForVisible, setLookingForVisible] = useState<boolean>(false);
    const [age, setAge] = useState<number>(25);

    const [regMessage, setRegMessage] = useState<string>("");
    const [regLoading, setRegLoading] = useState<boolean>(false);

    async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setRegMessage("");
      setRegLoading(true);

    const formData = new FormData(event.currentTarget);
    const dataObject = Object.fromEntries(formData);
    const jsonData = JSON.stringify(dataObject);

    const requestOptions: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonData,
    };

    try {
      const response = await fetch(REGISTER_URL, requestOptions);

      let data: any = {};
      try {
        data = await response.json();
      } catch {}

      if (response.ok) {
        auth.loginRequiredRedirect();
      } else {
        setRegMessage(data?.error || "Registration failed.");
      }
    } catch (error) {
      setRegMessage("Network error.");
    }

    setRegLoading(false);
    }

  return (
    <div className="hero-bg min-h-screen">
      <div className="container mx-auto px-6 py-16">
        <section id="Home-Top" className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div id="TagLine" className="max-w-xl">
            <div className="pb-6">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">Vivah4U — Where Traditions Meet</h1>
              <p className="mt-4 text-lg text-gray-600">Find curated, verified profiles with family-friendly matchmaking tools and a modern, secure experience. Beautifully designed for meaningful connections.</p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link href="#profiles" className="btn bg-brand-500 text-white">Explore Profiles</Link>
                <Link href="#features" className="btn border border-gray-200">Learn More</Link>
              </div>
              <div className="mt-4 text-sm text-gray-500">Join thousands of happy families. Your privacy is our priority.</div>
            </div>

            <div className="flex items-center my-6" aria-hidden>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <div className="pt-6">
              <form onSubmit={handleRegister} className="bg-white p-6 rounded-lg max-w-md mx-auto border-2 border-red-100 focus-within:ring-4 focus-within:ring-pink-50 focus-within:ring-opacity-40" style={{boxShadow: '0 20px 40px rgba(236,72,153,0.14), 0 6px 12px rgba(236,72,153,0.08)'}}>
                <div className="grid grid-cols-1 gap-3">
                  <input name="email" placeholder="Email-Id" className="p-3 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400" />
                  <div className="grid grid-cols-2 gap-3">
                    <input name="first_name" placeholder="First Name" className="p-3 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400" />
                    <input name="last_name" placeholder="Last Name" className="p-3 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400" />
                  </div>
                  <div className="flex gap-3">
                    <ScrollableDropdown
                            label="Profile for"
                            options={[
                              { value: 'son', label: 'Son' },
                              { value: 'daughter', label: 'Daughter' },
                              { value: 'brother', label: 'Brother' },
                              { value: 'sister', label: 'Sister' },
                              { value: 'self', label: 'Self' },
                            ]}
                            className='w-36 text-sm'
                            optionButtonClassName='w-36 text-sm'
                            
                            onChange={(value) => setLookingForVisible(value === 'self')}
                          />
                    <ScrollableDropdown
                            label="Age"
                            options={Array.from({length: 43}, (_,i) => {
                              const v = (18 + i).toString();
                              return { value: v, label: v };
                            })}
                            className='w-20 text-sm'
                            onChange={(value) => setAge(Number(value))}
                          />
                    <input type="hidden" name="age" value={age} />
                    {lookingForVisible && (
                    <ScrollableDropdown
                            label="Looking for"
                            options={[
                              { value: 'bride', label: 'Bride' },
                              { value: 'groom', label: 'Groom' },
                            ]}
                            className='w-40 text-sm'
                          />
                          )}
                    </div>  
                  
                  <input name="phone" placeholder="Phone no." type="tel" className="input" />
                  <input name="password" placeholder="Password" type="password" className="input" />
                  <div className="flex items-center justify-center">
                    <button type="submit" className="btn bg-brand-500 text-white mx-auto" disabled={regLoading}>{regLoading ? 'Registering...' : 'Register'}</button>
                  </div>
                  {regMessage && <div className="text-sm text-red-600">{regMessage}</div>}
                </div>
              </form>
            </div>
          </div>
          <div className="img-collage grid grid-cols-2 gap-1 pulse">
            <img src="https://i.pinimg.com/1200x/42/26/91/422691e09e79e96b7075ef306a9c2d07.jpg" alt="portrait4"/>
            <img src="https://i.pinimg.com/1200x/5b/ff/eb/5bffeb824946fb9eee89e22cbbdab46b.jpg" alt="portrait3" />
            <img src="https://i.pinimg.com/1200x/69/82/29/69822936198d9451e50eab281ca524a1.jpg" alt="portrait" />
            <img src="https://i.pinimg.com/736x/a5/4c/14/a54c14db0cdadc4fe97ec3e6d26a020b.jpg" alt="portrait2" />
          </div>
          
        </section>


        <section id="profiles" className="mt-16">
          <h2 className="text-2xl font-bold">Featured Profiles</h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleProfiles.map((p) => (
              <ProfileCard key={p.name} name={p.name} age={p.age} location={p.location} image={p.image} />
            ))}
          </div>
        </section>

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
            <Link href="/contact" className="btn bg-brand-500 text-white px-4 py-2 rounded-md">Contact Us</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
