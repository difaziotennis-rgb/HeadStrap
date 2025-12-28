'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Users, AlertTriangle, GripVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Player } from '@/lib/types/database'

export function ClubAdminPanel({ clubId, clubSlug }: { clubId: string; clubSlug: string }) {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/players?club_id=${clubId}`)
      const data = await response.json()
      
      // Check if response has an error
      if (!response.ok || data.error) {
        console.error('Players API error:', data.error || 'Unknown error')
        setPlayers([])
        return
      }
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        // Sort by position
        const sorted = data.sort((a: Player, b: Player) => (a.position || 999) - (b.position || 999))
        setPlayers(sorted)
      } else {
        console.error('Invalid players data:', data)
        setPlayers([])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [clubId])

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
    // Make the drag image semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null)
    setDragOverIndex(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(null)
    
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    
    if (isNaN(dragIndex) || dragIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const newPlayers = [...players]
    const draggedPlayer = newPlayers[dragIndex]
    newPlayers.splice(dragIndex, 1)
    newPlayers.splice(dropIndex, 0, draggedPlayer)

    // Update positions
    const updatedPositions = newPlayers.map((player, index) => ({
      id: player.id,
      position: index + 1,
    }))

    try {
      const response = await fetch('/api/players/positions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_id: clubId,
          positions: updatedPositions,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update positions')
      }

      // Update local state with new positions
      const updatedPlayers = newPlayers.map((player, index) => ({
        ...player,
        position: index + 1,
      }))
      setPlayers(updatedPlayers)
      setDraggedIndex(null)
      router.refresh()
    } catch (error: any) {
      console.error('Failed to update positions:', error)
      alert(error.message || 'Failed to update player positions. Please try again.')
      fetchData() // Revert by refetching
      setDraggedIndex(null)
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDeletePlayer = async () => {
    if (!deletingPlayer) return

    try {
      const response = await fetch(`/api/players/${deletingPlayer.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete player')
      }

      setDeletingPlayer(null)
      fetchData()
      router.refresh()
    } catch (error) {
      console.error('Failed to delete player:', error)
      alert('Failed to delete player. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Players Management */}
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Players Management</CardTitle>
                <CardDescription>
                  Manage your club's players. Drag and drop to reorder the ladder based on match results.
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddPlayer(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading players...</div>
            ) : players.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No players yet. Add your first player!
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop players to reorder the ladder. Position #1 is the top of the ladder.
                </p>
                <div className="rounded-md border divide-y">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`flex items-center gap-4 p-4 hover:bg-muted/50 cursor-move transition-colors ${
                        draggedIndex === index ? 'opacity-50' : ''
                      } ${
                        dragOverIndex === index && draggedIndex !== index ? 'bg-primary/10 border-2 border-primary' : ''
                      }`}
                    >
                      <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <div className="font-medium">#{player.position || index + 1} {player.name}</div>
                        <div className="text-sm text-muted-foreground">{player.email || '-'}</div>
                        <div className="text-sm text-muted-foreground text-center sm:text-left">
                          {player.phone_number || '-'}
                        </div>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingPlayer(player)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingPlayer(player)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Add Player Dialog */}
      {showAddPlayer && (
        <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Player</DialogTitle>
              <DialogDescription>
                Add a new player to your club. They will be added to the bottom of the ladder.
              </DialogDescription>
            </DialogHeader>
            <AddPlayerForm
              clubId={clubId}
              onSuccess={() => {
                setShowAddPlayer(false)
                fetchData()
                router.refresh()
              }}
              onCancel={() => setShowAddPlayer(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Player Dialog */}
      {editingPlayer && (
        <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
              <DialogDescription>
                Update player information.
              </DialogDescription>
            </DialogHeader>
            <EditPlayerForm
              player={editingPlayer}
              clubId={clubId}
              onSuccess={() => {
                setEditingPlayer(null)
                fetchData()
                router.refresh()
              }}
              onCancel={() => setEditingPlayer(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Player Confirmation */}
      {deletingPlayer && (
        <Dialog open={!!deletingPlayer} onOpenChange={() => setDeletingPlayer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Delete Player
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{deletingPlayer.name}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setDeletingPlayer(null)} className="flex-1">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeletePlayer} className="flex-1">
                Delete Player
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}

function AddPlayerForm({ clubId, onSuccess, onCancel }: { clubId: string; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!formData.name.trim()) {
      setError('Name is required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          club_id: clubId,
          phone_number: formData.phone_number.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add player')
      }

      setFormData({ name: '', email: '', phone_number: '' })
      onSuccess()
    } catch (error: any) {
      setError(error.message || 'Failed to add player')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="John Doe"
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="john@example.com (optional)"
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone Number (Optional)</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Adding...' : 'Add Player'}
        </Button>
      </div>
    </form>
  )
}

function EditPlayerForm({ player, clubId, onSuccess, onCancel }: { player: Player; clubId: string; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: player.name,
    email: player.email || '',
    phone_number: player.phone_number || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!formData.name.trim()) {
      setError('Name is required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/players/${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone_number: formData.phone_number.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update player')
      }

      onSuccess()
    } catch (error: any) {
      setError(error.message || 'Failed to update player')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="edit-name">Name *</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="edit-email">Email (Optional)</Label>
        <Input
          id="edit-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="john@example.com (optional)"
        />
      </div>

      <div>
        <Label htmlFor="edit-phone">Phone Number (Optional)</Label>
        <Input
          id="edit-phone"
          type="tel"
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}

