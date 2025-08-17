import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple admin route to view users (for development/testing only)
export async function GET() {
  try {
    // Add basic auth or remove in production for security
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
        // Don't include password hash for security
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      count: users.length,
      users
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
