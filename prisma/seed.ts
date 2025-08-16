import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create test users using upsert to handle existing data
  const hashedPassword = await bcrypt.hash('david', 10)
  
  const user1 = await prisma.user.upsert({
    where: { username: 'david' },
    update: {},
    create: {
      email: 'david@io',
      username: 'david',
      password: hashedPassword,
      name: 'David',
      avatar: null
    }
  })

  const user2 = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: {
      email: 'alice@example.com',
      username: 'alice',
      password: hashedPassword,
      name: 'Alice Johnson',
      avatar: null
    }
  })

  const user3 = await prisma.user.upsert({
    where: { username: 'bob' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob',
      password: hashedPassword,
      name: 'Bob Smith',
      avatar: null
    }
  })

  const user4 = await prisma.user.upsert({
    where: { username: 'charlie' },
    update: {},
    create: {
      email: 'charlie@example.com',
      username: 'charlie',
      password: hashedPassword,
      name: 'Charlie Brown',
      avatar: null
    }
  })

  const user5 = await prisma.user.upsert({
    where: { username: 'diana' },
    update: {},
    create: {
      email: 'diana@example.com',
      username: 'diana',
      password: hashedPassword,
      name: 'Diana Prince',
      avatar: null
    }
  })

  const user6 = await prisma.user.upsert({
    where: { username: 'eve' },
    update: {},
    create: {
      email: 'eve@example.com',
      username: 'eve',
      password: hashedPassword,
      name: 'Eve Wilson',
      avatar: null
    }
  })

  const user7 = await prisma.user.upsert({
    where: { username: 'frank' },
    update: {},
    create: {
      email: 'frank@example.com',
      username: 'frank',
      password: hashedPassword,
      name: 'Frank Miller',
      avatar: null
    }
  })

  const user8 = await prisma.user.upsert({
    where: { username: 'grace' },
    update: {},
    create: {
      email: 'grace@example.com',
      username: 'grace',
      password: hashedPassword,
      name: 'Grace Lee',
      avatar: null
    }
  })

  console.log('✅ Created test users')

  // Create a test group using upsert
  const group = await prisma.group.upsert({
    where: { inviteCode: 'BOOKCLUB123' },
    update: {},
    create: {
      name: 'Book Club Adventures',
      description: 'A group for passionate readers who want to tackle great books together!',
      ownerId: user1.id,
      inviteCode: 'BOOKCLUB123'
    }
  })

  // Add the owner to the group members table first
  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: user1.id,
        groupId: group.id
      }
    },
    update: {},
    create: {
      userId: user1.id,
      groupId: group.id,
      role: 'Owner'
    }
  })

  // Add members to the group using upsert
  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: user2.id,
        groupId: group.id
      }
    },
    update: {},
    create: {
      userId: user2.id,
      groupId: group.id,
      role: 'Member'
    }
  })

  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: user3.id,
        groupId: group.id
      }
    },
    update: {},
    create: {
      userId: user3.id,
      groupId: group.id,
      role: 'Admin'  // Make one user an admin for testing
    }
  })

  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: user4.id,
        groupId: group.id
      }
    },
    update: {},
    create: {
      userId: user4.id,
      groupId: group.id,
      role: 'Member'
    }
  })

  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: user5.id,
        groupId: group.id
      }
    },
    update: {},
    create: {
      userId: user5.id,
      groupId: group.id,
      role: 'Admin'  // Make Diana an admin too
    }
  })

  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: user6.id,
        groupId: group.id
      }
    },
    update: {},
    create: {
      userId: user6.id,
      groupId: group.id,
      role: 'Member'
    }
  })

  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: user7.id,
        groupId: group.id
      }
    },
    update: {},
    create: {
      userId: user7.id,
      groupId: group.id,
      role: 'Member'
    }
  })

  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: user8.id,
        groupId: group.id
      }
    },
    update: {},
    create: {
      userId: user8.id,
      groupId: group.id,
      role: 'Member'
    }
  })

  console.log('✅ Created test group with members')

  // Create some personal habits for testing (delete any existing ones first to prevent duplicates)
  await prisma.habit.deleteMany({
    where: {
      userId: user1.id,
      name: {
        in: ['Morning Exercise', 'Reading 20 Pages']
      }
    }
  })

  await prisma.habit.create({
    data: {
      name: 'Morning Exercise',
      description: 'Start the day with 30 minutes of exercise',
      color: '#10B981',
      frequency: 'daily',
      target: 30,
      unit: 'minutes',
      userId: user1.id
    }
  })

  await prisma.habit.create({
    data: {
      name: 'Reading 20 Pages',
      description: 'Read at least 20 pages of a book daily',
      color: '#3B82F6',
      frequency: 'daily',
      target: 20,
      unit: 'pages',
      userId: user1.id
    }
  })

  console.log('✅ Created personal habits')

  // Create shared group habits for the Book Club using upsert
  const sharedHabit1 = await prisma.sharedGroupHabit.upsert({
    where: {
      groupId_name: {
        groupId: group.id,
        name: 'Book Club Reading'
      }
    },
    update: {},
    create: {
      name: 'Book Club Reading',
      description: 'Read the monthly book club selection for at least 30 minutes',
      color: '#8B5CF6',
      frequency: 'daily',
      target: 30,
      unit: 'minutes',
      isActive: true,
      groupId: group.id,
      createdById: user1.id
    }
  })

  const sharedHabit2 = await prisma.sharedGroupHabit.upsert({
    where: {
      groupId_name: {
        groupId: group.id,
        name: 'Book Discussion Notes'
      }
    },
    update: {},
    create: {
      name: 'Book Discussion Notes',
      description: 'Write reflection notes about your reading',
      color: '#F59E0B',
      frequency: 'daily',
      target: 1,
      unit: 'entry',
      isActive: true,
      groupId: group.id,
      createdById: user1.id
    }
  })

  console.log('✅ Created shared group habits: Book Club Reading & Discussion Notes')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Test Account Details:')
  console.log('Email: david@io')
  console.log('Password: david')
  console.log('\n📚 Test Group: "Book Club Adventures"')
  console.log('Invite Code: BOOKCLUB123')
  console.log('\n👥 Group Members (8 total):')
  console.log('- David (Owner)')
  console.log('- Alice (Member)')
  console.log('- Bob (Admin)')
  console.log('- Charlie (Member)')
  console.log('- Diana (Admin)')
  console.log('- Eve (Member)')
  console.log('- Frank (Member)')
  console.log('- Grace (Member)')
  console.log('\n📖 Shared Habits (2 total):')
  console.log('- Book Club Reading (30 min daily)')
  console.log('- Book Discussion Notes (1 entry daily)')
  console.log('\n🎯 Features to test:')
  console.log('- Test admin role management with multiple admins')
  console.log('- Create new shared group habits')
  console.log('- Click on spreadsheet cells to mark progress')
  console.log('- View group progress over time with 8 members')
  console.log('- Test member list pagination and sorting')
  console.log('\n💡 Note: Run "npx tsx prisma/seed-badges.ts" to seed production badges')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
