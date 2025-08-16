import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuthAndParams } from '@/lib/withAuth'

export const GET = withAuthAndParams(async (request, { user }, { params }) => {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const { id } = await params

    // Verify user access to group
    const group = await prisma.group.findUnique({
      where: { id: id },
      include: {
        owner: true,
        members: {
          include: {
            user: true
          }
        },
        groupHabits: {
          include: {
            habit: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const isOwner = group.ownerId === user.id
    const isMember = group.members.some(member => member.userId === user.id)

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Generate date range in UTC for consistent backend handling
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    
    const dates: string[] = []
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0])
    }
    dates.reverse() // Most recent first

    // Get all members (including owner)
    const allMembers = [
      {
        id: group.owner.id,
        name: group.owner.name,
        email: group.owner.email,
        avatar: group.owner.avatar,
        role: 'OWNER'
      },
      ...group.members.map(member => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        avatar: member.user.avatar,
        role: member.role
      }))
    ]

    // Get all habits from group members
    const memberIds = allMembers.map(m => m.id)
    
    // Get shared group habits instead of individual habits
    const sharedHabits = await prisma.sharedGroupHabit.findMany({
      where: {
        groupId: id,
        isActive: true
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    // If no shared group habits, return empty spreadsheet data
    if (sharedHabits.length === 0) {
      const spreadsheetData = {
        dates,
        members: allMembers,
        habits: [],
        entries: {}
      }
      return NextResponse.json(spreadsheetData)
    }

    // Get all shared habit entries for the date range and members
    const sharedHabitEntries = await prisma.sharedGroupHabitEntry.findMany({
      where: {
        sharedHabitId: {
          in: sharedHabits.map(h => h.id)
        },
        userId: {
          in: memberIds
        },
        date: {
          gte: new Date(startDate.toISOString().split('T')[0] + 'T00:00:00.000Z'),
          lte: new Date(endDate.toISOString().split('T')[0] + 'T23:59:59.999Z')
        }
      },
      orderBy: {
        updatedAt: 'desc' // Get most recent updates first
      }
    })

    // Organize entries by date -> userId -> habitId (only keep most recent for each combination)
    const entriesMap: Record<string, Record<string, Record<string, any>>> = {}
    
    sharedHabitEntries.forEach(entry => {
      const dateStr = entry.date.toISOString().split('T')[0]
      const entryKey = `${dateStr}-${entry.userId}-${entry.sharedHabitId}`
      
      if (!entriesMap[dateStr]) entriesMap[dateStr] = {}
      if (!entriesMap[dateStr][entry.userId]) entriesMap[dateStr][entry.userId] = {}
      
      // Only add if this slot is empty (since entries are ordered by updatedAt desc, first one is most recent)
      if (!entriesMap[dateStr][entry.userId][entry.sharedHabitId]) {
        entriesMap[dateStr][entry.userId][entry.sharedHabitId] = {
          id: entry.id,
          habitId: entry.sharedHabitId,
          userId: entry.userId,
          date: dateStr,
          value: entry.value,
          completed: entry.completed
        }
      }
    })

    const spreadsheetData = {
      dates,
      members: allMembers,
      habits: sharedHabits.map(habit => ({
        id: habit.id,
        name: habit.name,
        description: habit.description,
        color: habit.color,
        target: habit.target,
        unit: habit.unit,
        frequency: habit.frequency,
        userId: habit.createdById,
        user: habit.createdBy
      })),
      entries: entriesMap
    }

    return NextResponse.json(spreadsheetData)
  } catch (error) {
    console.error('Get group spreadsheet error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
