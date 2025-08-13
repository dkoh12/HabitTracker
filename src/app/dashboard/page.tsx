'use client'
import { useState, useCallback } from 'react'
import { Navigation } from '@/components/navigation'
import { HabitCalendar } from '@/components/habit-calendar'
import { HabitSpreadsheet } from '@/components/habit-spreadsheet'
import { HabitForm } from '@/components/habit-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HabitWithEntries, HabitFormData } from '@/types'
import { Plus, Star, TrendingUp, Target, Activity } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useAuthValidation } from '@/hooks/useAuthValidation'
export default function Dashboard() {
  const [habits, setHabits] = useState<HabitWithEntries[]>([])
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedHabitDetails, setSelectedHabitDetails] = useState<HabitWithEntries | null>(null)
  const fetchHabits = useCallback(async () => {
    console.log('🔄 fetchHabits called')
    try {
      const response = await fetch('/api/habits')
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Habits fetched:', data.length, 'habits')
        setHabits(data)
      } else if (response.status === 401) {
        // Session is invalid (user no longer exists in database)
        console.log('Session invalid, logging out user')
        await signOut({ callbackUrl: '/auth/signin' })
        return
      } else {
        console.error('❌ fetchHabits error:', response.status)
      }
    } catch (error) {
      console.error('💥 Error fetching habits:', error)
      // The auth validation hook will handle session validation errors
    } finally {
      setLoading(false)
    }
  }, [])
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
  const updateHabitEntry = async (habitId: string, date: string, value: number) => {
    console.log('🚀 updateHabitEntry called:', { habitId, date, value })
    try {
      const response = await fetch('/api/habit-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ habitId, date, value })
      })
      console.log('📡 API response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('📊 API response data:', result)
        
        // Refresh habits data to update UI
        await fetchHabits()
        
        // Force a small delay to ensure React re-renders
        await new Promise(resolve => setTimeout(resolve, 50))
      } else {
        const error = await response.text()
        console.error('❌ API error:', response.status, error)
      }
    } catch (error) {
      console.error('💥 updateHabitEntry error:', error)
    }
    
    console.log('✅ Entry updated successfully!')
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
    
    // Calculate streaks
    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0
    
    // Sort entries by date to calculate streaks
    const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Calculate current streak (from today backwards)
    const today = new Date()
    let checkDate = new Date(today)
    
    while (checkDate >= new Date(sortedEntries[0]?.date || today)) {
      const dateStr = checkDate.toISOString().split('T')[0]
      const entry = sortedEntries.find(e => e.date.toString().split('T')[0] === dateStr)
      
      if (entry && entry.value > 0) {
        currentStreak++
      } else {
        break
      }
      
      checkDate.setDate(checkDate.getDate() - 1)
    }
    
    // Calculate best streak
    sortedEntries.forEach(entry => {
      if (entry.value > 0) {
        tempStreak++
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak
        }
      } else {
        tempStreak = 0
      }
    })
    
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
  // Don't show loading screen for session loading - let page render immediately
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
            }}>Dashboard</h1>
            <p style={{
              color: '#6b7280',
              fontSize: '1.1rem'
            }}>Track your daily habits and build consistency</p>
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
              onSubmit={createHabit}
              onCancel={() => setShowHabitForm(false)}
            />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <HabitCalendar
            habits={habits}
            onUpdateEntry={updateHabitEntry}
          />
          <HabitSpreadsheet
            key={JSON.stringify(habits.map(h => ({ id: h.id, entries: h.habitEntries.length })))}
            habits={habits}
            onUpdateEntry={updateHabitEntry}
          />
          {habits.length > 0 && (
            <Card style={{
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
            }}>
              <CardHeader style={{
                padding: '1.5rem',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <CardTitle style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Your Habits Overview</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: '1.5rem' }}>
                <div style={{
                  display: 'grid',
                  gap: '1rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                }}>
                  {habits.map(habit => (
                    <div
                      key={habit.id}
                      onClick={() => setSelectedHabitDetails(habit)}
                      style={{
                        padding: '1.25rem',
                        border: '2px solid #f3f4f6',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.75rem'
                      }}>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: habit.color,
                            boxShadow: `0 0 0 3px ${habit.color}20`
                          }}
                        />
                        <h3 style={{
                          fontWeight: '600',
                          fontSize: '1.1rem',
                          color: '#1f2937'
                        }}>{habit.name}</h3>
                      </div>
                      {habit.description && (
                        <p style={{
                          fontSize: '0.9rem',
                          color: '#6b7280',
                          marginBottom: '0.75rem',
                          lineHeight: '1.4'
                        }}>
                          {habit.description}
                        </p>
                      )}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                          borderRadius: '20px',
                          color: '#2563eb',
                          textTransform: 'capitalize'
                        }}>{habit.frequency}</span>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                          borderRadius: '20px',
                          color: '#059669'
                        }}>Target: {habit.target}{habit.unit && ` ${habit.unit}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
