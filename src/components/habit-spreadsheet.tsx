'use client'

import { useState, useEffect } from 'react'
import { format, subDays, addDays, startOfDay } from 'date-fns'
import { HabitWithEntries } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react'

interface HabitSpreadsheetProps {
  habits: HabitWithEntries[]
  onUpdateEntry: (habitId: string, date: string, value: number) => void
}

export function HabitSpreadsheet({ habits, onUpdateEntry }: HabitSpreadsheetProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [days, setDays] = useState<Date[]>([])

  useEffect(() => {
    // Generate 14 days around current date
    const dayList = []
    for (let i = -7; i <= 6; i++) {
      dayList.push(addDays(currentDate, i))
    }
    setDays(dayList)
  }, [currentDate])

  const getEntryValue = (habitId: string, date: Date) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return 0

    const entry = habit.habitEntries.find(
      e => format(new Date(e.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
    return entry?.value || 0
  }

  const handleCellClick = (habitId: string, date: Date, currentValue: number) => {
    const newValue = currentValue > 0 ? 0 : 1
    onUpdateEntry(habitId, format(date, 'yyyy-MM-dd'), newValue)
  }

  const handleValueChange = (habitId: string, date: Date, increment: boolean) => {
    const currentValue = getEntryValue(habitId, date)
    const newValue = increment ? currentValue + 1 : Math.max(0, currentValue - 1)
    onUpdateEntry(habitId, format(date, 'yyyy-MM-dd'), newValue)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Habit Tracking</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subDays(currentDate, 7))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(days[0] || new Date(), 'MMM d')} - {format(days[days.length - 1] || new Date(), 'MMM d, yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 border-b font-medium">Habit</th>
                {days.map(day => (
                  <th key={day.toISOString()} className="text-center p-2 border-b font-medium min-w-[80px]">
                    <div className="text-xs text-muted-foreground">
                      {format(day, 'EEE')}
                    </div>
                    <div className="text-sm">
                      {format(day, 'd')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => (
                <tr key={habit.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      />
                      <span className="font-medium">{habit.name}</span>
                      {habit.unit && (
                        <span className="text-xs text-muted-foreground">({habit.unit})</span>
                      )}
                    </div>
                  </td>
                  {days.map(day => {
                    const value = getEntryValue(habit.id, day)
                    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    const isFuture = day > new Date()

                    return (
                      <td key={day.toISOString()} className="p-1 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {!isFuture && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleValueChange(habit.id, day, false)}
                                disabled={value <= 0}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <div
                                className={`
                                  w-8 h-8 rounded-md border flex items-center justify-center cursor-pointer text-sm font-medium transition-colors
                                  ${value > 0 
                                    ? 'bg-green-100 border-green-300 text-green-800' 
                                    : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                                  }
                                  ${isToday ? 'ring-2 ring-blue-200' : ''}
                                `}
                                onClick={() => handleCellClick(habit.id, day, value)}
                              >
                                {value > 0 ? value : ''}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleValueChange(habit.id, day, true)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          {isFuture && (
                            <div className="w-8 h-8 rounded-md border border-gray-100 bg-gray-50" />
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {habits.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No habits yet. Create your first habit to start tracking!
          </div>
        )}
      </CardContent>
    </Card>
  )
}
