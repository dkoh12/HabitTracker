import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function getDateRange(date: Date, frequency: 'daily' | 'weekly' | 'monthly') {
  switch (frequency) {
    case 'daily':
      return { start: startOfDay(date), end: endOfDay(date) }
    case 'weekly':
      return { start: startOfWeek(date), end: endOfWeek(date) }
    case 'monthly':
      return { start: startOfMonth(date), end: endOfMonth(date) }
    default:
      return { start: startOfDay(date), end: endOfDay(date) }
  }
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
