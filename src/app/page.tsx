
"use client"
import { useState } from 'react'
import Link from 'next/link'
import ProfileCard from '../components/profile/ProfileCard'
import { useAuth } from '../components/authProvider';
import ScrollableDropdown from '@/components/dropdown/ScrollableDropdown';
import SelectDropdown from '@/components/dropdown/SelectDropdown';
import { CountryCodes } from 'src/constants/selectOptions/places';
import { validateEmail } from '@/lib/validateEmail';

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
    const [error, setError] = useState<{ valid: boolean; error?: string } | null>(null);
    const [emailFocused, setEmailFocused] = useState<boolean>(false);
    const [countryCodeValue, setCountryCodeValue] = useState<string>("+91");

    // controlled email input with sanitization (only allow specific chars, max 2 @)
    const [email, setEmail] = useState<string>("");

  const handleEmailChange = (s: string) => {
    const value = s.replace(/[^a-zA-Z0-9@._-]/g, ''); // allow only valid email chars
    const atCount = (value.match(/@/g) || []).length;
    if (atCount > 1) return; // allow only a single @ while typing

    setEmail(value);

    // clear previous error while typing
    if (value === "") {
      setError(null);
    }
  };

    const [regMessage, setRegMessage] = useState<string>("");
    const [regLoading, setRegLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setRegMessage("");
      setRegLoading(true);

    const formData = new FormData(event.currentTarget);
    const dataObject: any = Object.fromEntries(formData);
    if (dataObject.country_code) {
      dataObject.phone = `${dataObject.country_code}${dataObject.phone || ''}`;
      delete dataObject.country_code;
    }
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
            <button type="submit" className="btn bg-brand-500 text-white px-4 py-2 rounded-full">Search</button>
          </form>
        </div>
      <div className="container mx-auto px-6 py-16 relative">
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
              <form onSubmit={handleRegister} className="bg-white p-6 rounded-lg max-w-md mx-auto border-2 focus-within:ring-4 focus-within:ring-pink-50 focus-within:ring-opacity-40" style={{boxShadow: '0 20px 40px rgba(14, 13, 13, 0.14), 0 6px 12px rgba(20, 20, 20, 0.08)'}}>
                <div className="grid grid-cols-1 gap-3">
                  <input
                    name="email"
                    type="email"
                    placeholder="Email-Id"
                    aria-invalid={error ? "true" : "false"}
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = (e.clipboardData || (window as any).clipboardData).getData('text') || '';
                      handleEmailChange(text);
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => {
                      setEmailFocused(false);
                      if (email.trim() === "") {
                        setError(null);
                        return;
                      }
                      const res = validateEmail(email);
                      if (res.valid) setError({ valid: true });
                      else setError({ valid: false, error: res.error });
                    }}
                    className={`p-3 text-lg rounded-md placeholder-gray-400 border border-blue-200 ${
                      emailFocused ? 'focus:ring-2 focus:ring-blue-300' : error && !error.valid ? 'border-2 border-red-400' : 'border border-blue-200'
                    } focus:outline-none`}
                  />
                  {error && <div className="text-red-500 text-sm mt-1">{error.error}</div>}
                  <div className="grid grid-cols-2 gap-3">
                    <input name="first_name" placeholder="First Name" className="p-3 text-lg border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400" />
                    <input name="last_name" placeholder="Last Name" className="p-3 text-lg border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400" />
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
                  
                  <div className="flex gap-3">
                    
                    <SelectDropdown
                      name="Country code"
                      options={CountryCodes}
                      initialValue  ="+91"
                      className="w-28 text-sm"
                      buttonClassName='p-4 border border-pink-200 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400'
                      extraLabelClassName='whitespace-nowrap'
                      onChange={(value) => setCountryCodeValue(value)}
                    />

                    <input name="phone" placeholder="Phone no." type="tel" className="p-3 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400" />
                  </div>
                  <div className="relative">
                    <input
                      name="password"
                      placeholder="Password"
                      type={showPassword ? 'text' : 'password'}
                      className="p-3 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400 pr-10"
                      aria-label="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-2 flex items-center text-gray-500"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.071-5.86M6.06 6.06A9.96 9.96 0 0112 5c5.523 0 10 4.477 10 10 0 1.035-.164 2.031-.475 2.958M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-center">
                    <button type="submit" className="btn bg-brand-500 text-white mx-auto" disabled={regLoading}>{regLoading ? 'Registering...' : 'Register'}</button>
                  </div>
                  {regMessage && <div className="text-sm text-red-600">{regMessage}</div>}
                </div>
              </form>
            </div>
          </div>
          <div className="img-collage grid grid-cols-2 gap-1 wiggle relative top-[100px]">
            <img src="https://i.pinimg.com/1200x/42/26/91/422691e09e79e96b7075ef306a9c2d07.jpg" alt="portrait4"/>
            <img src="https://i.pinimg.com/1200x/5b/ff/eb/5bffeb824946fb9eee89e22cbbdab46b.jpg" alt="portrait3" />
            <img src="https://i.pinimg.com/1200x/69/82/29/69822936198d9451e50eab281ca524a1.jpg" alt="portrait" />
            <img src="https://i.pinimg.com/736x/a5/4c/14/a54c14db0cdadc4fe97ec3e6d26a020b.jpg" alt="portrait2" />
          </div>
          
        </section>


        <section id="profiles" className="mt-16">v
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
