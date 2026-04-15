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

    // Sort by position if it exists, otherwise by created_at
    const sorted = (data || []).sort((a: any, b: any) => {
      if (a.position != null && b.position != null) {
        return a.position - b.position
      }
      if (a.position != null) return -1
      if (b.position != null) return 1
      // If neither has position, sort by created_at
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    return NextResponse.json(sorted || [])
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.name || !body.club_id) {
      return NextResponse.json(
        { error: 'Name and club_id are required' },
        { status: 400 }
      )
    }

    // Check if club exists
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('id', body.club_id)
      .single()

    if (clubError || !club) {
      return NextResponse.json(
        { error: 'Invalid club' },
        { status: 400 }
      )
    }

    // Check if email already exists for this club (only if email is provided)
    if (body.email && body.email.trim()) {
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('club_id', body.club_id)
        .eq('email', body.email.trim().toLowerCase())
        .single()

      if (existingPlayer) {
        return NextResponse.json(
          { error: 'A player with this email already exists in this club' },
          { status: 400 }
        )
      }
    }

    // Get the highest position for this club to assign new player to bottom
    const { data: existingPlayers } = await supabase
      .from('players')
      .select('position')
      .eq('club_id', body.club_id)
      .order('position', { ascending: false })
      .limit(1)

    const newPosition = existingPlayers && existingPlayers.length > 0 
      ? (existingPlayers[0].position || 0) + 1 
      : 1

    const { data, error } = await supabase
      .from('players')
      .insert([{
        name: body.name.trim(),
        email: body.email?.trim() ? body.email.trim().toLowerCase() : null,
        club_id: body.club_id,
        position: newPosition,
        phone_number: body.phone_number || null,
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A player with this email already exists in this club' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Player creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create player' },
      { status: 500 }
    )
  }
}
