import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMobileAuth } from '@/lib/withMobileAuth';

export const GET = withMobileAuth(async (request, { user }, { params }: { params: { id: string } }) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: user.id
      },
      include: {
        habitEntries: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(habit);
  } catch (error) {
    console.error('Get habit error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit' },
      { status: 500 }
    );
  }
});

export const PUT = withMobileAuth(async (request, { user }, { params }: { params: { id: string } }) => {
  try {
    const { 
      name, 
      description, 
      color, 
      target, 
      unit,
      frequency,
      isActive
    } = await request.json();

    const habit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    const updatedHabit = await prisma.habit.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(target !== undefined && { target }),
        ...(unit !== undefined && { unit }),
        ...(frequency !== undefined && { frequency }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        habitEntries: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    return NextResponse.json(updatedHabit);
  } catch (error) {
    console.error('Update habit error:', error);
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    );
  }
});

export const DELETE = withMobileAuth(async (request, { user }, { params }: { params: { id: string } }) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    await prisma.habit.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
});
