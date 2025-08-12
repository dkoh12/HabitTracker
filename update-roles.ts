import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateRoleEnum() {
  console.log('🔄 Updating role enum values from uppercase to camelCase...')

  try {
    // For SQLite, we need to update the data manually since enum changes are complex
    await prisma.$executeRaw`UPDATE GroupMember SET role = 'Member' WHERE role = 'MEMBER'`
    await prisma.$executeRaw`UPDATE GroupMember SET role = 'Admin' WHERE role = 'ADMIN'`
    
    console.log('✅ Successfully updated role enum values')
    
    // Verify the update
    const memberCount = await prisma.groupMember.count({ where: { role: 'Member' } })
    const adminCount = await prisma.groupMember.count({ where: { role: 'Admin' } })
    
    console.log(`📊 Updated roles: ${memberCount} Members, ${adminCount} Admins`)
    
  } catch (error) {
    console.error('❌ Error updating role enum values:', error)
    throw error
  }
}

updateRoleEnum()
  .catch((e) => {
    console.error('❌ Script failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
