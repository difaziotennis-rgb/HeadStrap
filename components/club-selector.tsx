'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Club } from '@/lib/types/database'
import { Building2 } from 'lucide-react'

export function ClubSelector({ 
  selectedClubId, 
  onClubChange 
}: { 
  selectedClubId: string | null
  onClubChange: (clubId: string) => void 
}) {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/clubs')
      const data = await response.json()
      setClubs(data)
      
      // Auto-select first club if none selected
      if (!selectedClubId && data.length > 0) {
        onClubChange(data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch clubs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <span>Loading clubs...</span>
      </div>
    )
  }

  if (clubs.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No clubs available. Create one in the admin panel.
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-muted-foreground" />
      <Select
        value={selectedClubId || ''}
        onValueChange={onClubChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a club" />
        </SelectTrigger>
        <SelectContent>
          {clubs.map((club) => (
            <SelectItem key={club.id} value={club.id}>
              {club.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

