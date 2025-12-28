import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get('club_id')
    
    if (!clubId) {
      return NextResponse.json(
        { error: 'club_id is required' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('club_id', clubId)

    if (error) throw error

    // Sort by position, with nulls last
    const sorted = (data || []).sort((a, b) => {
      const posA = a.position ?? 999
      const posB = b.position ?? 999
      return posA - posB
    })

    // Add rank numbers based on position
    const ladder = sorted.map((player, index) => ({
      ...player,
      rank: player.position ?? index + 1, // Use position as rank, or index if no position
    }))

    return NextResponse.json(ladder)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch ladder' },
      { status: 500 }
    )
  }
}
