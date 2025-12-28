'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LadderEntry } from '@/lib/types/database'

export function Leaderboard({ clubId }: { clubId: string | null }) {
  const [ladder, setLadder] = useState<LadderEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clubId) {
      fetchLadder()
      // Refresh every 30 seconds
      const interval = setInterval(fetchLadder, 30000)
      return () => clearInterval(interval)
    } else {
      setLoading(false)
    }
  }, [clubId])

  const fetchLadder = async () => {
    if (!clubId) return
    
    try {
      const response = await fetch(`/api/ladder?club_id=${clubId}`)
      const data = await response.json()
      
      // Check if response has an error
      if (!response.ok || data.error) {
        console.error('Ladder API error:', data.error || 'Unknown error')
        setLadder([])
        return
      }
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setLadder(data)
      } else {
        console.error('Invalid ladder data:', data)
        setLadder([])
      }
    } catch (error) {
      console.error('Failed to fetch ladder:', error)
      setLadder([])
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600" />
    return null
  }

  const getRankChange = (entry: LadderEntry) => {
    if (entry.previous_rank === null) return null
    const change = entry.previous_rank - entry.rank
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  if (!clubId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Tennis Ladder Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Please select a club to view the leaderboard
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Tennis Ladder Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Tennis Ladder Standings</CardTitle>
        <p className="text-sm text-muted-foreground">Updated in real-time</p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16 text-center">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ladder.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No players yet. Be the first to join!
                  </TableCell>
                </TableRow>
              ) : (
                ladder.map((player, index) => (
                  <TableRow
                    key={player.id}
                    className={index < 3 ? 'bg-muted/30' : ''}
                  >
                    <TableCell className="text-center font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        {getRankIcon(player.rank)}
                        <span>{player.rank}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/player/${player.id}`}
                        className="flex flex-col text-left hover:text-primary transition-colors"
                      >
                        <span className="font-medium">{player.name}</span>
                        {player.email && (
                          <span className="text-xs text-muted-foreground">{player.email}</span>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {getRankChange(player)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
