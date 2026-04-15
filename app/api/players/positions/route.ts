import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.club_id || !Array.isArray(body.positions)) {
      return NextResponse.json(
        { error: 'club_id and positions array are required' },
        { status: 400 }
      )
    }

    // Verify club admin authentication
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const session = cookieStore.get(`club_admin_${body.club_id}`)?.value

    if (!session || session !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update positions for all players
    // positions should be an array of { id: string, position: number }
    const updates = body.positions.map((p: { id: string; position: number }) => ({
      id: p.id,
      position: p.position,
    }))

    // Update each player's position
    for (const update of updates) {
      const { error } = await supabase
        .from('players')
        .update({ position: update.position })
        .eq('id', update.id)
        .eq('club_id', body.club_id)

      if (error) {
        // Check if it's a column not found error
        if (error.message?.includes('position') || error.message?.includes('column')) {
          throw new Error('The position column does not exist in the database. Please run the migration script: supabase-schema-add-position.sql')
        }
        throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update positions' },
      { status: 500 }
    )
  }
}

