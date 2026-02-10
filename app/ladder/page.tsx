'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Leaderboard } from '@/components/leaderboard'
import { Club } from '@/lib/types/database'
import { Mail, LogOut, Lock, Settings, Trophy } from 'lucide-react'

const CLUB_SLUG = 'rhinebeck-tennis-club'

export default function LadderPage() {
  const router = useRouter()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check admin auth (shared with /book page)
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('adminAuth')
      if (auth === 'true') {
        setIsAdmin(true)
      }
    }
    fetchClub()
  }, [])

  const fetchClub = async () => {
    try {
      const response = await fetch(`/api/clubs/${CLUB_SLUG}`)
      if (!response.ok) throw new Error('Failed to fetch club')
      const data = await response.json()
      setClub(data)
    } catch (error) {
      console.error('Failed to fetch club:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth')
    setIsAdmin(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <div className="text-[13px] text-[#7a756d]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Header - matches /book page */}
      <header className="bg-[#faf9f7] border-b border-[#e8e5df] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/book" className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f] hover:text-[#8a8477] transition-colors">DiFazio Tennis</Link>
            <div className="flex items-center gap-4">
              <Link
                href="/bio"
                className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                Bio
              </Link>
              <Link
                href="/book"
                className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                Book
              </Link>
              {isAdmin && (
                <>
                  <Link
                    href={`/club/${CLUB_SLUG}/ladder-admin`}
                    className="flex items-center gap-1.5 text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Manage Ladder
                  </Link>
                  <Link
                    href="/admin/payment-settings"
                    className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
                  >
                    Payments
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-[12px] text-[#8a8477] hover:text-[#1a1a1a] font-medium transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Title Section */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1a1a1a] mb-2">
            {club?.name || 'Rhinebeck Tennis Club'}
          </h1>
          <p className="text-[11px] tracking-[0.15em] uppercase text-[#7a756d]">
            Tennis Ladder
          </p>
        </div>

        {/* Leaderboard */}
        {club && <Leaderboard clubId={club.id} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8e5df] mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center space-y-3">
            <a
              href="mailto:difaziotennis@gmail.com?subject=Match Results"
              className="inline-flex items-center gap-2 text-[11px] text-[#7a756d] hover:text-[#1a1a1a] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Send match results to difaziotennis@gmail.com
            </a>
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#b0a99f]">
              DiFazio Tennis &middot; Rhinebeck, NY
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
