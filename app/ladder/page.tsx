'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Building2, ArrowRight } from 'lucide-react'
import { createSlug } from '@/lib/utils/slug'
import { SiteAdminLoginModal } from '@/components/site-admin-login-modal'
import { SiteAdminLogout } from '@/components/site-admin-logout'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Club } from '@/lib/types/database'

export default function LadderPage() {
  const router = useRouter()
  const [clubName, setClubName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSiteAdmin, setIsSiteAdmin] = useState(false)
  const [clubs, setClubs] = useState<Club[]>([])
  const [selectedClubId, setSelectedClubId] = useState<string>('')

  useEffect(() => {
    checkSiteAdminStatus()
    fetchClubs()
  }, [])

  // Periodically check admin status to ensure session persists across page navigations
  useEffect(() => {
    const interval = setInterval(() => {
      checkSiteAdminStatus()
    }, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [])

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/clubs')
      const data = await response.json()
      setClubs(data)
    } catch (error) {
      console.error('Failed to fetch clubs:', error)
    }
  }

  const checkSiteAdminStatus = async () => {
    try {
      const response = await fetch('/api/auth/site-admin/check')
      const data = await response.json()
      setIsSiteAdmin(data.authenticated || false)
    } catch (error) {
      setIsSiteAdmin(false)
    }
  }

  const handleGoToClub = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // If a club is selected from dropdown, use that
    if (selectedClubId) {
      const selectedClub = clubs.find(c => c.id === selectedClubId)
      if (selectedClub) {
        const slug = selectedClub.slug || createSlug(selectedClub.name)
        router.push(`/club/${slug}`)
        setLoading(false)
        return
      }
    }

    if (!clubName.trim()) {
      setError('Please enter a club name or select from the dropdown')
      setLoading(false)
      return
    }

    try {
      // Try to find the club by name (case-insensitive)
      const normalizedInput = clubName.trim().toLowerCase()
      const foundClub = clubs.find((club: any) => 
        club.name.toLowerCase() === normalizedInput || 
        club.slug?.toLowerCase() === normalizedInput ||
        club.slug === createSlug(clubName.trim())
      )

      if (foundClub) {
        // Use the actual slug from the database
        const slug = foundClub.slug || createSlug(foundClub.name)
        router.push(`/club/${slug}`)
      } else {
        // Fallback: try with slug conversion
        const slug = createSlug(clubName.trim())
        router.push(`/club/${slug}`)
      }
    } catch (error) {
      // Fallback: try with slug conversion
      const slug = createSlug(clubName.trim())
      router.push(`/club/${slug}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClubSelect = (clubId: string) => {
    setSelectedClubId(clubId)
    const selectedClub = clubs.find(c => c.id === clubId)
    if (selectedClub) {
      setClubName(selectedClub.name)
      // Auto-navigate to selected club
      const slug = selectedClub.slug || createSlug(selectedClub.name)
      router.push(`/club/${slug}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Site Admin Banner - Always visible when logged in */}
          {isSiteAdmin && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Logged in as Site Admin
                  </span>
                </div>
                <Button
                  onClick={() => router.push('/admin')}
                  size="sm"
                  variant="default"
                >
                  Manage Clubs
                </Button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
              Tennis Ladder
            </h1>
            <p className="text-lg text-gray-600">
              Access your club's ladder or create a new one
            </p>
          </div>

          {/* Club Access Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Access Your Club
              </CardTitle>
              <CardDescription>
                Enter your club name to view the ladder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGoToClub} className="space-y-4">
                {/* Quick Select Dropdown */}
                {clubs.length > 0 && (
                  <div className="space-y-2">
                    <Label>Quick Select (All Clubs)</Label>
                    <Select
                      value={selectedClubId}
                      onValueChange={handleClubSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a club to go directly..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs.map((club) => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Or enter club name below
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="club-name">Club Name</Label>
                  <Input
                    id="club-name"
                    placeholder="e.g., Country Club Tennis"
                    value={clubName}
                    onChange={(e) => {
                      setClubName(e.target.value)
                      setSelectedClubId('') // Clear selection when typing
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the club name (case-insensitive)
                  </p>
                </div>
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Loading...' : (
                    <>
                      Go to Club
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Site Admin Section - Only show when logged in */}
          {isSiteAdmin && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Site Administration</CardTitle>
                  <CardDescription>
                    You are logged in as site admin. Manage clubs, add new ones, or delete existing clubs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => router.push('/admin')}
                    className="w-full"
                    size="lg"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Manage Clubs
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Site Admin Login/Logout at bottom */}
          <div className="mt-12 pt-8 border-t flex flex-col items-center gap-4">
            {isSiteAdmin ? (
              <SiteAdminLogout onLogout={checkSiteAdminStatus} />
            ) : (
              <SiteAdminLoginModal onLogin={checkSiteAdminStatus} />
            )}
            <p className="text-xs text-muted-foreground">You are already on the home page</p>
          </div>
        </div>
      </div>
    </div>
  )
}

