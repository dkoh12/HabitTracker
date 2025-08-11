import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { avatarUrl } = await request.json()

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return NextResponse.json({ error: 'Avatar URL is required' }, { status: 400 })
    }

    // Validate that it's a default avatar URL
    if (!avatarUrl.startsWith('/uploads/default_avatar/')) {
      return NextResponse.json({ error: 'Invalid default avatar URL' }, { status: 400 })
    }

    // Update user's avatar in database
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { avatar: avatarUrl },
      include: {
        _count: {
          select: { habits: true }
        }
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error setting default avatar:', error)
    return NextResponse.json(
      { error: 'Failed to set default avatar' },
      { status: 500 }
    )
  }
}
