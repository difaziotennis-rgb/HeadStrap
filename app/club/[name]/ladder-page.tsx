'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Leaderboard } from '@/components/leaderboard'
import { Club } from '@/lib/types/database'
import { Mail } from 'lucide-react'
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
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <div className="text-[13px] text-[#7a756d]">Loading club...</div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[13px] text-[#7a756d] mb-4">Club not found</p>
          <button
            onClick={() => router.push('/club/rhinebeck-tennis-club')}
            className="px-4 py-2 bg-[#1a1a1a] text-white text-[13px] font-medium rounded-lg hover:bg-[#333] transition-colors"
          >
            Go Home
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
        {/* Title Section */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1a1a1a] mb-2">
            {club.name}
          </h1>
          <p className="text-[11px] tracking-[0.15em] uppercase text-[#7a756d]">
            Tennis Ladder
          </p>
        </div>

        {/* Admin Link */}
        <div className="mb-6 flex justify-center sm:justify-end">
          <ClubAdminLoginModal clubId={club.id} clubSlug={clubSlug} />
        </div>

        {/* Leaderboard */}
        <Leaderboard clubId={club.id} />

        {/* Home Link */}
        <HomeLink />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8e5df] mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center space-y-3">
            {club.name.toLowerCase().includes('rhinebeck') && (
              <a
                href="mailto:difaziotennis@gmail.com?subject=Match Results"
                className="inline-flex items-center gap-2 text-[11px] text-[#7a756d] hover:text-[#1a1a1a] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Send match results to difaziotennis@gmail.com
              </a>
            )}
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#b0a99f]">
              DiFazio Tennis &middot; Rhinebeck, NY
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
