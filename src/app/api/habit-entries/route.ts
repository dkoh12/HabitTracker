import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/withAuth'

export const POST = withAuth(async (request, { user }) => {
  try {
    const { habitId, date, value, notes } = await request.json()

    if (!habitId || !date) {
      return NextResponse.json(
        { error: 'Habit ID and date are required' },
        { status: 400 }
      )
    }

    // Check if habit belongs to user
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: user.id
      }
    })

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    // Handle the entry based on value
    let entry
    
    // Parse the date string in UTC for consistent storage (copied from group habits)
    const entryDate = new Date(date + 'T00:00:00.000Z')
    
    if (value === 0) {
      // If value is 0 (none state), delete the entry if it exists
      await prisma.habitEntry.deleteMany({
        where: {
          userId: user.id,
          habitId,
          date: entryDate
        }
      })
      entry = null
    } else {
      // Create or update habit entry
      entry = await prisma.habitEntry.upsert({
        where: {
          userId_habitId_date: {
            userId: user.id,
            habitId,
            date: entryDate
          }
        },
        update: {
          value: value,
          notes
        },
        create: {
          userId: user.id,
          habitId,
          date: entryDate,
          value: value,
          notes
        }
      })
    }

    return NextResponse.json(entry || { deleted: true }, { status: 201 })
  } catch (error) {
    console.error('Create habit entry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const GET = withAuth(async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url)
    const habitId = searchParams.get('habitId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      userId: user.id
    }

    if (habitId) {
      where.habitId = habitId
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const entries = await prisma.habitEntry.findMany({
      where,
      include: {
        habit: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Get habit entries error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
