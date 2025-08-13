import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuthAndParams } from '@/lib/withAuth'

export const PUT = withAuthAndParams(async (request, { user }, { params }) => {
  try {
    const { 
      name, 
      description, 
      color, 
      target, 
      unit,
      scheduleType,
      selectedDays,
      monthlyType,
      monthlyDate,
      monthlyWeekday,
      monthlyWeek,
      customInterval,
      customUnit
    } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Habit name is required' },
        { status: 400 }
      )
    }

    // Check if habit exists and belongs to user
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        isActive: true
      }
    })

    if (!existingHabit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
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

    const habit = await prisma.habit.update({
      where: {
        id: params.id
      },
      data: {
        name,
        description,
        color: color || '#3B82F6',
        frequency,
        target: target || 1,
        unit
      }
    })

    return NextResponse.json(habit)
  } catch (error) {
    console.error('Update habit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const DELETE = withAuthAndParams(async (request, { user }, { params }) => {
  try {
    // Check if habit exists and belongs to user
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        isActive: true
      }
    })

    if (!existingHabit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting isActive to false
    await prisma.habit.update({
      where: {
        id: params.id
      },
      data: {
        isActive: false
      }
    })

    return NextResponse.json({ message: 'Habit deleted successfully' })
  } catch (error) {
    console.error('Delete habit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
