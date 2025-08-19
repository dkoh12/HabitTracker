import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthAndParams } from '@/lib/unifiedAuth'

export const GET = requireAuthAndParams(async (request, auth, { params }) => {
  try {
    const { id } = await params as { id: string }

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
    const isOwner = group.ownerId === auth.user.id
    const isMember = group.members.some(member => member.userId === auth.user.id)

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
