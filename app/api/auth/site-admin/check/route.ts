import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('site_admin_session')?.value

    if (!sessionId) {
      return NextResponse.json({ authenticated: false })
    }

    const supabase = await createClient()
    const { data: admin } = await supabase
      .from('site_admin')
      .select('id, username')
      .eq('id', sessionId)
      .single()

    if (!admin) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({ 
      authenticated: true,
      username: admin.username 
    })
  } catch (error) {
    return NextResponse.json({ authenticated: false })
  }
}

