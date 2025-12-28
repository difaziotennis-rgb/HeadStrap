import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createSlug } from '@/lib/utils/slug'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    
    // Convert slug to lowercase for case-insensitive lookup
    const normalizedSlug = slug.toLowerCase()
    
    // Get all clubs
    const { data: clubs, error: fetchError } = await supabase
      .from('clubs')
      .select('*')

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch clubs' },
        { status: 500 }
      )
    }

    if (!clubs || clubs.length === 0) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }

    // Find club by slug or by name (generate slug from name)
    const club = clubs.find((c: any) => {
      const clubSlug = c.slug || createSlug(c.name)
      return clubSlug.toLowerCase() === normalizedSlug
    })

    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }

    // Ensure slug is set (for future use)
    if (!club.slug) {
      club.slug = createSlug(club.name)
    }

    return NextResponse.json(club)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch club' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    // Verify site admin authentication
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('site_admin_session')?.value

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Unauthorized. Only site administrators can delete clubs.' },
        { status: 401 }
      )
    }

    // Verify session exists in database
    const { data: admin } = await supabase
      .from('site_admin')
      .select('id')
      .eq('id', sessionId)
      .single()

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Only site administrators can delete clubs.' },
        { status: 401 }
      )
    }

    // Find club by slug
    const normalizedSlug = slug.toLowerCase()
    const { data: clubs, error: fetchError } = await supabase
      .from('clubs')
      .select('*')

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch clubs' },
        { status: 500 }
      )
    }

    const club = clubs?.find((c: any) => {
      const clubSlug = c.slug || createSlug(c.name)
      return clubSlug.toLowerCase() === normalizedSlug
    })

    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }

    // Delete club (players and matches will be cascade deleted due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('clubs')
      .delete()
      .eq('id', club.id)

    if (deleteError) {
      console.error('Error deleting club:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete club' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: `Club "${club.name}" has been deleted` })
  } catch (error: any) {
    console.error('Failed to delete club:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete club' },
      { status: 500 }
    )
  }
}

