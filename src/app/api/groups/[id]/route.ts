import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuthAndParams } from '@/lib/withAuth'

export const GET = withAuthAndParams(async (request, { user }, { params }) => {
  try {
    const { id } = await params

    const group = await prisma.group.findUnique({
      where: {
        id: id
      },
      include: {
        owner: true,
        members: {
          include: {
            user: true
          }
        },
        groupHabits: {
          include: {
            habit: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is a member or owner
    const isOwner = group.ownerId === user.id
    const isMember = group.members.some(member => member.userId === user.id)

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Get group detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
