'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trophy } from 'lucide-react'
import { Player } from '@/lib/types/database'
import { useRouter } from 'next/navigation'

export function ReportMatchModal({ clubId }: { clubId: string | null }) {
  const [open, setOpen] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    winner_id: '',
    loser_id: '',
    score: '',
    date_played: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (open && clubId) {
      fetchPlayers()
    }
  }, [open, clubId])

  const fetchPlayers = async () => {
    if (!clubId) return
    
    try {
      const response = await fetch(`/api/players?club_id=${clubId}`)
      const data = await response.json()
      setPlayers(data)
    } catch (error) {
      console.error('Failed to fetch players:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!clubId) {
      alert('Please select a club first')
      return
    }

    if (!formData.winner_id || !formData.loser_id || !formData.score) {
      alert('Please fill in all fields')
      return
    }

    if (formData.winner_id === formData.loser_id) {
      alert('Winner and loser must be different players')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          club_id: clubId,
          date_played: new Date(formData.date_played).toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to report match')
      }

      // Success - close modal and refresh
      setOpen(false)
      setFormData({
        winner_id: '',
        loser_id: '',
        score: '',
        date_played: new Date().toISOString().split('T')[0],
      })
      router.refresh()
      // Show success message
      alert('Match reported successfully! Rankings have been updated.')
    } catch (error: any) {
      alert(error.message || 'Failed to report match')
    } finally {
      setSubmitting(false)
    }
  }

  if (!clubId) {
    return (
      <Button disabled className="w-full sm:w-auto" size="lg">
        <Trophy className="w-4 h-4 mr-2" />
        Report Match (Select club first)
      </Button>
    )
  }

  const availableLosers = players.filter(p => p.id !== formData.winner_id)
  const availableWinners = players.filter(p => p.id !== formData.loser_id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto" size="lg">
          <Trophy className="w-4 h-4 mr-2" />
          Report Match
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report a Match</DialogTitle>
          <DialogDescription>
            Report the result of a completed match. Rankings will be updated automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="winner">Winner *</Label>
            <Select
              value={formData.winner_id}
              onValueChange={(value) => setFormData({ ...formData, winner_id: value })}
            >
              <SelectTrigger id="winner">
                <SelectValue placeholder="Select winner" />
              </SelectTrigger>
              <SelectContent>
                {availableWinners.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loser">Loser *</Label>
            <Select
              value={formData.loser_id}
              onValueChange={(value) => setFormData({ ...formData, loser_id: value })}
            >
              <SelectTrigger id="loser">
                <SelectValue placeholder="Select loser" />
              </SelectTrigger>
              <SelectContent>
                {availableLosers.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="score">Score *</Label>
            <Input
              id="score"
              placeholder="e.g., 6-4, 6-2"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Format: Set scores separated by commas (e.g., "6-4, 6-2" or "6-3, 4-6, 6-1")
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date Played *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date_played}
              onChange={(e) => setFormData({ ...formData, date_played: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Report Match'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
