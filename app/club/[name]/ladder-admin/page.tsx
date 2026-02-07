'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Club } from '@/lib/types/database'
import { ArrowLeft } from 'lucide-react'
import { HomeLink } from '@/components/home-link'
import { ClubAdminPanel } from '@/components/club-admin-panel'
import { ClubAdminLogout } from '@/components/club-admin-logout'

export default function ClubAdminPage() {
  const params = useParams()
  const router = useRouter()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const clubSlug = params.name as string

  useEffect(() => {
    fetchClub()
  }, [clubSlug])

  useEffect(() => {
    if (club) {
      checkAuth()
    }
  }, [club])

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
        router.replace(`/club/${data.slug}/ladder-admin`)
      }
    } catch (error) {
      console.error('Failed to fetch club:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAuth = async () => {
    if (!club) return
    
    try {
      // Add a small delay to ensure cookies are available
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const response = await fetch(`/api/auth/club-admin/check?club_id=${club.id}`, {
        credentials: 'include', // Ensure cookies are sent
        cache: 'no-store', // Don't cache the auth check
      })
      const data = await response.json()
      setIsAuthenticated(data.authenticated || false)
      
      if (!data.authenticated) {
        // Redirect to club page if not authenticated
        router.push(`/club/${clubSlug}`)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push(`/club/${clubSlug}`)
    } finally {
      setCheckingAuth(false)
    }
  }

  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <div className="text-[13px] text-[#7a756d]">Loading...</div>
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

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Header */}
      <header className="bg-[#faf9f7] border-b border-[#e8e5df] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f]">DiFazio Tennis</p>
            <ClubAdminLogout clubId={club.id} clubSlug={clubSlug} onLogout={checkAuth} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/club/${clubSlug}`)}
          className="flex items-center gap-2 text-[12px] text-[#7a756d] hover:text-[#1a1a1a] transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {club.name} Ladder
        </button>

        {/* Title Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1a1a1a] mb-1">
                {club.name}
              </h1>
              <p className="text-[11px] tracking-[0.15em] uppercase text-[#7a756d]">
                Ladder Administration
              </p>
            </div>
          </div>
        </div>

        <ClubAdminPanel clubId={club.id} clubSlug={clubSlug} />

        {/* Home Link */}
        <HomeLink />
      </main>
    </div>
  )
}
