import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/withAuth'

export const POST = withAuth(async (request, { user }) => {
  try {
    const { inviteCode } = await request.json()

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      )
    }

    // Find group by invite code
    const group = await prisma.group.findUnique({
      where: {
        inviteCode
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: group.id
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      )
    }

    // Add user to group
    const member = await prisma.groupMember.create({
      data: {
        userId: user.id,
        groupId: group.id,
        role: 'Member'
      },
      include: {
        user: true,
        group: true
      }
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Join group error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
