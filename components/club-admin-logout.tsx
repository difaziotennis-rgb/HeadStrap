'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function ClubAdminLogout({ clubId, clubSlug, onLogout }: { clubId: string; clubSlug: string; onLogout: () => void }) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/club-admin/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club_id: clubId }),
      })
      
      onLogout()
      router.push(`/club/${clubSlug}`)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#7a756d] hover:text-[#1a1a1a] border border-[#e8e5df] rounded-lg hover:border-[#c4bfb8] transition-all"
    >
      <LogOut className="w-3 h-3" />
      Logout
    </button>
  )
}
