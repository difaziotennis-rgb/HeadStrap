'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Building2, Trash2, AlertTriangle } from 'lucide-react'
import { Club } from '@/lib/types/database'

export function AdminPanel() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clubName, setClubName] = useState('')
  const [deletingClub, setDeletingClub] = useState<Club | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/clubs')
      const data = await response.json()
      setClubs(data)
    } catch (error) {
      console.error('Failed to fetch clubs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!clubName.trim()) {
      setError('Club name is required')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: clubName.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create club')
      }

      // Success - redirect to the new club's page
      const { createSlug } = await import('@/lib/utils/slug')
      const slug = createSlug(data.name)
      window.location.href = `/club/${slug}`
    } catch (error: any) {
      setError(error.message || 'Failed to create club')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClub = async () => {
    if (!deletingClub) return

    setDeleting(true)
    setError(null)

    try {
      // Use slug for deletion endpoint
      const { createSlug } = await import('@/lib/utils/slug')
      const slug = deletingClub.slug || createSlug(deletingClub.name)
      const response = await fetch(`/api/clubs/${slug}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete club')
      }

      // Remove club from list
      setClubs(clubs.filter(c => c.id !== deletingClub.id))
      setDeletingClub(null)
    } catch (error: any) {
      setError(error.message || 'Failed to delete club')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Club Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Site Admin Only:</strong> Only site administrators can create new clubs.
          </p>
        </div>
        {!showForm ? (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Club
          </Button>
        ) : (
          <form onSubmit={handleCreateClub} className="space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="club-name">Club Name *</Label>
              <Input
                id="club-name"
                placeholder="e.g., Country Club Tennis"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setClubName('')
                  setError(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Club'}
              </Button>
            </div>
          </form>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-4">All Clubs ({clubs.length})</h3>
          {clubs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No clubs yet. Create your first club above.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Club Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clubs.map((club) => (
                    <TableRow key={club.id}>
                      <TableCell className="font-medium">{club.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(club.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingClub(club)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>

      {/* Delete Club Confirmation Dialog */}
      {deletingClub && (
        <Dialog open={!!deletingClub} onOpenChange={() => setDeletingClub(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Delete Club
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{deletingClub.name}</strong>? 
                <br />
                <br />
                This will permanently delete:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>The club and all its data</li>
                  <li>All players in this club</li>
                  <li>All matches for this club</li>
                </ul>
                <br />
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDeletingClub(null)
                  setError(null)
                }} 
                className="flex-1"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteClub} 
                className="flex-1"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Club'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}

