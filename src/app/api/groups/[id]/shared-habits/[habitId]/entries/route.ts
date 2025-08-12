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

    // Parse the date string in UTC for consistent storage
    const entryDate = new Date(date + 'T00:00:00.000Z')
    
    // Backend timezone info (server's timezone, not client's)
    const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const serverOffset = new Date().getTimezoneOffset()
    const localDateOnServer = new Date(date + 'T00:00:00')
    
    console.log('API: Received date:', date, 'Parsed as UTC:', entryDate.toISOString())
    console.log('API: Server timezone:', serverTimezone, 'Offset (minutes):', serverOffset)
    console.log('API: Same date in server local timezone:', localDateOnServer.toISOString())
    console.log('API: Upserting entry with userId:', (session.user as any).id, 'habitId:', habitId, 'value:', value, 'completed:', completed)

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
        value: value !== undefined ? value : 1,
        notes,
        completed: completed !== undefined ? completed : value >= sharedHabit.target
      },
      create: {
        userId: (session.user as any).id,
        sharedHabitId: habitId,
        date: entryDate,
        value: value !== undefined ? value : 1,
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

// DELETE /api/groups/[id]/shared-habits/[habitId]/entries - Delete entry for shared habit
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId, habitId } = await context.params
    const { date } = await request.json()

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

    // Parse the date string in UTC for consistent storage
    const entryDate = new Date(date + 'T00:00:00.000Z')
    
    // Backend timezone info
    const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const serverOffset = new Date().getTimezoneOffset()
    
    console.log('API DELETE: Received date:', date, 'Parsed as UTC:', entryDate.toISOString())
    console.log('API DELETE: Server timezone:', serverTimezone, 'Offset (minutes):', serverOffset)

    // Delete ALL entries for this user/habit/date combination (to handle any duplicates)
    const deletedEntry = await prisma.sharedGroupHabitEntry.deleteMany({
      where: {
        userId: (session.user as any).id,
        sharedHabitId: habitId,
        date: entryDate
      }
    })

    console.log('API DELETE: Deleted', deletedEntry.count, 'entries for date:', date)

    return NextResponse.json({ deleted: deletedEntry.count > 0 })
  } catch (error) {
    console.error('Delete shared habit entry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
