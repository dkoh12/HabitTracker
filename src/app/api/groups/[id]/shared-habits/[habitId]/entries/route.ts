import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

interface RouteContext {
  params: Promise<{
    id: string
    habitId: string
  }>
}

// POST /api/groups/[id]/shared-habits/[habitId]/entries - Create or update entry for shared habit
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId, habitId } = await context.params
    const { date, value, notes, completed } = await request.json()

    // Verify user is a member of the group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: (session.user as any).id
      }
    })

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId: (session.user as any).id
      }
    })

    if (!membership && !group) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    // Verify the shared habit exists and belongs to this group
    const sharedHabit = await prisma.sharedGroupHabit.findFirst({
      where: {
        id: habitId,
        groupId
      }
    })

    if (!sharedHabit) {
      return NextResponse.json({ error: 'Shared habit not found' }, { status: 404 })
    }

    // Parse the date string properly to avoid timezone issues
    const entryDate = new Date(date + 'T00:00:00.000Z')
    
    console.log('API: Received date:', date, 'Parsed as:', entryDate.toISOString())

    // Upsert the entry
    const entry = await prisma.sharedGroupHabitEntry.upsert({
      where: {
        userId_sharedHabitId_date: {
          userId: (session.user as any).id,
          sharedHabitId: habitId,
          date: entryDate
        }
      },
      update: {
        value: value || 1,
        notes,
        completed: completed !== undefined ? completed : value >= sharedHabit.target
      },
      create: {
        userId: (session.user as any).id,
        sharedHabitId: habitId,
        date: entryDate,
        value: value || 1,
        notes,
        completed: completed !== undefined ? completed : value >= sharedHabit.target
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        sharedHabit: {
          select: {
            id: true,
            name: true,
            target: true,
            unit: true
          }
        }
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Create/update shared habit entry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/groups/[id]/shared-habits/[habitId]/entries - Get entries for a shared habit
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId, habitId } = await context.params
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Verify user is a member of the group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: (session.user as any).id
      }
    })

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId: (session.user as any).id
      }
    })

    if (!membership && !group) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const entries = await prisma.sharedGroupHabitEntry.findMany({
      where: {
        sharedHabitId: habitId,
        date: {
          gte: startDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Get shared habit entries error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
