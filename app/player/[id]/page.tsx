'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Mail } from 'lucide-react'
import { HomeLink } from '@/components/home-link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

type PlayerData = {
  id: string
  name: string
  email: string | null
  position: number
  phone_number: string | null
  profile_picture_url: string | null
  club_id: string
}

export default function PlayerProfile() {
  const params = useParams()
  const router = useRouter()
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchPlayerData(params.id as string)
    }
  }, [params.id])

  const fetchPlayerData = async (id: string) => {
    try {
      const response = await fetch(`/api/players/${id}`)
      const data = await response.json()
      setPlayer(data.player || data)
    } catch (error) {
      console.error('Failed to fetch player:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateBack = async () => {
    if (player?.club_id) {
      try {
        const res = await fetch(`/api/clubs?id=${player.club_id}`)
        if (!res.ok) {
          router.push('/club/rhinebeck-tennis-club')
          return
        }
        const club = await res.json()
        if (club) {
          const { createSlug } = await import('@/lib/utils/slug')
          const slug = club.slug || createSlug(club.name)
          router.push(`/club/${slug}`)
        } else {
          router.push('/club/rhinebeck-tennis-club')
        }
      } catch {
        router.push('/club/rhinebeck-tennis-club')
      }
    } else {
      router.push('/club/rhinebeck-tennis-club')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <div className="text-[13px] text-[#7a756d]">Loading...</div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[13px] text-[#7a756d] mb-4">Player not found</p>
          <button
            onClick={() => router.push('/club/rhinebeck-tennis-club')}
            className="px-4 py-2 bg-[#1a1a1a] text-white text-[13px] font-medium rounded-lg hover:bg-[#333] transition-colors"
          >
            Back to Leaderboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Header */}
      <header className="bg-[#faf9f7] border-b border-[#e8e5df] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f]">DiFazio Tennis</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Back Button */}
        <button
          onClick={navigateBack}
          className="flex items-center gap-2 text-[12px] text-[#7a756d] hover:text-[#1a1a1a] transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Leaderboard
        </button>

        {/* Player Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] overflow-hidden">
          <div className="px-6 sm:px-8 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="w-28 h-28 sm:w-32 sm:h-32">
                <AvatarImage src={player.profile_picture_url || undefined} alt={player.name} />
                <AvatarFallback className="text-3xl bg-[#f0ede8] text-[#6b665e] font-light">
                  {player.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1a1a1a] mb-4">
                  {player.name}
                </h1>
                <div className="space-y-2.5">
                  {player.email && (
                    <div className="flex items-center justify-center sm:justify-start gap-2.5">
                      <Mail className="w-4 h-4 text-[#b0a99f]" />
                      <a href={`mailto:${player.email}`} className="text-[14px] text-[#1a1a1a] hover:underline">
                        {player.email}
                      </a>
                    </div>
                  )}
                  {player.phone_number && (
                    <div className="flex items-center justify-center sm:justify-start gap-2.5">
                      <Phone className="w-4 h-4 text-[#b0a99f]" />
                      <a href={`tel:${player.phone_number}`} className="text-[14px] text-[#1a1a1a] hover:underline">
                        {player.phone_number}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Home Link */}
        <HomeLink />
      </main>
    </div>
  )
}
