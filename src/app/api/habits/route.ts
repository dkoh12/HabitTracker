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

    const habits = await prisma.habit.findMany({
      where: {
        userId: (session.user as any).id,
        isActive: true
      },
      include: {
        habitEntries: {
          orderBy: {
            date: 'desc'
          },
          take: 30 // Last 30 entries
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(habits)
  } catch (error) {
    console.error('Get habits error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, color, frequency, target, unit } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Habit name is required' },
        { status: 400 }
      )
    }

    const habit = await prisma.habit.create({
      data: {
        name,
        description,
        color: color || '#3B82F6',
        frequency: frequency || 'daily',
        target: target || 1,
        unit,
        userId: (session.user as any).id
      }
    })

    return NextResponse.json(habit, { status: 201 })
  } catch (error) {
    console.error('Create habit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
