import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/unifiedAuth'

export const GET = requireAuth(async (request, auth) => {
  const habits = await prisma.habit.findMany({
    where: {
      userId: auth.user.id,
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
})

export const POST = requireAuth(async (request, auth) => {
  const { 
    name, 
    description, 
    color, 
    target, 
    unit,
    scheduleType,
    selectedDays,
    customInterval,
    customUnit
  } = await request.json()

  if (!name) {
    return NextResponse.json(
      { error: 'Habit name is required' },
      { status: 400 }
    )
  }

  // Convert advanced scheduling to simple frequency for database storage
  let frequency = 'daily'
  if (scheduleType === 'weekly' && selectedDays?.length === 7) {
    frequency = 'daily'
  } else if (scheduleType === 'monthly') {
    frequency = 'monthly'
  } else if (scheduleType === 'weekly') {
    frequency = 'weekly'
  } else if (scheduleType === 'custom') {
    if (customUnit === 'days' && customInterval === 1) {
      frequency = 'daily'
    } else if (customUnit === 'weeks' && customInterval === 1) {
      frequency = 'weekly'
    } else if (customUnit === 'months' && customInterval === 1) {
      frequency = 'monthly'
    } else {
      frequency = 'weekly' // Default for other custom intervals
    }
  }

  const habit = await prisma.habit.create({
    data: {
      name,
      description,
      color: color || '#3B82F6',
      frequency: frequency || 'daily',
      target: target || 1,
      unit,
      userId: auth.user.id
    }
  })

  return NextResponse.json(habit, { status: 201 })
})
