import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMobileAuth } from '@/lib/withMobileAuth';

export const POST = withMobileAuth(async (request, { user }) => {
  try {
    const { habitId, date, value, notes } = await request.json();

    if (!habitId || !date) {
      return NextResponse.json(
        { error: 'Habit ID and date are required' },
        { status: 400 }
      );
    }

    // Verify habit belongs to user
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: user.id
      }
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Check if entry already exists for this date
    const existingEntry = await prisma.habitEntry.findFirst({
      where: {
        habitId,
        userId: user.id,
        date: new Date(date)
      }
    });

    let entry;
    if (existingEntry) {
      // Update existing entry
      entry = await prisma.habitEntry.update({
        where: { id: existingEntry.id },
        data: {
          value: value || 1,
          notes: notes || ''
        }
      });
    } else {
      // Create new entry
      entry = await prisma.habitEntry.create({
        data: {
          habitId,
          userId: user.id,
          date: new Date(date),
          value: value || 1,
          notes: notes || ''
        }
      });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Create habit entry error:', error);
    return NextResponse.json(
      { error: 'Failed to create habit entry' },
      { status: 500 }
    );
  }
});

export const GET = withMobileAuth(async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get('habitId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: {
      userId: string;
      habitId?: string;
      date?: {
        gte: Date;
        lte: Date;
      };
    } = {
      userId: user.id,
    };

    if (habitId) {
      where.habitId = habitId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const entries = await prisma.habitEntry.findMany({
      where,
      include: {
        habit: {
          select: {
            id: true,
            name: true,
            color: true,
            target: true,
            unit: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Get habit entries error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit entries' },
      { status: 500 }
    );
  }
});
