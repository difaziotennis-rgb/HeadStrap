import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Verify club admin authentication
    const { data: match } = await supabase
      .from('matches')
      .select('club_id')
      .eq('id', id)
      .single()

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Check authentication
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const session = cookieStore.get(`club_admin_${match.club_id}`)?.value

    if (!session || session !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update match
    const { data, error } = await supabase
      .from('matches')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update match' },
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
    const { data: match } = await supabase
      .from('matches')
      .select('club_id')
      .eq('id', id)
      .single()

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Check authentication
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const session = cookieStore.get(`club_admin_${match.club_id}`)?.value

    if (!session || session !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete match
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete match' },
      { status: 500 }
    )
  }
}

