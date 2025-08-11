import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the user still exists in the database
    const user = await prisma.user.findUnique({
      where: {
        id: (session.user as any).id
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true
      }
    })

    if (!user) {
      // User no longer exists in database, session is invalid
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
