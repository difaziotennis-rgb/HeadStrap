import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    const file = formData.get('file') as File
    const playerId = formData.get('playerId') as string
    const clubId = formData.get('clubId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!playerId || !clubId) {
      return NextResponse.json(
        { error: 'Player ID and Club ID are required' },
        { status: 400 }
      )
    }

    // Verify club admin authentication
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const session = cookieStore.get(`club_admin_${clubId}`)?.value

    if (!session || session !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${playerId}-${Date.now()}.${fileExt}`
    const filePath = `profile-pictures/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('player-profiles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('player-profiles')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to get image URL' },
        { status: 500 }
      )
    }

    // Update player's profile_picture_url in database
    const { error: updateError } = await supabase
      .from('players')
      .update({ profile_picture_url: urlData.publicUrl })
      .eq('id', playerId)

    if (updateError) {
      console.error('Update error:', updateError)
      // Try to delete the uploaded file if database update fails
      await supabase.storage
        .from('player-profiles')
        .remove([filePath])
      
      return NextResponse.json(
        { error: 'Failed to update player profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      message: 'Profile picture uploaded successfully'
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}
