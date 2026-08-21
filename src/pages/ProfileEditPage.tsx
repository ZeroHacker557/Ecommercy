import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import type { UserProfile, AppPage } from '../types/domain'
import { updateUserProfile } from '../lib/firebase'
import { getTelegramUser, hapticFeedback, hapticSuccess } from '../utils/telegram'

type Props = {
  profile: UserProfile | null
  onNavigate: (page: AppPage) => void
  onNotify: (msg: string) => void
}

export function ProfileEditPage({ profile, onNavigate, onNotify }: Props) {
  const tgUser = getTelegramUser()
  const [firstName, setFirstName] = useState(profile?.first_name || tgUser?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || tgUser?.last_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !phone) {
      onNotify("Ism va telefon raqamini kiritish majburiy")
      return
    }

    if (!tgUser) {
      onNotify("Telegram foydalanuvchisi topilmadi")
      return
    }

    setLoading(true)
    await updateUserProfile(tgUser.id, {
      first_name: firstName,
      last_name: lastName,
      phone: phone
    })
    setLoading(false)
    hapticSuccess()
    onNotify("Ma'lumotlar muvaffaqiyatli saqlandi!")
    onNavigate('profile')
  }

  return (
    <>
      <header className="flex items-center gap-3 px-5 pt-8 sm:px-10">
        <button
          onClick={() => onNavigate('profile')}
          className="grid size-11 place-items-center rounded-2xl transition hover:bg-violet-50 active:scale-90"
          style={{ color: '#111426' }}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-extrabold" style={{ color: '#111426' }}>Shaxsiy ma'lumotlar</h1>
      </header>

      <form onSubmit={handleSave} className="px-5 pt-6 pb-32 sm:px-10 page-animate">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-extrabold uppercase tracking-wider text-slate-500">Ismingiz *</label>
            <input 
              type="text" 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 font-bold text-slate-800 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
              placeholder="Masalan: Alisher"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-extrabold uppercase tracking-wider text-slate-500">Familiyangiz</label>
            <input 
              type="text" 
              value={lastName} 
              onChange={e => setLastName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 font-bold text-slate-800 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
              placeholder="Masalan: Usmonov"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-extrabold uppercase tracking-wider text-slate-500">Telefon raqamingiz *</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 font-bold text-slate-800 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
              placeholder="+998 90 123 45 67"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-8 w-full py-4 text-[15px]"
        >
          {loading ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </form>
    </>
  )
}
