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
      .from('matches')
      .select(`
        *,
        winner:players!matches_winner_id_fkey(*),
        loser:players!matches_loser_id_fkey(*)
      `)
      .eq('club_id', clubId)
      .order('date_played', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.club_id) {
      return NextResponse.json(
        { error: 'club_id is required' },
        { status: 400 }
      )
    }

    // Verify players exist and belong to the same club
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .in('id', [body.winner_id, body.loser_id])
      .eq('club_id', body.club_id)

    if (playersError) throw playersError

    if (!players || players.length !== 2) {
      return NextResponse.json(
        { error: 'Winner and loser must belong to the same club' },
        { status: 400 }
      )
    }

    // Create match (no automatic ranking updates - admin will adjust manually)
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert([{
        winner_id: body.winner_id,
        loser_id: body.loser_id,
        score: body.score,
        date_played: body.date_played || new Date().toISOString(),
        club_id: body.club_id,
      }])
      .select()
      .single()

    if (matchError) throw matchError

    // Fetch updated match with player data
    const { data: updatedMatch, error: fetchError } = await supabase
      .from('matches')
      .select(`
        *,
        winner:players!matches_winner_id_fkey(*),
        loser:players!matches_loser_id_fkey(*)
      `)
      .eq('id', match.id)
      .single()

    if (fetchError) throw fetchError

    return NextResponse.json(updatedMatch)
  } catch (error: any) {
    console.error('Match creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create match' },
      { status: 500 }
    )
  }
}
