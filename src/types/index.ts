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
  target: number
  unit?: string
  startDate: string
  endDate: string
  hasEndDate: boolean
  scheduleType: 'weekly' | 'monthly' | 'custom'
  selectedDays: string[]
  monthlyType: 'date' | 'weekday'
  monthlyDate: number
  monthlyWeekday: string
  monthlyWeek: 'first' | 'second' | 'third' | 'fourth' | 'last'
  customInterval: number
  customUnit: 'days' | 'weeks' | 'months'
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
