import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/unifiedAuth'
import { prisma } from '@/lib/prisma'

// GET /api/badges - Get all badges with user's earned status
export const GET = requireAuth(async (request, auth) => {
  try {
    // Get all badges
    const allBadges = await prisma.badge.findMany({
      orderBy: { createdAt: 'asc' }
    })

    // Get user's earned badges
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: auth.user.id },
      include: { badge: true }
    })

    // Create a map of earned badge IDs for quick lookup
    const earnedBadgeMap = new Map(
      userBadges.map(ub => [ub.badgeId, ub])
    )

    // Combine badges with earned status
    const badgesWithStatus = allBadges.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      category: badge.category,
      icon: badge.icon,
      color: badge.color,
      points: badge.points,
      rarity: badge.rarity,
      requirement: badge.requirement,
      earned: earnedBadgeMap.has(badge.id),
      earnedDate: earnedBadgeMap.get(badge.id)?.earnedAt || null
    }))

    // Calculate user stats
    const earnedBadges = badgesWithStatus.filter(b => b.earned)
    const totalPoints = earnedBadges.reduce((sum, badge) => sum + badge.points, 0)

    return NextResponse.json({
      badges: badgesWithStatus,
      userStats: {
        totalPoints,
        badgesEarned: earnedBadges.length,
        // You can add more stats here like streaks, habit counts, etc.
        currentStreak: 0, // TODO: Calculate from habit entries
        habitsCompleted: 0 // TODO: Calculate from habit entries
      }
    })
  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    )
  }
})

// POST /api/badges - Award a badge to a user (for testing or manual awarding)
export const POST = requireAuth(async (request, auth) => {
  try {
    const { badgeId } = await request.json()

    if (!badgeId) {
      return NextResponse.json(
        { error: 'Badge ID is required' },
        { status: 400 }
      )
    }

    // Check if badge exists
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId }
    })

    if (!badge) {
      return NextResponse.json(
        { error: 'Badge not found' },
        { status: 404 }
      )
    }

    // Check if user already has this badge
    const existingUserBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: auth.user.id,
          badgeId: badgeId
        }
      }
    })

    if (existingUserBadge) {
      return NextResponse.json(
        { error: 'Badge already earned' },
        { status: 400 }
      )
    }

    // Award the badge
    const userBadge = await prisma.userBadge.create({
      data: {
        userId: auth.user.id,
        badgeId: badgeId
      },
      include: {
        badge: true
      }
    })

    return NextResponse.json({
      message: 'Badge awarded successfully',
      userBadge
    })
  } catch (error) {
    console.error('Error awarding badge:', error)
    return NextResponse.json(
      { error: 'Failed to award badge' },
      { status: 500 }
    )
  }
})
