import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PATCH - Update a shared habit
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; habitId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId, habitId } = await params
    const body = await request.json()
    const { name, description, color, target, unit, frequency } = body

    // Validate required fields
    if (!name || !target) {
      return NextResponse.json({ error: 'Name and target are required' }, { status: 400 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id
      }
    })

    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const isOwner = group.ownerId === user.id
    const isAdmin = membership?.role === 'Admin'
    const isMember = !!membership || isOwner

    if (!isMember) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 })
    }

    // Get the habit to check permissions
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        groupHabits: {
          some: {
            groupId
          }
        }
      }
    })

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found in this group' }, { status: 404 })
    }

    // Check if user can edit this habit (habit creator or group owner)
    const canEdit = habit.userId === user.id || isOwner
    if (!canEdit) {
      return NextResponse.json({ error: 'You can only edit habits you created or if you are the group owner' }, { status: 403 })
    }

    // Update the habit
    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#667eea',
        target: parseInt(target.toString()),
        unit: unit?.trim() || null,
        frequency: frequency || 'daily'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json(updatedHabit)
  } catch (error) {
    console.error('Error updating shared habit:', error)
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a shared habit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; habitId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId, habitId } = await params

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id
      }
    })

    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const isOwner = group.ownerId === user.id
    const isAdmin = membership?.role === 'Admin'
    const isMember = !!membership || isOwner

    if (!isMember) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 })
    }

    // Get the habit to check permissions
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        groupHabits: {
          some: {
            groupId
          }
        }
      }
    })

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found in this group' }, { status: 404 })
    }

    // Check if user can delete this habit (habit creator or group owner)
    const canDelete = habit.userId === user.id || isOwner
    if (!canDelete) {
      return NextResponse.json({ error: 'You can only delete habits you created or if you are the group owner' }, { status: 403 })
    }

    // Delete all related entries first
    await prisma.habitEntry.deleteMany({
      where: { habitId }
    })

    // Remove from group
    await prisma.groupHabit.deleteMany({
      where: { 
        habitId,
        groupId 
      }
    })

    // Delete the habit itself
    await prisma.habit.delete({
      where: { id: habitId }
    })

    return NextResponse.json({ message: 'Habit deleted successfully' })
  } catch (error) {
    console.error('Error deleting shared habit:', error)
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    )
  }
}

// GET - Get a specific shared habit details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; habitId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId, habitId } = await params

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id
      }
    })

    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const isOwner = group.ownerId === user.id
    const isMember = !!membership || isOwner

    if (!isMember) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 })
    }

    // Get the habit details
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        groupHabits: {
          some: {
            groupId
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found in this group' }, { status: 404 })
    }

    return NextResponse.json(habit)
  } catch (error) {
    console.error('Error fetching shared habit:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habit details' },
      { status: 500 }
    )
  }
}
