'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Club } from '@/lib/types/database'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        router.replace(`/club/${data.slug}/admin`)
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
      const response = await fetch(`/api/auth/club-admin/check?club_id=${club.id}`)
      const data = await response.json()
      setIsAuthenticated(data.authenticated || false)
      
      if (!data.authenticated) {
        // Redirect to club page if not authenticated
        router.push(`/club/${clubSlug}`)
      }
    } catch (error) {
      router.push(`/club/${clubSlug}`)
    } finally {
      setCheckingAuth(false)
    }
  }

  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading...</div>
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

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push(`/club/${clubSlug}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {club.name} Ladder
          </Button>

          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {club.name} - Admin
                </h1>
                <p className="text-lg text-gray-600">
                  Manage your club's tennis ladder
                </p>
              </div>
              <ClubAdminLogout clubId={club.id} clubSlug={clubSlug} onLogout={checkAuth} />
            </div>
          </div>

          <ClubAdminPanel clubId={club.id} clubSlug={clubSlug} />

          {/* Home Link */}
          <HomeLink />
        </div>
      </div>
    </div>
  )
}

