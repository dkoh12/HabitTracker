import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/withAuth'

export const GET = withAuth(async (request, { user }) => {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const whereClause: any = {
    userId: user.id
  }

  // Add date filtering if provided
  if (startDate && endDate) {
    whereClause.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  }

  const customActivities = await prisma.customActivity.findMany({
    where: whereClause,
    orderBy: {
      date: 'desc'
    }
  })

  // Format dates as strings for frontend
  const formattedActivities = customActivities.map(activity => ({
    ...activity,
    date: activity.date.toISOString().split('T')[0] // Format as YYYY-MM-DD
  }))

  return NextResponse.json(formattedActivities)
})

export const POST = withAuth(async (request, { user }) => {
  const { text, color, date } = await request.json()

  if (!text || !color || !date) {
    return NextResponse.json(
      { error: 'Text, color, and date are required' },
      { status: 400 }
    )
  }

  try {
    const activity = await prisma.customActivity.create({
      data: {
        text: text.trim(),
        color,
        date: new Date(date),
        userId: user.id
      }
    })

    // Format date as string for frontend
    const formattedActivity = {
      ...activity,
      date: activity.date.toISOString().split('T')[0]
    }

    return NextResponse.json(formattedActivity, { status: 201 })
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An activity with this text already exists for this date' },
        { status: 409 }
      )
    }
    
    console.error('Error creating custom activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
})
