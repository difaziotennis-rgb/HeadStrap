import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const clubId = body.club_id

    if (!clubId) {
      return NextResponse.json(
        { error: 'Club ID is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    cookieStore.delete(`club_admin_${clubId}`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}

