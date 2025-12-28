import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Get player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single()

    if (playerError) throw playerError

    return NextResponse.json(player)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Verify club admin authentication
    const { data: player } = await supabase
      .from('players')
      .select('club_id')
      .eq('id', id)
      .single()

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    // Check authentication (we'll verify in the component, but double-check here)
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const session = cookieStore.get(`club_admin_${player.club_id}`)?.value

    if (!session || session !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check email uniqueness if email is being updated
    if (body.email && body.email.trim()) {
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('club_id', player.club_id)
        .eq('email', body.email.trim().toLowerCase())
        .neq('id', id)
        .single()

      if (existingPlayer) {
        return NextResponse.json(
          { error: 'A player with this email already exists in this club' },
          { status: 400 }
        )
      }
    }

    // Normalize email if provided
    const updateData = { ...body }
    if (updateData.email !== undefined) {
      updateData.email = updateData.email?.trim() ? updateData.email.trim().toLowerCase() : null
    }

    // Update player
    const { data, error } = await supabase
      .from('players')
      .update(updateData)
      .eq('id', id)
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
    return NextResponse.json(
      { error: error.message || 'Failed to update player' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify club admin authentication
    const { data: player } = await supabase
      .from('players')
      .select('club_id')
      .eq('id', id)
      .single()

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    // Check authentication
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const session = cookieStore.get(`club_admin_${player.club_id}`)?.value

    if (!session || session !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete player (matches will be cascade deleted if configured)
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete player' },
      { status: 500 }
    )
  }
}
