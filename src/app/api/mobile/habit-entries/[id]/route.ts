import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMobileAuth } from '@/lib/withMobileAuth';

export const PUT = withMobileAuth(async (request, { user }, { params }: { params: { id: string } }) => {
  try {
    const { value, notes } = await request.json();

    const entry = await prisma.habitEntry.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Habit entry not found' },
        { status: 404 }
      );
    }

    const updatedEntry = await prisma.habitEntry.update({
      where: { id: params.id },
      data: {
        ...(value !== undefined && { value }),
        ...(notes !== undefined && { notes }),
      }
    });

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Update habit entry error:', error);
    return NextResponse.json(
      { error: 'Failed to update habit entry' },
      { status: 500 }
    );
  }
});

export const DELETE = withMobileAuth(async (request, { user }, { params }: { params: { id: string } }) => {
  try {
    const entry = await prisma.habitEntry.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Habit entry not found' },
        { status: 404 }
      );
    }

    await prisma.habitEntry.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Habit entry deleted successfully' });
  } catch (error) {
    console.error('Delete habit entry error:', error);
    return NextResponse.json(
      { error: 'Failed to delete habit entry' },
      { status: 500 }
    );
  }
});
