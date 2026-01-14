'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Player not found</p>
          <Button onClick={() => router.push('/club/rhinebeck-tennis-club')}>Back to Leaderboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={async () => {
              if (player.club_id) {
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
            }}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leaderboard
          </Button>

          {/* Player Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-6">
                <Avatar className="w-36 h-36">
                  <AvatarImage src={player.profile_picture_url || undefined} alt={player.name} />
                  <AvatarFallback className="text-4xl bg-green-100 text-green-700">
                    {player.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-3xl">{player.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {player.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span className="text-lg">{player.email}</span>
                  </div>
                )}
                {player.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span className="text-lg">{player.phone_number}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Home Link */}
          <HomeLink />
        </div>
      </div>
    </div>
  )
}

