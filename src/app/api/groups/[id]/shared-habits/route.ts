import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

// GET /api/groups/[id]/shared-habits - Get all shared habits for a group
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await context.params

    // Verify user is a member of the group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: (session.user as any).id
      }
    })

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId: (session.user as any).id
      }
    })

    if (!membership && !group) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    const sharedHabits = await prisma.sharedGroupHabit.findMany({
      where: {
        groupId,
        isActive: true
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        entries: {
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(sharedHabits)
  } catch (error) {
    console.error('Get shared habits error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[id]/shared-habits - Create a new shared habit for the group
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await context.params
    const { name, description, color, frequency, target, unit } = await request.json()

    // Verify user is a member of the group or the owner
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: (session.user as any).id
      }
    })

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId: (session.user as any).id
      }
    })

    if (!membership && !group) {
      return NextResponse.json({ error: 'Not authorized to create habits in this group' }, { status: 403 })
    }

    const sharedHabit = await prisma.sharedGroupHabit.create({
      data: {
        name,
        description,
        color: color || '#3B82F6',
        frequency: frequency || 'daily',
        target: target || 1,
        unit,
        groupId,
        createdById: (session.user as any).id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json(sharedHabit)
  } catch (error) {
    console.error('Create shared habit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
