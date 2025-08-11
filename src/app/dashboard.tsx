'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { HabitSpreadsheet } from '@/components/habit-spreadsheet'
import { HabitForm } from '@/components/habit-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HabitWithEntries, HabitFormData } from '@/types'
import { Plus } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [habits, setHabits] = useState<HabitWithEntries[]>([])
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchHabits()
  }, [session, status, router])

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits')
      if (response.ok) {
        const data = await response.json()
        setHabits(data)
      }
    } catch (error) {
      console.error('Error fetching habits:', error)
    } finally {
      setLoading(false)
    }
  }

  const createHabit = async (habitData: HabitFormData) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(habitData)
      })

      if (response.ok) {
        setShowHabitForm(false)
        fetchHabits()
      }
    } catch (error) {
      console.error('Error creating habit:', error)
    }
  }

  const updateHabitEntry = async (habitId: string, date: string, value: number) => {
    try {
      const response = await fetch('/api/habit-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ habitId, date, value })
      })

      if (response.ok) {
        fetchHabits()
      }
    } catch (error) {
      console.error('Error updating habit entry:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Track your daily habits and build consistency</p>
          </div>
          <Button onClick={() => setShowHabitForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Habit
          </Button>
        </div>

        {showHabitForm && (
          <div className="mb-8">
            <HabitForm
              onSubmit={createHabit}
              onCancel={() => setShowHabitForm(false)}
            />
          </div>
        )}

        <div className="space-y-8">
          <HabitSpreadsheet
            habits={habits}
            onUpdateEntry={updateHabitEntry}
          />

          {habits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Habits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {habits.map(habit => (
                    <div
                      key={habit.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: habit.color }}
                        />
                        <h3 className="font-medium">{habit.name}</h3>
                      </div>
                      {habit.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {habit.description}
                        </p>
                      )}
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{habit.frequency}</span>
                        <span>Target: {habit.target}{habit.unit && ` ${habit.unit}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
