import { User, Habit, HabitEntry, Group, GroupMember } from '@prisma/client'

export type UserWithRelations = User & {
  habits: Habit[]
  habitEntries: HabitEntry[]
  groupMembers: (GroupMember & {
    group: Group
  })[]
}

export type HabitWithEntries = Habit & {
  habitEntries: HabitEntry[]
  user: User
}

export type GroupWithMembers = Group & {
  members: (GroupMember & {
    user: User
  })[]
  owner: User
  groupHabits: ({
    habit: Habit & {
      user: User
    }
  })[]
}

export interface HabitFormData {
  name: string
  description?: string
  color?: string
  frequency: 'daily' | 'weekly' | 'monthly'
  target: number
  unit?: string
}

export interface HabitEntryData {
  date: string
  value: number
  notes?: string
}

export interface GroupFormData {
  name: string
  description?: string
}

export interface SpreadsheetCell {
  date: string
  value: number
  habitId: string
  userId: string
  notes?: string
}
