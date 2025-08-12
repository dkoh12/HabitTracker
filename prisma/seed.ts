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

  console.log('✅ Created test group with members')

  // Create some personal habits for testing
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

  console.log('✅ Created personal habit')

  // Create a shared group habit for the Book Club using upsert for consistency
  await prisma.sharedGroupHabit.upsert({
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

  console.log('✅ Created shared group habit: Book Club Reading')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Test Account Details:')
  console.log('Email: david@io')
  console.log('Password: david')
  console.log('\n📚 Test Group: "Book Club Adventures"')
  console.log('Invite Code: BOOKCLUB123')
  console.log('\n👥 Group Members:')
  console.log('- David (Owner)')
  console.log('- Alice (Member)')
  console.log('- Bob (Admin)')
  console.log('\n📖 Shared Habit:')
  console.log('- Book Club Reading (30 min daily)')
  console.log('\n🎯 Features to test:')
  console.log('- Test admin role management')
  console.log('- Create new shared group habits')
  console.log('- Click on spreadsheet cells to mark progress')
  console.log('- View group progress over time')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
