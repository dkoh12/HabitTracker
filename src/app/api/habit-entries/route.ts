import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        userId: (session.user as any).id
      }
    })

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    // Create or update habit entry
    const entry = await prisma.habitEntry.upsert({
      where: {
        userId_habitId_date: {
          userId: (session.user as any).id,
          habitId,
          date: new Date(date)
        }
      },
      update: {
        value: value || 1,
        notes
      },
      create: {
        userId: (session.user as any).id,
        habitId,
        date: new Date(date),
        value: value || 1,
        notes
      }
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Create habit entry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const habitId = searchParams.get('habitId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      userId: (session.user as any).id
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
}
