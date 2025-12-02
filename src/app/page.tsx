
"use client"
import Link from 'next/link'
import ProfileCard from '../components/profile/ProfileCard'

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
    async function getHelloFromDjango() {
        const res = await fetch('http://127.0.0.1:8001/api/auth_api/hello');
        const data = await res.json();
        console.log(data);
    }
    async function handleCLick() {
        await getHelloFromDjango();
    }

  return (
    <div className="hero-bg min-h-screen">
      <div className="container mx-auto px-6 py-16">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="max-w-xl">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">Vivah4U — Where Traditions Meet Spark</h1>
            <p className="mt-6 text-lg text-gray-600">Find curated, verified profiles with family-friendly matchmaking tools and a modern, secure experience. Beautifully designed for meaningful connections.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="#profiles" className="btn bg-brand-500 text-white">Explore Profiles</Link>
              <Link href="#features" className="btn border border-gray-200">Learn More</Link>
              <Link href="/login" className="btn border border-gray-200">Login</Link>
              <button onClick={handleCLick} className="btn border border-gray-200">Test Django API</button>
            </div>
            <div className="mt-6 text-sm text-gray-500">Join thousands of happy families. Your privacy is our priority.</div>
          </div>

          <div className="img-collage grid grid-cols-2 gap-3 pulse">
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

        <footer className="mt-24 text-center text-sm text-gray-500">© {new Date().getFullYear()} Vivah4U — Built with ❤️</footer>
      </div>
    </div>
  )
}
