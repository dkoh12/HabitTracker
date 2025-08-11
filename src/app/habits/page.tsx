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
  const [editingHabit, setEditingHabit] = useState<HabitWithEntries | null>(null)
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

  const updateHabit = async (habitData: HabitFormData) => {
    if (!editingHabit) return
    
    try {
      const response = await fetch(`/api/habits/${editingHabit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(habitData)
      })

      if (response.ok) {
        setEditingHabit(null)
        setShowHabitForm(false)
        fetchHabits()
      }
    } catch (error) {
      console.error('Error updating habit:', error)
    }
  }

  const deleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchHabits()
      }
    } catch (error) {
      console.error('Error deleting habit:', error)
    }
  }

  const handleEditHabit = (habit: HabitWithEntries) => {
    setEditingHabit(habit)
    setShowHabitForm(true)
  }

  const handleCancelEdit = () => {
    setEditingHabit(null)
    setShowHabitForm(false)
  }

  const handleFormSubmit = (habitData: HabitFormData) => {
    if (editingHabit) {
      updateHabit(habitData)
    } else {
      createHabit(habitData)
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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ 
            marginTop: '1rem', 
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: '500'
          }}>Loading your habits...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Navigation />
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}>My Habits</h1>
            <p style={{
              color: '#6b7280',
              fontSize: '1.1rem'
            }}>Manage and track your habits</p>
          </div>
          <Button onClick={() => setShowHabitForm(true)} style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease'
          }}>
            <Plus className="w-4 h-4" />
            New Habit
          </Button>
        </div>

        {showHabitForm && (
          <div style={{ marginBottom: '2rem' }}>
            <HabitForm
              onSubmit={handleFormSubmit}
              onCancel={handleCancelEdit}
              habit={editingHabit || undefined}
              isEditing={!!editingHabit}
            />
          </div>
        )}

        <div style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))'
        }}>
          {habits.map(habit => {
            const { currentStreak, bestStreak, totalEntries } = getStreakInfo(habit)
            
            return (
              <Card key={habit.id} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '0',
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                overflow: 'hidden'
              }}>
                <CardHeader style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <CardTitle style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: habit.color,
                          boxShadow: `0 0 0 3px ${habit.color}20`
                        }}
                      />
                      <span>{habit.name}</span>
                    </CardTitle>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEditHabit(habit)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#6b7280',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f3f4f6'
                          e.currentTarget.style.color = '#374151'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#6b7280'
                        }}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => deleteHabit(habit.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#6b7280',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fef2f2'
                          e.currentTarget.style.color = '#dc2626'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#6b7280'
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent style={{ padding: '1.5rem' }}>
                  {habit.description && (
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#6b7280',
                      marginBottom: '1.5rem',
                      lineHeight: '1.5'
                    }}>{habit.description}</p>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      fontSize: '0.9rem'
                    }}>
                      <div>
                        <span style={{ color: '#6b7280', fontWeight: '500' }}>Frequency:</span>
                        <p style={{
                          fontWeight: '600',
                          textTransform: 'capitalize',
                          color: '#1f2937',
                          margin: '0.25rem 0 0 0'
                        }}>{habit.frequency}</p>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280', fontWeight: '500' }}>Target:</span>
                        <p style={{
                          fontWeight: '600',
                          color: '#1f2937',
                          margin: '0.25rem 0 0 0'
                        }}>{habit.target}{habit.unit && ` ${habit.unit}`}</p>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '1rem',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        padding: '1rem',
                        borderRadius: '12px'
                      }}>
                        <div style={{
                          fontSize: '1.75rem',
                          fontWeight: 'bold',
                          color: '#2563eb'
                        }}>{currentStreak}</div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#2563eb',
                          fontWeight: '500'
                        }}>Current Streak</div>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                        padding: '1rem',
                        borderRadius: '12px'
                      }}>
                        <div style={{
                          fontSize: '1.75rem',
                          fontWeight: 'bold',
                          color: '#059669'
                        }}>{bestStreak}</div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#059669',
                          fontWeight: '500'
                        }}>Best Streak</div>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, #fae8ff 0%, #f3e8ff 100%)',
                        padding: '1rem',
                        borderRadius: '12px'
                      }}>
                        <div style={{
                          fontSize: '1.75rem',
                          fontWeight: 'bold',
                          color: '#7c3aed'
                        }}>{totalEntries}</div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#7c3aed',
                          fontWeight: '500'
                        }}>Total Days</div>
                      </div>
                    </div>

                    <div style={{
                      paddingTop: '1rem',
                      borderTop: '1px solid #f3f4f6'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.9rem'
                      }}>
                        <span style={{ color: '#6b7280', fontWeight: '500' }}>Last 7 days</span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
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
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '3px',
                                  backgroundColor: entry && entry.value > 0 
                                    ? '#10b981' 
                                    : '#e5e7eb',
                                  boxShadow: entry && entry.value > 0 
                                    ? '0 0 0 2px rgba(16, 185, 129, 0.2)' 
                                    : 'none'
                                }}
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
          <Card style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent style={{
              textAlign: 'center',
              padding: '3rem 2rem'
            }}>
              <Calendar style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 1.5rem auto',
                color: '#9ca3af'
              }} />
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#1f2937'
              }}>No habits yet</h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '2rem',
                fontSize: '1.1rem',
                lineHeight: '1.6'
              }}>
                Create your first habit to start building consistency!
              </p>
              <Button onClick={() => setShowHabitForm(true)} style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease'
              }}>
                <Plus className="w-4 h-4" />
                Create Your First Habit
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
