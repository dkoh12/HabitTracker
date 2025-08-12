const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupDuplicates() {
  console.log('Starting duplicate cleanup...')
  
  // Find all shared group habit entries
  const allEntries = await prisma.sharedGroupHabitEntry.findMany({
    orderBy: [
      { userId: 'asc' },
      { sharedHabitId: 'asc' },
      { date: 'asc' },
      { createdAt: 'asc' }
    ]
  })
  
  console.log(`Found ${allEntries.length} total entries`)
  
  // Show all entries
  allEntries.forEach((entry, index) => {
    console.log(`Entry ${index + 1}: ${entry.id}`)
    console.log(`  User: ${entry.userId}`)
    console.log(`  Habit: ${entry.sharedHabitId}`)
    console.log(`  Date: ${entry.date.toISOString().split('T')[0]}`)
    console.log(`  Value: ${entry.value}, Completed: ${entry.completed}`)
    console.log(`  Created: ${entry.createdAt}`)
    console.log(`  Updated: ${entry.updatedAt}`)
    console.log('---')
  })
  
  // Group by userId + sharedHabitId + date
  const grouped = {}
  for (const entry of allEntries) {
    const key = `${entry.userId}-${entry.sharedHabitId}-${entry.date.toISOString().split('T')[0]}`
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(entry)
  }
  
  // Find and remove duplicates
  let deletedCount = 0
  for (const [key, entries] of Object.entries(grouped)) {
    if (entries.length > 1) {
      console.log(`Found ${entries.length} entries for ${key}`)
      // Keep the most recent entry, delete the others
      entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      const toKeep = entries[0]
      const toDelete = entries.slice(1)
      
      for (const entry of toDelete) {
        console.log(`Deleting duplicate entry: ${entry.id} (created: ${entry.createdAt}, value: ${entry.value})`)
        await prisma.sharedGroupHabitEntry.delete({
          where: { id: entry.id }
        })
        deletedCount++
      }
      console.log(`Keeping entry: ${toKeep.id} (created: ${toKeep.createdAt}, value: ${toKeep.value})`)
    }
  }
  
  console.log(`Cleanup complete. Deleted ${deletedCount} duplicate entries.`)
}

cleanupDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
