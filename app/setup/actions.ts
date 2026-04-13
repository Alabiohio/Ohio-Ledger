"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createBusiness(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const website_url = formData.get('website_url') as string
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('businesses')
    .insert({
      user_id: user.id,
      name,
      website_url: website_url || null,
    })

  if (error) {
    console.error('Error creating business:', error)
    // Could eventually redirect back with an error or throw, but typically for now redirecting or doing nothing is fine
    // throwing an error might be caught by error.tsx
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
