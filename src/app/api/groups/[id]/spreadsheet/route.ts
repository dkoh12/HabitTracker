import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const isOwner = group.ownerId === (session.user as any).id
    const isMember = group.members.some(member => member.userId === (session.user as any).id)

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Generate date range
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
        avatar: group.owner.avatar
      },
      ...group.members.map(member => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        avatar: member.user.avatar
      }))
    ]

    // Get all habits from group members
    const memberIds = allMembers.map(m => m.id)
    const groupHabits = group.groupHabits.map(gh => gh.habit)

    // Get all habit entries for the date range and members
    const habitEntries = await prisma.habitEntry.findMany({
      where: {
        habitId: {
          in: groupHabits.map(h => h.id)
        },
        userId: {
          in: memberIds
        },
        date: {
          gte: new Date(startDate.toISOString().split('T')[0] + 'T00:00:00.000Z'),
          lte: new Date(endDate.toISOString().split('T')[0] + 'T23:59:59.999Z')
        }
      }
    })

    // Organize entries by date -> userId -> habitId
    const entriesMap: Record<string, Record<string, Record<string, any>>> = {}
    
    habitEntries.forEach(entry => {
      const dateStr = entry.date.toISOString().split('T')[0]
      if (!entriesMap[dateStr]) entriesMap[dateStr] = {}
      if (!entriesMap[dateStr][entry.userId]) entriesMap[dateStr][entry.userId] = {}
      entriesMap[dateStr][entry.userId][entry.habitId] = {
        id: entry.id,
        habitId: entry.habitId,
        userId: entry.userId,
        date: dateStr,
        value: entry.value,
        completed: entry.value > 0 // Derive completion from value
      }
    })

    const spreadsheetData = {
      dates,
      members: allMembers,
      habits: groupHabits.map(habit => ({
        id: habit.id,
        name: habit.name,
        description: habit.description,
        color: habit.color,
        target: habit.target,
        unit: habit.unit,
        frequency: habit.frequency,
        userId: habit.userId,
        user: {
          id: habit.user.id,
          name: habit.user.name,
          email: habit.user.email,
          avatar: habit.user.avatar
        }
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
}
