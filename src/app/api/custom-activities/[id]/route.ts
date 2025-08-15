import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuthAndParams } from '@/lib/withAuth'

export const PUT = withAuthAndParams(async (request, { user }, { params }) => {
  const { id } = await params
  const { text, color } = await request.json()

  if (!text) {
    return NextResponse.json(
      { error: 'Text is required' },
      { status: 400 }
    )
  }

  try {
    // Check if the activity exists and belongs to the user
    const existingActivity = await prisma.customActivity.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    const updatedActivity = await prisma.customActivity.update({
      where: { id },
      data: {
        text: text.trim(),
        ...(color && { color })
      }
    })

    // Format date as string for frontend
    const formattedActivity = {
      ...updatedActivity,
      date: updatedActivity.date.toISOString().split('T')[0]
    }

    return NextResponse.json(formattedActivity)
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An activity with this text already exists for this date' },
        { status: 409 }
      )
    }
    
    console.error('Error updating custom activity:', error)
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    )
  }
})

export const DELETE = withAuthAndParams(async (request, { user }, { params }) => {
  const { id } = await params

  try {
    // Check if the activity exists and belongs to the user
    const existingActivity = await prisma.customActivity.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    await prisma.customActivity.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting custom activity:', error)
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    )
  }
})
