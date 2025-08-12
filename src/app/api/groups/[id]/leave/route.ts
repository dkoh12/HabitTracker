import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

// DELETE /api/groups/[id]/leave - Leave a group
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await context.params
    const userId = (session.user as any).id

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
}
