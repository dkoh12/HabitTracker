import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/withAuth'

export const GET = withAuth(async (request, { user }) => {
  try {
    // Check if the user still exists in the database
    const userData = await prisma.user.findUnique({
      where: {
        id: user.id
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true
      }
    })

    if (!userData) {
      // User no longer exists in database, session is invalid
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
