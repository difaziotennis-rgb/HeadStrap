export type Club = {
  id: string
  name: string
  slug: string | null
  created_at: string
  updated_at: string
}

export type Player = {
  id: string
  name: string
  email: string | null
  position: number // Manual rank/position set by admin
  phone_number: string | null
  club_id: string
  created_at: string
  updated_at: string
}

export type Match = {
  id: string
  winner_id: string
  loser_id: string
  score: string // e.g., "6-4, 6-2"
  date_played: string
  club_id: string
  created_at: string
  updated_at: string
}

export type MatchWithPlayers = Match & {
  winner: Player
  loser: Player
}

export type LadderEntry = Player & {
  rank: number
  previous_rank: number | null
}
