import Link from 'next/link'
import { login, signup } from './actions'

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string; error: string }>
}) {
  const searchParams = await props.searchParams
  const isError = searchParams?.error === 'true'

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto mt-20">
      <Link
        href="/"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-gray-400 hover:text-white flex items-center group text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{' '}
        Back
      </Link>

      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-6 p-8 lg:p-12 neo-glass rounded-[2.5rem] shadow-2xl shadow-black/10 transition-all duration-500 hover:shadow-black/20">
        <div className="mb-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-ohio-peach rounded-2xl flex items-center justify-center shadow-2xl shadow-ohio-peach/30 mb-6 animate-smooth-bounce">
            <span className="text-3xl font-black text-white">O</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] text-center">
            Ohio Ledger
          </h1>
          <p className="text-sm font-semibold text-gray-500 mt-3 text-center uppercase tracking-[0.2em] opacity-80">
            A Smart FinTrack Protocol
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 px-1" htmlFor="email">
              Node Identity
            </label>
            <input
              className="neo-input"
              name="email"
              placeholder="you@protocol.com"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 px-1" htmlFor="password">
              Secure Key
            </label>
            <input
              className="neo-input"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-3 pt-4">
          <button
            formAction={login}
            className="w-full bg-ohio-peach hover:bg-ohio-gold text-[var(--color-brand-dark)] font-black uppercase tracking-[0.15em] py-4 rounded-xl transition-all duration-500 shadow-xl shadow-ohio-peach/20 hover:shadow-ohio-gold/30 text-xs"
          >
            Authenticate Stream
          </button>
          <button
            formAction={signup}
            className="w-full border-2 border-gray-500/20 bg-transparent hover:bg-gray-500/5 text-[var(--foreground)] font-black uppercase tracking-[0.15em] py-4 rounded-xl transition-all duration-500 text-xs"
          >
            Bootstrap New Node
          </button>
        </div>

        {searchParams?.message && (
          <div className={`mt-6 p-4 text-center rounded-2xl font-bold text-xs ring-1 ${isError ? 'bg-red-500/10 text-ohio-red ring-red-500/20' : 'bg-green-500/10 text-ohio-green ring-green-500/20'}`}>
            {searchParams.message}
          </div>
        )}
      </form>
    </div>
  )
}
