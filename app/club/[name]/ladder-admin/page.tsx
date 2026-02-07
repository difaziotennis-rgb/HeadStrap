'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Club } from '@/lib/types/database'
import { CalendarDays, Trophy, LogOut } from 'lucide-react'
import { ClubAdminPanel } from '@/components/club-admin-panel'

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
      const normalizedSlug = clubSlug.toLowerCase()
      const response = await fetch(`/api/clubs/${normalizedSlug}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/ladder')
          return
        }
        throw new Error('Failed to fetch club')
      }
      const data = await response.json()
      setClub(data)
      
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
    
    // First check shared admin auth (from /book login)
    if (typeof window !== 'undefined') {
      const siteAdmin = sessionStorage.getItem('adminAuth')
      if (siteAdmin === 'true') {
        setIsAuthenticated(true)
        setCheckingAuth(false)
        return
      }
    }

    // Fall back to club-specific cookie auth
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const response = await fetch(`/api/auth/club-admin/check?club_id=${club.id}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()
      setIsAuthenticated(data.authenticated || false)
      
      if (!data.authenticated) {
        router.push('/ladder')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/ladder')
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth')
    router.push('/ladder')
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
            onClick={() => router.push('/ladder')}
            className="px-4 py-2 bg-[#1a1a1a] text-white text-[13px] font-medium rounded-lg hover:bg-[#333] transition-colors"
          >
            Back to Ladder
          </button>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Header - matches /book and /ladder pages */}
      <header className="bg-[#faf9f7] border-b border-[#e8e5df] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f]">DiFazio Tennis</p>
            <div className="flex items-center gap-4">
              <Link
                href="/book"
                className="flex items-center gap-1.5 text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Calendar
              </Link>
              <Link
                href="/ladder"
                className="flex items-center gap-1.5 text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                <Trophy className="h-3.5 w-3.5" />
                Ladder
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-[12px] text-[#8a8477] hover:text-[#1a1a1a] font-medium transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1a1a1a] mb-1">
            {club.name}
          </h1>
          <p className="text-[11px] tracking-[0.15em] uppercase text-[#7a756d]">
            Ladder Administration
          </p>
        </div>

        <ClubAdminPanel clubId={club.id} clubSlug={clubSlug} />
      </main>
    </div>
  )
}
