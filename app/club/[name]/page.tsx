'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Leaderboard } from '@/components/leaderboard'
import { Club } from '@/lib/types/database'
import { Settings, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HomeLink } from '@/components/home-link'
import { ClubAdminLoginModal } from '@/components/club-admin-login-modal'

export default function ClubPage() {
  const params = useParams()
  const router = useRouter()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)

  const clubSlug = params.name as string

  useEffect(() => {
    fetchClub()
  }, [clubSlug])

  const fetchClub = async () => {
    try {
      // Normalize slug to lowercase for case-insensitive lookup
      const normalizedSlug = clubSlug.toLowerCase()
      const response = await fetch(`/api/clubs/${normalizedSlug}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/club-not-found')
          return
        }
        throw new Error('Failed to fetch club')
      }
      const data = await response.json()
      setClub(data)
      
      // Redirect to correct case if needed
      if (data.slug && data.slug !== clubSlug) {
        router.replace(`/club/${data.slug}`)
      }
    } catch (error) {
      console.error('Failed to fetch club:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading club...</div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Club not found</p>
          <Button onClick={() => router.push('/ladder')}>Go Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
              {club.name}
            </h1>
            <p className="text-lg text-gray-600">
              Tennis Ladder
            </p>
          </div>

          {/* Admin Link - Mobile Friendly */}
          <div className="mb-6 flex justify-center sm:justify-end">
            <ClubAdminLoginModal clubId={club.id} clubSlug={clubSlug} />
          </div>

          {/* Leaderboard */}
          <Leaderboard clubId={club.id} />

          {/* Home Link */}
          <HomeLink />

          {/* Match Results Email Link - Only for Rhinebeck Tennis Club */}
          {club.name.toLowerCase().includes('rhinebeck') && (
            <div className="mt-8 pt-8 border-t flex justify-center">
              <a
                href="mailto:difaziotennis@gmail.com?subject=Match Results"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send match results to difaziotennis@gmail.com
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

