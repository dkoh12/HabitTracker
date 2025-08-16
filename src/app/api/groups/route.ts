import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateInviteCode } from '@/lib/utils'
import { withAuth } from '@/lib/withAuth'
import { GroupRole } from '@prisma/client'

export const GET = withAuth(async (request, { user }) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: {
                userId: user.id
              }
            }
          }
        ]
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

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Get groups error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (request, { user }) => {
  try {
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        inviteCode: generateInviteCode(),
        ownerId: user.id,
        // Automatically add the owner as an Owner member
        members: {
          create: {
            userId: user.id,
            role: GroupRole.Owner
          }
        }
      },
      include: {
        owner: true,
        members: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Create group error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
