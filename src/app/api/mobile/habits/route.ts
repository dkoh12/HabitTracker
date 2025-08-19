import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMobileAuth } from '@/lib/withMobileAuth';

export const GET = withMobileAuth(async (_request, { user }) => {
  try {
    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
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
    });

    return NextResponse.json(habits);
  } catch (error) {
    console.error('Get habits error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    );
  }
});

export const POST = withMobileAuth(async (request, { user }) => {
  try {
    const { 
      name, 
      description, 
      color, 
      target, 
      unit,
      frequency
    } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Habit name is required' },
        { status: 400 }
      );
    }

    const habit = await prisma.habit.create({
      data: {
        name,
        description: description || '',
        color: color || '#3B82F6',
        target: target || 1,
        unit: unit || '',
        frequency: frequency || 'daily',
        userId: user.id,
      },
      include: {
        habitEntries: true
      }
    });

    return NextResponse.json(habit);
  } catch (error) {
    console.error('Create habit error:', error);
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    );
  }
});
