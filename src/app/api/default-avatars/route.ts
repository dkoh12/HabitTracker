import { NextRequest, NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const defaultAvatarsPath = join(process.cwd(), 'public', 'uploads', 'default_avatar')
    
    // Read all files in the default_avatar directory
    const files = await readdir(defaultAvatarsPath)
    
    // Filter for image files and create URLs
    const avatars = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/))
      .map(file => ({
        id: file.replace(/\.(jpg|jpeg|png|gif|webp)$/i, ''),
        filename: file,
        url: `/uploads/default_avatar/${file}`
      }))
      .sort((a, b) => a.filename.localeCompare(b.filename))

    return NextResponse.json({ avatars })
  } catch (error) {
    console.error('Error loading default avatars:', error)
    return NextResponse.json(
      { error: 'Failed to load default avatars' },
      { status: 500 }
    )
  }
}
