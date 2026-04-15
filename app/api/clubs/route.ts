import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get('id')
    
    if (clubId) {
      // Get single club by ID
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }
    
    // Get all clubs
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch clubs',
          details: error.message,
          code: error.code,
          env: {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
            urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
            keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || 'NOT SET',
          }
        },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Clubs API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch clubs',
        details: error.message,
        env: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
          urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
          keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || 'NOT SET',
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Club name is required' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const { createSlug } = await import('@/lib/utils/slug')
    const slug = createSlug(body.name.trim())

    // Check if slug already exists
    const { data: existingClub } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingClub) {
      return NextResponse.json(
        { error: 'A club with a similar name already exists. Please choose a different name.' },
        { status: 400 }
      )
    }

    // Set default admin password to "admin" (hash for "admin")
    // Using pre-computed hash to avoid async issues
    const defaultPasswordHash = '$2b$10$Ogi3eJ6SP/CXnkZLm9SfDuoAa9Nj/ocS4Qm0BFiY95DOLArZMxHLW'

    const { data, error } = await supabase
      .from('clubs')
      .insert([{ 
        name: body.name.trim(),
        slug: slug,
        admin_password_hash: defaultPasswordHash
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A club with this name already exists' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Club creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create club' },
      { status: 500 }
    )
  }
}
