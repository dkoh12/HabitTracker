import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/withAuth'
import { prisma } from '@/lib/prisma'

export const DELETE = withAuth(async (request, { user }) => {
  try {
    // Start a transaction to ensure all related data is deleted
    await prisma.$transaction(async (tx) => {
      // Delete user's habit entries first (foreign key constraints)
      await tx.habitEntry.deleteMany({
        where: {
          habit: {
            userId: user.id
          }
        }
      })

      // Delete user's habits
      await tx.habit.deleteMany({
        where: { userId: user.id }
      })

      // Delete group memberships
      await tx.groupMember.deleteMany({
        where: { userId: user.id }
      })

      // Delete groups where user is the only member or owner
      const userGroups = await tx.group.findMany({
        where: {
          members: {
            some: { userId: user.id }
          }
        },
        include: {
          members: true
        }
      })

      for (const group of userGroups) {
        if (group.members.length === 1) {
          // Delete shared habit entries for this group
          await tx.sharedGroupHabitEntry.deleteMany({
            where: {
              sharedHabit: {
                groupId: group.id
              }
            }
          })

          // Delete shared habits for this group
          await tx.sharedGroupHabit.deleteMany({
            where: { groupId: group.id }
          })

          // Delete the group
          await tx.group.delete({
            where: { id: group.id }
          })
        }
      }

      // Delete shared habit entries for remaining groups
      await tx.sharedGroupHabitEntry.deleteMany({
        where: { userId: user.id }
      })

      // Finally, delete the user
      await tx.user.delete({
        where: { id: user.id }
      })
    })

    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
})
