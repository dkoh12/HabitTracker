import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/withAuth'

export const POST = withAuth(async (request, { user }) => {
  try {
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
      where: { id: user.id },
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
})
