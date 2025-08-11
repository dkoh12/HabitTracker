'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { HabitForm } from '@/components/habit-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HabitWithEntries, HabitFormData } from '@/types'
import { Plus, Edit3, Trash2, Calendar } from 'lucide-react'

export default function Habits() {
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

  const getStreakInfo = (habit: HabitWithEntries) => {
    const entries = habit.habitEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0
    
    // Calculate current streak from today backwards
    const today = new Date()
    let checkDate = new Date(today)
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const dateStr = checkDate.toISOString().split('T')[0]
      const entry = entries.find(e => e.date.toString().split('T')[0] === dateStr)
      
      if (entry && entry.value > 0) {
        if (i === 0 || currentStreak > 0) { // First day or continuing streak
          currentStreak++
        }
        tempStreak++
      } else {
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak
        }
        tempStreak = 0
        if (i === 0) currentStreak = 0 // Break current streak if today is missed
      }
      
      checkDate.setDate(checkDate.getDate() - 1)
    }
    
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak
    }
    
    return { currentStreak, bestStreak, totalEntries: entries.length }
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
            <h1 className="text-3xl font-bold">My Habits</h1>
            <p className="text-muted-foreground">Manage and track your habits</p>
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {habits.map(habit => {
            const { currentStreak, bestStreak, totalEntries } = getStreakInfo(habit)
            
            return (
              <Card key={habit.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      />
                      <span>{habit.name}</span>
                    </CardTitle>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {habit.description && (
                    <p className="text-sm text-muted-foreground mb-4">{habit.description}</p>
                  )}
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Frequency:</span>
                        <p className="font-medium capitalize">{habit.frequency}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target:</span>
                        <p className="font-medium">{habit.target}{habit.unit && ` ${habit.unit}`}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{currentStreak}</div>
                        <div className="text-xs text-blue-600">Current Streak</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{bestStreak}</div>
                        <div className="text-xs text-green-600">Best Streak</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{totalEntries}</div>
                        <div className="text-xs text-purple-600">Total Days</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last 7 days</span>
                        <div className="flex space-x-1">
                          {Array.from({ length: 7 }).map((_, i) => {
                            const date = new Date()
                            date.setDate(date.getDate() - (6 - i))
                            const dateStr = date.toISOString().split('T')[0]
                            const entry = habit.habitEntries.find(e => 
                              e.date.toString().split('T')[0] === dateStr
                            )
                            
                            return (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-sm ${
                                  entry && entry.value > 0 
                                    ? 'bg-green-400' 
                                    : 'bg-gray-200'
                                }`}
                                title={`${date.toLocaleDateString()}: ${entry?.value || 0}`}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {habits.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No habits yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first habit to start building consistency!
              </p>
              <Button onClick={() => setShowHabitForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Habit
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
