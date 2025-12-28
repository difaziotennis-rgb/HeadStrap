'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
    <Button
      onClick={handleLogout}
      variant="outline"
      className="w-full sm:w-auto"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Logout
    </Button>
  )
}

