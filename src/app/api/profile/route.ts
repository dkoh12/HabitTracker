import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/withAuth'

export const GET = withAuth(async (request, { user }) => {
  try {
    const userData = await prisma.user.findUnique({
      where: {
        id: user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            habits: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    })

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const PUT = withAuth(async (request, { user }) => {
  try {
    const { name } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const userData = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        name: name.trim()
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            habits: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
