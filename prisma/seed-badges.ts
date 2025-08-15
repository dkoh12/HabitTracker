import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const badges = [
  // Beginner badges
  {
    name: 'First Steps',
    description: 'Create your very first habit',
    category: 'beginner',
    icon: 'CheckCircle2',
    color: '#10b981',
    points: 10,
    rarity: 'common',
    requirement: 'Create 1 habit'
  },
  {
    name: 'Habit Starter',
    description: 'Complete your first habit entry',
    category: 'beginner',
    icon: 'Star',
    color: '#f59e0b',
    points: 25,
    rarity: 'common',
    requirement: 'Complete 1 habit entry'
  },
  {
    name: 'Getting Started',
    description: 'Maintain a 3-day streak',
    category: 'beginner',
    icon: 'Flame',
    color: '#ef4444',
    points: 50,
    rarity: 'common',
    requirement: 'Complete 3 days in a row'
  },

  // Streak badges
  {
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    category: 'streak',
    icon: 'Flame',
    color: '#f59e0b',
    points: 100,
    rarity: 'uncommon',
    requirement: 'Complete 7 days in a row'
  },
  {
    name: 'Two Week Champion',
    description: 'Maintain a 14-day streak',
    category: 'streak',
    icon: 'Trophy',
    color: '#8b5cf6',
    points: 200,
    rarity: 'rare',
    requirement: 'Complete 14 days in a row'
  },
  {
    name: 'Month Master',
    description: 'Achieve a 30-day streak',
    category: 'streak',
    icon: 'Crown',
    color: '#dc2626',
    points: 500,
    rarity: 'epic',
    requirement: 'Complete 30 days in a row'
  },

  // Consistency badges
  {
    name: 'Consistent Performer',
    description: 'Achieve 70% completion rate over 2 weeks',
    category: 'consistency',
    icon: 'Target',
    color: '#3b82f6',
    points: 150,
    rarity: 'uncommon',
    requirement: '70% completion for 14 days'
  },
  {
    name: 'Reliability Master',
    description: 'Achieve 85% completion rate over a month',
    category: 'consistency',
    icon: 'Award',
    color: '#06b6d4',
    points: 300,
    rarity: 'rare',
    requirement: '85% completion for 30 days'
  },

  // Achievement badges
  {
    name: 'Century Club',
    description: 'Complete 100 habit entries',
    category: 'achievement',
    icon: 'TrendingUp',
    color: '#84cc16',
    points: 250,
    rarity: 'rare',
    requirement: 'Complete 100 total entries'
  },
  {
    name: 'Habit Collector',
    description: 'Track 10 different habits',
    category: 'achievement',
    icon: 'BookOpen',
    color: '#ec4899',
    points: 200,
    rarity: 'uncommon',
    requirement: 'Create 10 different habits'
  },

  // Special badges
  {
    name: 'Early Bird',
    description: 'Complete habits before 8 AM for 7 days',
    category: 'special',
    icon: 'Clock',
    color: '#f97316',
    points: 150,
    rarity: 'uncommon',
    requirement: 'Complete before 8 AM for 7 days'
  },
  {
    name: 'Perfectionist',
    description: 'Achieve 100% completion for a full week',
    category: 'special',
    icon: 'Heart',
    color: '#e11d48',
    points: 300,
    rarity: 'rare',
    requirement: '100% completion for 7 days'
  },
  {
    name: 'Night Owl',
    description: 'Complete evening habits for 7 days',
    category: 'special',
    icon: 'Moon',
    color: '#6366f1',
    points: 200,
    rarity: 'rare',
    requirement: 'Complete evening habits for 7 days'
  },

  // Group Activity Badges
  {
    name: 'Social Butterfly',
    description: 'Join your first group',
    category: 'group',
    icon: 'Users',
    color: '#10b981',
    points: 100,
    rarity: 'common',
    requirement: 'Join a group'
  },
  {
    name: 'Team Player',
    description: 'Complete 10 group habits',
    category: 'group',
    icon: 'UserCheck',
    color: '#8b5cf6',
    points: 250,
    rarity: 'uncommon',
    requirement: 'Complete 10 group habits'
  },
  {
    name: 'Group Leader',
    description: 'Create and manage a group',
    category: 'group',
    icon: 'Crown',
    color: '#dc2626',
    points: 300,
    rarity: 'rare',
    requirement: 'Create a group'
  },
  {
    name: 'Motivator',
    description: 'Invite 5 friends to join groups',
    category: 'group',
    icon: 'UserPlus',
    color: '#f59e0b',
    points: 200,
    rarity: 'uncommon',
    requirement: 'Invite 5 friends'
  },
  {
    name: 'Group Streak Master',
    description: 'Maintain a 14-day streak in group habits',
    category: 'group',
    icon: 'Flame',
    color: '#ef4444',
    points: 400,
    rarity: 'epic',
    requirement: 'Complete group habits for 14 days straight'
  },
  {
    name: 'Community Champion',
    description: 'Be active in 3 different groups',
    category: 'group',
    icon: 'Shield',
    color: '#7c3aed',
    points: 500,
    rarity: 'epic',
    requirement: 'Active in 3 groups'
  },

  // More Special Badges
  {
    name: 'Weekend Warrior',
    description: 'Complete habits on weekends for 4 weeks',
    category: 'special',
    icon: 'Zap',
    color: '#059669',
    points: 250,
    rarity: 'rare',
    requirement: 'Weekend completion for 4 weeks'
  },
  {
    name: 'Comeback Kid',
    description: 'Restart a habit after a break',
    category: 'special',
    icon: 'Target',
    color: '#dc2626',
    points: 150,
    rarity: 'uncommon',
    requirement: 'Restart after missing 3+ days'
  },
  {
    name: 'Diversity Master',
    description: 'Complete habits in 5 different categories',
    category: 'achievement',
    icon: 'Star',
    color: '#8b5cf6',
    points: 300,
    rarity: 'rare',
    requirement: 'Complete habits in 5 categories'
  },
  {
    name: 'Lightning Fast',
    description: 'Complete all daily habits in under 1 hour',
    category: 'special',
    icon: 'Zap',
    color: '#fbbf24',
    points: 200,
    rarity: 'uncommon',
    requirement: 'Complete all habits within 1 hour'
  }
]

async function main() {
  console.log('🏆 Seeding badges for production...')
  
  let createdCount = 0
  let updatedCount = 0
  
  for (const badge of badges) {
    const result = await prisma.badge.upsert({
      where: { name: badge.name },
      update: badge,
      create: badge
    })
    
    // Check if it was created or updated (simplified check)
    const existing = await prisma.badge.findUnique({
      where: { name: badge.name }
    })
    
    if (result.createdAt === result.updatedAt) {
      createdCount++
    } else {
      updatedCount++
    }
  }
  
  console.log(`✅ Badge seeding completed:`)
  console.log(`   - Created: ${createdCount} new badges`)
  console.log(`   - Updated: ${updatedCount} existing badges`)
  console.log(`   - Total: ${badges.length} badges in system`)
}

main()
  .catch((e) => {
    console.error('❌ Badge seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
