'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useAuthValidation } from '@/hooks/useAuthValidation'
import { Navigation } from '@/components/navigation'
import { HabitForm } from '@/components/habit-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HabitWithEntries, HabitFormData } from '@/types'
import { Plus, Edit3, Trash2, Calendar, Star, TrendingUp, Target, Activity } from 'lucide-react'

export default function Habits() {
  const router = useRouter()
  const [habits, setHabits] = useState<HabitWithEntries[]>([])
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<HabitWithEntries | null>(null)
  const [loading, setLoading] = useState(false) // Start with false - no loading screen
  const [selectedHabitDetails, setSelectedHabitDetails] = useState<HabitWithEntries | null>(null)

  const fetchHabits = useCallback(async () => {
    try {
      const response = await fetch('/api/habits')
      if (response.ok) {
        const data = await response.json()
        setHabits(data)
      }
    } catch (error) {
      console.error('Error fetching habits:', error)
    }
    // No finally block needed - we don't use loading state anymore
  }, [])

  // Use unified auth validation
  const { session, status } = useAuthValidation({
    onValidationSuccess: fetchHabits
  })

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

  const getDetailedHabitStats = (habit: HabitWithEntries) => {
    const entries = habit.habitEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const successfulDays = entries.filter(entry => entry.value > 0).length
    const totalTrackedDays = entries.length
    const missedDays = totalTrackedDays - successfulDays
    const successRate = totalTrackedDays > 0 ? Math.round((successfulDays / totalTrackedDays) * 100) : 0
    
    // Get last 30 days for visualization
    const last30Days = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const entry = entries.find(e => e.date.toString().split('T')[0] === dateStr)
      last30Days.push({
        date: date,
        value: entry?.value || 0,
        completed: (entry?.value || 0) > 0
      })
    }
    
    const { currentStreak, bestStreak } = getStreakInfo(habit)
    
    return {
      successfulDays,
      totalTrackedDays,
      missedDays,
      successRate,
      currentStreak,
      bestStreak,
      last30Days
    }
  }

  const renderDetailedHabitView = () => {
    if (!selectedHabitDetails) return null
    
    const stats = getDetailedHabitStats(selectedHabitDetails)
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={() => setSelectedHabitDetails(null)}>
        <Card style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          border: 'none',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}>
          <CardHeader style={{
            padding: '2rem',
            borderBottom: '1px solid #f3f4f6',
            background: `linear-gradient(135deg, ${selectedHabitDetails.color}10 0%, ${selectedHabitDetails.color}05 100%)`
          }}>
            <CardTitle style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: selectedHabitDetails.color,
                  boxShadow: `0 0 0 4px ${selectedHabitDetails.color}20`
                }}
              />
              <span>{selectedHabitDetails.name}</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {Array.from({ length: Math.min(stats.successfulDays, 10) }).map((_, i) => (
                  <Star key={i} className="w-5 h-5" style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                ))}
                {stats.successfulDays > 10 && (
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#fbbf24',
                    marginLeft: '0.25rem'
                  }}>+{stats.successfulDays - 10}</span>
                )}
              </div>
            </CardTitle>
            {selectedHabitDetails.description && (
              <p style={{
                color: '#6b7280',
                fontSize: '1rem',
                margin: 0
              }}>{selectedHabitDetails.description}</p>
            )}
          </CardHeader>
          
          <CardContent style={{ padding: '2rem' }}>
            {/* Key Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                padding: '1.5rem',
                borderRadius: '16px',
                textAlign: 'center',
                color: 'white'
              }}>
                <Star className="w-8 h-8 mx-auto mb-2" style={{ fill: 'white' }} />
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.successfulDays}</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Successful Days</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                padding: '1.5rem',
                borderRadius: '16px',
                textAlign: 'center',
                color: 'white'
              }}>
                <Activity className="w-8 h-8 mx-auto mb-2" />
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.missedDays}</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Missed Days</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                padding: '1.5rem',
                borderRadius: '16px',
                textAlign: 'center',
                color: 'white'
              }}>
                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.successRate}%</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Success Rate</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                padding: '1.5rem',
                borderRadius: '16px',
                textAlign: 'center',
                color: 'white'
              }}>
                <Target className="w-8 h-8 mx-auto mb-2" />
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.currentStreak}</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Current Streak</div>
              </div>
            </div>
            
            {/* Achievement Stars */}
            <div style={{
              background: 'linear-gradient(135deg, #fbbf2420 0%, #f59e0b10 100%)',
              padding: '1.5rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <Star className="w-6 h-6" style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                Achievement Stars
              </h3>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                {Array.from({ length: stats.successfulDays }).map((_, i) => (
                  <Star key={i} className="w-6 h-6" style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                ))}
              </div>
              <p style={{
                color: '#6b7280',
                fontSize: '0.875rem',
                margin: 0
              }}>
                🎉 You've earned {stats.successfulDays} golden star{stats.successfulDays !== 1 ? 's' : ''} for completing this habit!
              </p>
            </div>
            
            {/* Last 30 Days Visualization */}
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '1rem'
              }}>Last 30 Days</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                {stats.last30Days.map((day, i) => {
                  const isToday = day.date.toDateString() === new Date().toDateString()
                  return (
                    <div
                      key={i}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '8px',
                        backgroundColor: day.completed 
                          ? selectedHabitDetails.color 
                          : '#f3f4f6',
                        border: isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        color: day.completed ? 'white' : '#6b7280',
                        position: 'relative',
                        padding: '4px'
                      }}
                      title={`${day.date.toLocaleDateString()}: ${day.completed ? 'Completed' : 'Not completed'}`}
                    >
                      <div style={{
                        fontSize: '0.6rem',
                        lineHeight: '1',
                        opacity: 0.8
                      }}>
                        {day.date.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        lineHeight: '1',
                        fontWeight: '700'
                      }}>
                        {day.date.getDate()}
                      </div>
                      {day.completed && (
                        <Star className="w-3 h-3" style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          color: '#fbbf24',
                          fill: '#fbbf24'
                        }} />
                      )}
                    </div>
                  )
                })}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '4px',
                    backgroundColor: selectedHabitDetails.color
                  }} />
                  Completed
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '4px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb'
                  }} />
                  Not completed
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Star className="w-3 h-3" style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                  Golden star earned
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Remove loading screen - page renders immediately
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
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedHabitDetails(habit)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)'
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
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditHabit(habit)
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteHabit(habit.id)
                        }}
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
      
      {/* Detailed Habit View Modal */}
      {renderDetailedHabitView()}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
