'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function SiteAdminLogout({ onLogout }: { onLogout: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/site-admin/logout', {
        method: 'POST',
      })

      if (response.ok) {
        onLogout()
        router.push('/ladder')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      disabled={loading}
      className="w-full sm:w-auto"
    >
      <LogOut className="w-4 h-4 mr-2" />
      {loading ? 'Logging out...' : 'Logout'}
    </Button>
  )
}

