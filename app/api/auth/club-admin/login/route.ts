import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/utils/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.club_id || !body.password) {
      return NextResponse.json(
        { error: 'Club ID and password are required' },
        { status: 400 }
      )
    }

    // Get club from database
    const { data: club, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', body.club_id)
      .single()

    if (error || !club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }

    if (!club.admin_password_hash) {
      return NextResponse.json(
        { error: 'Club admin password not set' },
        { status: 400 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(body.password, club.admin_password_hash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Create session cookie
    const cookieStore = await cookies()
    cookieStore.set(`club_admin_${club.id}`, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({ success: true, club: { id: club.id, name: club.name } })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}

