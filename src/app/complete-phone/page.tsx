import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CompletePhonePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  async function save(formData: FormData) {
    'use server'
    const phone = formData.get('phone') as string
    const supabase = await createClient()
    await supabase.from('users').update({ phone }).eq('id', user!.id)
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form action={save} className="bg-white p-8 rounded-xl shadow space-y-6 w-80">
        <h1 className="text-xl font-semibold text-center">Ajoute ton numéro</h1>
        <input
          name="phone"
          type="tel"
          required
          pattern="[0-9]{10}"
          className="w-full border rounded px-3 py-2"
          placeholder="0612345678"
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded">Enregistrer</button>
      </form>
    </div>
  )
}
