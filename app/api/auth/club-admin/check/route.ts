import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get('club_id')

    if (!clubId) {
      return NextResponse.json({ authenticated: false })
    }

    const cookieStore = await cookies()
    const session = cookieStore.get(`club_admin_${clubId}`)?.value

    if (!session || session !== 'authenticated') {
      return NextResponse.json({ authenticated: false })
    }

    // Verify club exists
    const supabase = await createClient()
    const { data: club } = await supabase
      .from('clubs')
      .select('id, name')
      .eq('id', clubId)
      .single()

    if (!club) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({ 
      authenticated: true,
      club: { id: club.id, name: club.name }
    })
  } catch (error) {
    return NextResponse.json({ authenticated: false })
  }
}

