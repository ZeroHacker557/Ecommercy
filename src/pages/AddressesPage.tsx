import { useState, useEffect } from 'react'
import { ChevronLeft, MapPin, Plus, Trash2 } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import type { UserProfile, Address, AppPage } from '../types/domain'
import { updateUserProfile } from '../lib/firebase'
import { getTelegramUser, hapticFeedback, hapticSuccess } from '../utils/telegram'

type Props = {
  profile: UserProfile | null
  onNavigate: (page: AppPage) => void
  onNotify: (msg: string) => void
}

function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([center.lat, center.lng], map.getZoom())
  }, [center, map])
  return null
}

export function AddressesPage({ profile, onNavigate, onNotify }: Props) {
  const tgUser = getTelegramUser()
  const addresses = profile?.addresses || []
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const [newName, setNewName] = useState('')
  const [newFullAddress, setNewFullAddress] = useState('')
  const [mapCenter, setMapCenter] = useState({ lat: 41.2995, lng: 69.2401 })
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  function MapEvents() {
    useMapEvents({
      click(e) {
        setLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
        hapticFeedback('light')
      }
    })
    return null
  }

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setMapCenter(coords)
          setLocation(coords)
          hapticFeedback('medium')
        },
        () => alert("Lokatsiyani aniqlab bo'lmadi")
      )
    }
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newFullAddress || !location) {
      onNotify("Iltimos, barcha maydonlarni to'ldiring va xaritadan joy tanlang")
      return
    }

    if (!tgUser) return

    setLoading(true)
    const newAddress: Address = {
      id: Date.now().toString(),
      name: newName,
      address: newFullAddress,
      location: location
    }

    const updatedAddresses = [...addresses, newAddress]
    await updateUserProfile(tgUser.id, { addresses: updatedAddresses })
    setLoading(false)
    setIsAdding(false)
    setNewName('')
    setNewFullAddress('')
    setLocation(null)
    hapticSuccess()
    onNotify("Manzil saqlandi!")
  }

  const handleDeleteAddress = async (id: string) => {
    if (!tgUser) return
    const updatedAddresses = addresses.filter(a => a.id !== id)
    await updateUserProfile(tgUser.id, { addresses: updatedAddresses })
    hapticFeedback('light')
    onNotify("Manzil o'chirildi")
  }

  return (
    <>
      <header className="flex items-center gap-3 px-5 pt-8 sm:px-10">
        <button
          onClick={() => {
            if (isAdding) setIsAdding(false)
            else onNavigate('profile')
          }}
          className="grid size-11 place-items-center rounded-2xl transition hover:bg-violet-50 active:scale-90"
          style={{ color: '#111426' }}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-extrabold" style={{ color: '#111426' }}>
          {isAdding ? "Yangi manzil" : "Mening manzillarim"}
        </h1>
      </header>

      {isAdding ? (
        <form onSubmit={handleSaveAddress} className="px-5 pt-6 pb-32 sm:px-10 page-animate">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-extrabold uppercase tracking-wider text-slate-500">Manzil nomi *</label>
              <input 
                type="text" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 p-4 font-bold text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-purple-500 focus:bg-white focus:shadow-md focus:ring-4 focus:ring-purple-500/10"
                placeholder="Masalan: Uy, Ishxona"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-extrabold uppercase tracking-wider text-slate-500">To'liq manzil *</label>
              <input 
                type="text" 
                value={newFullAddress} 
                onChange={e => setNewFullAddress(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 p-4 font-bold text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-purple-500 focus:bg-white focus:shadow-md focus:ring-4 focus:ring-purple-500/10"
                placeholder="Ko'cha, uy raqami, mo'ljal"
                required
              />
            </div>
            
            <div>
              <label className="mb-1.5 block text-[13px] font-extrabold uppercase tracking-wider text-slate-500">Xaritadan tanlang *</label>
              <div className="relative mt-2 h-[280px] w-full overflow-hidden rounded-2xl border border-slate-200">
                <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={12} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                  <MapUpdater center={mapCenter} />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  {location && <Marker position={location} />}
                  <MapEvents />
                </MapContainer>
                
                <button 
                  type="button"
                  onClick={handleCurrentLocation}
                  className="absolute bottom-4 right-4 z-[400] grid size-12 place-items-center rounded-xl bg-white shadow-md transition hover:scale-105 active:scale-95"
                  style={{ color: '#7c3aed' }}
                >
                  <MapPin size={24} />
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400 text-center">Xarita ustiga bosib manzilni belgilang</p>
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
      ) : (
        <div className="px-5 pt-6 pb-32 sm:px-10 page-animate">
          {addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="grid size-16 place-items-center rounded-full bg-slate-100 mb-4 text-slate-400">
                <MapPin size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Manzillar yo'q</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-[200px]">Siz hali yetkazib berish manzilini qo'shmagansiz</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map(addr => (
                <div key={addr.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-purple-50 text-purple-600">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-slate-800">{addr.name}</h4>
                    <p className="truncate text-xs font-medium text-slate-500 mt-0.5">{addr.address}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setIsAdding(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50 py-4 font-bold text-purple-600 transition hover:bg-purple-50"
          >
            <Plus size={20} />
            Yangi manzil qo'shish
          </button>
        </div>
      )}
    </>
  )
}
