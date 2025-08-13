import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuthAndParams } from '@/lib/withAuth'

// DELETE /api/groups/[id]/leave - Leave a group
export const DELETE = withAuthAndParams(async (request, { user }, { params }) => {
  try {
    const { id: groupId } = await params
    const userId = user.id

    // Check if user is a member of the group (not the owner)
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId
      }
    })

    // Check if user is the owner
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId: userId
      }
    })

    if (group) {
      return NextResponse.json({ 
        error: 'Group owners cannot leave their own group. Transfer ownership or delete the group instead.' 
      }, { status: 400 })
    }

    if (!membership) {
      return NextResponse.json({ 
        error: 'You are not a member of this group' 
      }, { status: 404 })
    }

    // Remove the user from the group
    await prisma.groupMember.delete({
      where: {
        id: membership.id
      }
    })

    // Optionally, you could also remove their habit entries from shared group habits
    // This depends on whether you want to preserve their data or not
    // For now, I'll keep their entries for historical purposes

    console.log(`User ${userId} left group ${groupId}`)

    return NextResponse.json({ 
      message: 'Successfully left the group',
      success: true 
    })
  } catch (error) {
    console.error('Leave group error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
