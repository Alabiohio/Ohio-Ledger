import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { User, Building2, ShieldCheck, LogOut, Save, Palette } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!business) {
    redirect('/setup');
  }

  const initials = (profile?.name || user.email || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // --- Server Actions ---
  async function updateProfile(formData: FormData) {
    'use server';
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return;

    const name = formData.get('name') as string;

    await supabaseServer
      .from('users')
      .update({ name })
      .eq('id', user.id);

    revalidatePath('/profile');
  }

  async function updateBusiness(formData: FormData) {
    'use server';
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return;

    const name = formData.get('business_name') as string;
    const description = formData.get('description') as string;
    const website_url = formData.get('website_url') as string;

    const { data: biz } = await supabaseServer
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (biz) {
      await supabaseServer
        .from('businesses')
        .update({ name, description, website_url })
        .eq('id', biz.id);
    }

    revalidatePath('/profile');
  }

  async function signOut() {
    'use server';
    const supabaseServer = await createClient();
    await supabaseServer.auth.signOut();
    redirect('/login');
  }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="space-y-10 py-4 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">Profile & Settings</h1>
        <p className="text-[var(--color-brand-gray)] font-medium mt-1">Manage your personal and business details</p>
      </div>

      {/* Profile Hero Card */}
      <div className="neo-card rounded-[2rem] overflow-hidden shadow-xl">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-[var(--color-brand-ink)] via-[#1a1a2e] to-[var(--color-brand-ink)] relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-brand-peach)]/20 via-[var(--color-brand-gold)]/10 to-transparent" />
          <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-brand-peach)]/40 to-transparent" />
        </div>

        {/* Avatar & Info */}
        <div className="px-8 pb-8 -mt-14 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-[1.5rem] bg-gradient-to-br from-[var(--color-brand-peach)] to-[var(--color-brand-gold)] flex items-center justify-center text-3xl font-black text-[var(--color-brand-dark)] shadow-2xl shadow-[var(--color-brand-peach)]/30 border-4 border-[var(--surface)] shrink-0">
              {initials}
            </div>

            <div className="pb-1">
              <p className="text-2xl font-black tracking-tight text-[var(--foreground)]">
                {profile?.name || 'Set your name'}
              </p>
              <p className="text-sm text-[var(--color-brand-gray)] mt-0.5">{user.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-peach)] bg-[var(--color-brand-peach)]/10 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  {profile?.role || 'Admin'}
                </span>
                <span className="text-[10px] font-bold text-[var(--color-brand-gray)] uppercase tracking-wider">
                  Since {memberSince}
                </span>
              </div>
            </div>

            {/* Sign Out */}
            <div className="sm:ml-auto">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-[var(--border)] text-[var(--color-brand-gray)] hover:text-red-500 hover:border-red-200 hover:bg-red-50/50 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Info */}
        <div className="neo-card bg-white rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-7">
            <div className="p-3 bg-[var(--color-brand-peach)]/10 rounded-2xl">
              <User className="w-5 h-5 text-[var(--color-brand-peach)]" />
            </div>
            <div>
              <h2 className="font-black text-lg text-[var(--foreground)]">Personal Info</h2>
              <p className="text-xs text-[var(--color-brand-gray)] font-medium">Update your display name</p>
            </div>
          </div>

          <form action={updateProfile} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-brand-gray)] mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                defaultValue={profile?.name || ''}
                placeholder="e.g. John Adeyemi"
                className="neo-input"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-brand-gray)] mb-2">
                Email Address
              </label>
              <input
                type="email"
                defaultValue={user.email || ''}
                disabled
                className="neo-input opacity-50 cursor-not-allowed"
              />
              <p className="text-[10px] text-[var(--color-brand-gray)] mt-1.5 font-medium">
                Email is managed through authentication and cannot be changed here.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-brand-gray)] mb-2">
                Role
              </label>
              <input
                type="text"
                defaultValue={profile?.role || 'Admin'}
                disabled
                className="neo-input opacity-50 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[var(--foreground)] text-[var(--background)] font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl hover:bg-[var(--color-brand-peach)] hover:text-[var(--color-brand-dark)] transition-all shadow-lg shadow-black/10"
            >
              <Save className="w-4 h-4" />
              Save Profile
            </button>
          </form>
        </div>

        {/* Business Settings */}
        <div className="neo-card bg-white rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-7">
            <div className="p-3 bg-[var(--color-brand-gold)]/10 rounded-2xl">
              <Building2 className="w-5 h-5 text-[var(--color-brand-gold)]" />
            </div>
            <div>
              <h2 className="font-black text-lg text-[var(--foreground)]">Business Settings</h2>
              <p className="text-xs text-[var(--color-brand-gray)] font-medium">Configure your organisation details</p>
            </div>
          </div>

          <form action={updateBusiness} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-brand-gray)] mb-2">
                Business Name
              </label>
              <input
                type="text"
                name="business_name"
                defaultValue={business?.name || ''}
                placeholder="e.g. Adeyemi Enterprises"
                required
                className="neo-input"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-brand-gray)] mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                defaultValue={business?.description || ''}
                placeholder="A brief description of your business..."
                rows={4}
                className="neo-input resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-brand-gray)] mb-2">
                Website URL (Optional)
              </label>
              <input
                type="url"
                name="website_url"
                defaultValue={business?.website_url || ''}
                placeholder="https://yourwebsite.com"
                className="neo-input"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-brand-gray)] mb-2">
                Business ID
              </label>
              <input
                type="text"
                defaultValue={business?.id || '—'}
                disabled
                className="neo-input opacity-50 cursor-not-allowed text-[10px] font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[var(--foreground)] text-[var(--background)] font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl hover:bg-[var(--color-brand-gold)] hover:text-[var(--color-brand-dark)] transition-all shadow-lg shadow-black/10"
            >
              <Save className="w-4 h-4" />
              Save Business
            </button>
          </form>
        </div>
      </div>

      {/* Account Info Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Role', value: profile?.role || 'Admin', accent: 'var(--color-brand-peach)' },
          { label: 'Business', value: business?.name || 'Not set', accent: 'var(--color-brand-gold)' },
          { label: 'Member Since', value: memberSince, accent: 'var(--color-status-green)' },
          { label: 'Auth Provider', value: user.app_metadata?.provider || 'email', accent: 'var(--color-status-blue)' },
        ].map(item => (
          <div key={item.label} className="neo-card p-5 rounded-2xl shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-2" style={{ color: item.accent }}>
              {item.label}
            </p>
            <p className="text-sm font-bold text-[var(--foreground)] truncate capitalize">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Appearance */}
      <div className="neo-card bg-white rounded-[2rem] p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-brand-gray)]/10 rounded-2xl">
              <Palette className="w-5 h-5 text-[var(--color-brand-gray)]" />
            </div>
            <div>
              <h2 className="font-black text-lg text-[var(--foreground)]">Appearance</h2>
              <p className="text-xs text-[var(--color-brand-gray)] font-medium">Choose between light, dark, or system theme</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
