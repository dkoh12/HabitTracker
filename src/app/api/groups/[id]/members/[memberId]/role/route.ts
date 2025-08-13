import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuthAndParams } from '@/lib/withAuth'

// PATCH /api/groups/[id]/members/[memberId]/role - Update member role
export const PATCH = withAuthAndParams(async (request, { user }, { params }) => {
  try {
    const { id: groupId, memberId } = await params
    const { role } = await request.json()
    const currentUserId = user.id

    // Validate role
    if (!['Member', 'Admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if current user is owner or admin
    const group = await prisma.group.findFirst({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const isOwner = group.ownerId === currentUserId
    const currentUserMembership = group.members.find(m => m.userId === currentUserId)
    const isAdmin = currentUserMembership?.role === 'Admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Only owners and admins can change roles' }, { status: 403 })
    }

    // Find the member to update
    const targetMember = group.members.find(m => m.id === memberId)
    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent owner from being demoted
    if (targetMember.userId === group.ownerId && role === 'Member') {
      return NextResponse.json({ error: 'Cannot demote group owner' }, { status: 400 })
    }

    // If demoting self from admin to member, ensure there's at least one other admin
    if (targetMember.userId === currentUserId && role === 'Member' && targetMember.role === 'Admin') {
      const otherAdmins = group.members.filter(m => 
        m.userId !== currentUserId && 
        (m.role === 'Admin' || m.userId === group.ownerId)
      )
      
      if (otherAdmins.length === 0) {
        return NextResponse.json({ 
          error: 'Cannot demote yourself - at least one other admin must remain' 
        }, { status: 400 })
      }
    }

    // Update the role
    const updatedMember = await prisma.groupMember.update({
      where: { id: memberId },
      data: { role },
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

    console.log(`Updated member ${targetMember.userId} role to ${role} in group ${groupId}`)

    return NextResponse.json({
      member: updatedMember,
      message: `Successfully updated role to ${role}`
    })

  } catch (error) {
    console.error('Update member role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
