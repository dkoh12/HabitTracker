import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMobileAuthAndParams } from '@/lib/withMobileAuth';

export const PUT = withMobileAuthAndParams(async (request, { user }, { params }) => {
  try {
    const { id } = await params as { id: string };
    const { value, notes } = await request.json();

    const entry = await prisma.habitEntry.findFirst({
      where: {
        id: id,
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
      where: { id: id },
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

export const DELETE = withMobileAuthAndParams(async (request, { user }, { params }) => {
  try {
    const { id } = await params as { id: string };
    const entry = await prisma.habitEntry.findFirst({
      where: {
        id: id,
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
      where: { id: id }
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
