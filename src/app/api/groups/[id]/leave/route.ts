import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuthAndParams } from '@/lib/withAuth'

// DELETE /api/groups/[id]/leave - Leave a group
export const DELETE = withAuthAndParams(async (request, { user }, { params }) => {
  try {
    const { id: groupId } = await params
    const userId = user.id

    // Get group information and member count
    const group = await prisma.group.findFirst({
      where: { id: groupId },
      include: {
        members: true,
        _count: {
          select: { members: true }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ 
        error: 'Group not found' 
      }, { status: 404 })
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId
      }
    })

    if (!membership) {
      return NextResponse.json({ 
        error: 'You are not a member of this group' 
      }, { status: 404 })
    }

    const isOwner = group.ownerId === userId
    const memberCount = group._count.members
    const isOnlyPersonInGroup = memberCount === 1

    // Only restriction: owners cannot leave if there are other people in the group
    if (isOwner && !isOnlyPersonInGroup) {
      return NextResponse.json({ 
        error: 'As the group owner, you cannot leave while there are other members. Transfer ownership or remove other members first.' 
      }, { status: 400 })
    }

    // Remove the user from the group
    await prisma.groupMember.delete({
      where: {
        id: membership.id
      }
    })

    // If this was the only person in the group, delete the group entirely
    if (isOnlyPersonInGroup) {
      // First delete related data
      await prisma.sharedGroupHabitEntry.deleteMany({
        where: {
          sharedHabit: {
            groupId: groupId
          }
        }
      })

      await prisma.sharedGroupHabit.deleteMany({
        where: { groupId: groupId }
      })

      await prisma.groupHabit.deleteMany({
        where: { groupId: groupId }
      })

      // Delete the group
      await prisma.group.delete({
        where: { id: groupId }
      })

      console.log(`Group ${groupId} deleted because last person ${userId} left`)

      return NextResponse.json({ 
        message: 'Successfully left the group. The group has been deleted as it had no remaining members.',
        success: true,
        groupDeleted: true
      })
    }

    console.log(`User ${userId} left group ${groupId}`)

    return NextResponse.json({ 
      message: 'Successfully left the group',
      success: true,
      groupDeleted: false 
    })
  } catch (error) {
    console.error('Leave group error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
