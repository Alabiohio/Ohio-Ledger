import { createBusiness } from './actions'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Check if they already have a business to avoid duplicating
  const { data: existingBusiness } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existingBusiness) {
    redirect('/dashboard')
  }

  return (
    <div className="flex-1 flex flex-col w-full px-1 sm:max-w-md justify-center gap-2 mx-auto mt-20">
      <form action={createBusiness} className="animate-in flex-1 flex flex-col w-full justify-center gap-6 p-8 lg:p-12 neo-glass rounded-[2.5rem] shadow-2xl shadow-black/10 transition-all duration-500 hover:shadow-black/20">
        <div className="mb-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-[var(--color-brand-peach)] rounded-2xl flex items-center justify-center shadow-2xl shadow-black/10 mb-6 animate-smooth-bounce text-3xl font-black text-[var(--color-brand-dark)]">
            B
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] text-center">
            Setup Business
          </h1>
          <p className="text-sm font-semibold text-gray-500 mt-3 text-center uppercase tracking-[0.2em] opacity-80">
            Initialize Your Node
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 px-1" htmlFor="name">
              Business Name (Required)
            </label>
            <input
              className="neo-input"
              name="name"
              placeholder="e.g. Ohio Tech Inc."
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 px-1" htmlFor="website_url">
              Website URL (Optional)
            </label>
            <input
              className="neo-input"
              type="url"
              name="website_url"
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            type="submit"
            className="w-full bg-[var(--color-brand-peach)] hover:bg-[var(--color-brand-gold)] text-[var(--color-brand-dark)] font-black uppercase tracking-[0.15em] py-4 rounded-xl transition-all duration-500 shadow-xl shadow-[var(--color-brand-peach)]/20 text-xs"
          >
            Create Business
          </button>
        </div>
      </form>
    </div>
  )
}
