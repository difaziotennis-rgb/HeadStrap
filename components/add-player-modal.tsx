'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus } from 'lucide-react'

export function AddPlayerModal({ clubId }: { clubId: string | null }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    club_name: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }

    if (!clubId) {
      setError('Please select a club first')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone_number: formData.phone_number.trim() || null,
          club_id: clubId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add player')
      }

      // Success - close modal and reset form
      setOpen(false)
      setFormData({ name: '', email: '', phone_number: '', club_name: '' })
      // Refresh the page to show new player
      window.location.reload()
    } catch (error: any) {
      setError(error.message || 'Failed to add player')
    } finally {
      setSubmitting(false)
    }
  }

  if (!clubId) {
    return (
      <Button disabled variant="outline">
        <UserPlus className="w-4 h-4 mr-2" />
        Add Player (Select club first)
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Player
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Join the Ladder</DialogTitle>
          <DialogDescription>
            Add yourself to the tennis ladder. You'll start with 1000 ranking points.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com (optional)"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setError(null)
                setFormData({ name: '', email: '', phone_number: '', club_name: '' })
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Player'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

