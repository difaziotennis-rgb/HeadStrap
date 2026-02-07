'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LadderEntry } from '@/lib/types/database'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

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
    if (rank === 1) return <Trophy className="w-5 h-5 text-[#c5a44e]" />
    if (rank === 2) return <Trophy className="w-5 h-5 text-[#9a9a9a]" />
    if (rank === 3) return <Trophy className="w-5 h-5 text-[#b08d57]" />
    return null
  }

  const getRankChange = (entry: LadderEntry) => {
    if (entry.previous_rank === null) return null
    const change = entry.previous_rank - entry.rank
    if (change > 0) return <TrendingUp className="w-4 h-4 text-[#5a8a5a]" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-[#b05454]" />
    return <Minus className="w-4 h-4 text-[#b0a99f]" />
  }

  if (!clubId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e8e5df]">
          <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">Standings</h2>
        </div>
        <div className="text-center py-8 text-[13px] text-[#7a756d]">
          Please select a club to view the leaderboard
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e8e5df]">
          <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">Standings</h2>
        </div>
        <div className="text-center py-8 text-[13px] text-[#7a756d]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#e8e5df]">
        <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">Standings</h2>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[60px_1fr_48px] items-center px-6 py-3 bg-[#faf9f7] border-b border-[#e8e5df]">
        <span className="text-[10px] tracking-[0.1em] uppercase text-[#b0a99f] font-medium text-center">Rank</span>
        <span className="text-[10px] tracking-[0.1em] uppercase text-[#b0a99f] font-medium">Player</span>
        <span></span>
      </div>

      {/* Table Body */}
      {ladder.length === 0 ? (
        <div className="text-center py-8 text-[13px] text-[#7a756d]">
          No players yet. Be the first to join!
        </div>
      ) : (
        <div>
          {ladder.map((player, index) => (
            <div
              key={player.id}
              className={`grid grid-cols-[60px_1fr_48px] items-center px-6 py-3.5 border-b border-[#f0ede8] last:border-b-0 transition-colors hover:bg-[#faf9f7] ${
                index < 3 ? 'bg-[#fdfcfb]' : ''
              }`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center gap-1.5">
                {getRankIcon(player.rank)}
                <span className="text-[14px] font-semibold text-[#1a1a1a]">{player.rank}</span>
              </div>

              {/* Player */}
              <Link
                href={`/player/${player.id}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={player.profile_picture_url || undefined} alt={player.name} />
                  <AvatarFallback className="bg-[#f0ede8] text-[#6b665e] text-[12px] font-medium">
                    {player.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-[#1a1a1a]">{player.name}</span>
                  {player.email && (
                    <span className="text-[11px] text-[#b0a99f]">{player.email}</span>
                  )}
                </div>
              </Link>

              {/* Rank Change */}
              <div className="flex justify-center">
                {getRankChange(player)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
