import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create test users
  const hashedPassword = await bcrypt.hash('david', 10)
  
  const user1 = await prisma.user.create({
    data: {
      email: 'david@io',
      username: 'david',
      password: hashedPassword,
      name: 'David',
      avatar: null
    }
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      username: 'alice',
      password: hashedPassword,
      name: 'Alice Johnson',
      avatar: null
    }
  })

  const user3 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      username: 'bob',
      password: hashedPassword,
      name: 'Bob Smith',
      avatar: null
    }
  })

  console.log('✅ Created test users')

  // Create a test group
  const group = await prisma.group.create({
    data: {
      name: 'Book Club Adventures',
      description: 'A group for passionate readers who want to tackle great books together!',
      ownerId: user1.id,
      inviteCode: 'BOOKCLUB123'
    }
  })

  // Add members to the group
  await prisma.groupMember.create({
    data: {
      userId: user2.id,
      groupId: group.id,
      role: 'member'
    }
  })

  await prisma.groupMember.create({
    data: {
      userId: user3.id,
      groupId: group.id,
      role: 'member'
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

  await prisma.habit.create({
    data: {
      name: 'Read Personal Books',
      description: 'Read books for personal development',
      color: '#3B82F6',
      frequency: 'daily',
      target: 20,
      unit: 'pages',
      userId: user1.id
    }
  })

  console.log('✅ Created sample personal habits')

  // Create a shared group habit
  const sharedHabit = await prisma.sharedGroupHabit.create({
    data: {
      name: 'Read "The Great Gatsby"',
      description: 'Our book club is reading The Great Gatsby together. Let\'s track our daily reading progress!',
      color: '#8B5CF6',
      frequency: 'daily',
      target: 15,
      unit: 'pages',
      groupId: group.id,
      createdById: user1.id
    }
  })

  console.log('✅ Created shared group habit')

  // Add some sample entries for the shared habit
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const twoDaysAgo = new Date(today)
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  // User 1 entries
  await prisma.sharedGroupHabitEntry.create({
    data: {
      userId: user1.id,
      sharedHabitId: sharedHabit.id,
      date: yesterday,
      value: 15,
      completed: true
    }
  })

  await prisma.sharedGroupHabitEntry.create({
    data: {
      userId: user1.id,
      sharedHabitId: sharedHabit.id,
      date: twoDaysAgo,
      value: 20,
      completed: true
    }
  })

  // User 2 entries
  await prisma.sharedGroupHabitEntry.create({
    data: {
      userId: user2.id,
      sharedHabitId: sharedHabit.id,
      date: yesterday,
      value: 10,
      completed: false
    }
  })

  // User 3 entries
  await prisma.sharedGroupHabitEntry.create({
    data: {
      userId: user3.id,
      sharedHabitId: sharedHabit.id,
      date: yesterday,
      value: 15,
      completed: true
    }
  })

  await prisma.sharedGroupHabitEntry.create({
    data: {
      userId: user3.id,
      sharedHabitId: sharedHabit.id,
      date: twoDaysAgo,
      value: 12,
      completed: false
    }
  })

  console.log('✅ Created sample progress entries')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Test Account Details:')
  console.log('Email: david@io')
  console.log('Password: david')
  console.log('\n📚 Test Group: "Book Club Adventures"')
  console.log('Invite Code: BOOKCLUB123')
  console.log('\n🎯 Features to test:')
  console.log('- Join the group with other test accounts')
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
