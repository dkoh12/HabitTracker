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
                      style={{
                        padding: '1.25rem',
                        border: '2px solid #f3f4f6',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
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
          
          {/* Habit Statistics Section */}
          {habits.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              borderRadius: '24px',
              padding: '3rem',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '3rem'
              }}>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '1rem'
                }}>Your Progress Analytics</h2>
                <p style={{
                  fontSize: '1.1rem',
                  color: '#64748b',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  Track your habit journey with detailed insights and visual progress indicators
                </p>
              </div>

              {habits.map((habit, habitIndex) => {
                const stats = getDetailedHabitStats(habit)
                return (
                  <div
                    key={habit.id}
                    style={{
                      marginBottom: habitIndex === habits.length - 1 ? '0' : '4rem',
                      padding: '2.5rem',
                      background: 'white',
                      borderRadius: '20px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                      border: `2px solid ${habit.color}15`
                    }}
                  >
                    {/* Habit Header with Key Metrics */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '2.5rem',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: habit.color,
                            boxShadow: `0 0 0 6px ${habit.color}20`
                          }}
                        />
                        <div>
                          <h3 style={{
                            fontWeight: '700',
                            fontSize: '1.8rem',
                            color: '#1f2937',
                            margin: 0,
                            marginBottom: '0.25rem'
                          }}>{habit.name}</h3>
                          {habit.description && (
                            <p style={{
                              color: '#6b7280',
                              fontSize: '1rem',
                              margin: 0
                            }}>{habit.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center'
                      }}>
                        {Array.from({ length: Math.min(stats.successfulDays, 10) }).map((_, i) => (
                          <Star key={i} className="w-5 h-5" style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                        ))}
                        {stats.successfulDays > 10 && (
                          <span style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: '#fbbf24',
                            marginLeft: '0.5rem'
                          }}>+{stats.successfulDays - 10}</span>
                        )}
                      </div>
                    </div>

                    {/* Key Metrics Row */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '1.5rem',
                      marginBottom: '3rem'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        background: `linear-gradient(135deg, ${habit.color}10 0%, ${habit.color}05 100%)`,
                        borderRadius: '16px',
                        border: `1px solid ${habit.color}20`
                      }}>
                        <div style={{
                          fontSize: '2.5rem',
                          fontWeight: '900',
                          color: habit.color,
                          marginBottom: '0.5rem'
                        }}>{stats.successfulDays}</div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#6b7280',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Successful Days</div>
                      </div>
                      
                      <div style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #10b98110 0%, #10b98105 100%)',
                        borderRadius: '16px',
                        border: '1px solid #10b98120'
                      }}>
                        <div style={{
                          fontSize: '2.5rem',
                          fontWeight: '900',
                          color: '#10b981',
                          marginBottom: '0.5rem'
                        }}>{stats.successRate}%</div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#6b7280',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Success Rate</div>
                      </div>
                      
                      <div style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #3b82f610 0%, #3b82f605 100%)',
                        borderRadius: '16px',
                        border: '1px solid #3b82f620'
                      }}>
                        <div style={{
                          fontSize: '2.5rem',
                          fontWeight: '900',
                          color: '#3b82f6',
                          marginBottom: '0.5rem'
                        }}>{stats.currentStreak}</div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#6b7280',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Current Streak</div>
                      </div>
                      
                      <div style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #8b5cf610 0%, #8b5cf605 100%)',
                        borderRadius: '16px',
                        border: '1px solid #8b5cf620'
                      }}>
                        <div style={{
                          fontSize: '2.5rem',
                          fontWeight: '900',
                          color: '#8b5cf6',
                          marginBottom: '0.5rem'
                        }}>{stats.bestStreak}</div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#6b7280',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Best Streak</div>
                      </div>
                    </div>

                    {/* Progress Chart */}
                    <div style={{
                      marginBottom: '3rem'
                    }}>
                      <h4 style={{
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <TrendingUp className="w-5 h-5" style={{ color: habit.color }} />
                        30-Day Progress Chart
                      </h4>
                      <div style={{
                        background: '#f8fafc',
                        borderRadius: '16px',
                        padding: '2rem',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(7, 1fr)',
                          gap: '0.75rem',
                          marginBottom: '1rem'
                        }}>
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} style={{
                              textAlign: 'center',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              color: '#6b7280',
                              paddingBottom: '0.5rem'
                            }}>{day}</div>
                          ))}
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(7, 1fr)',
                          gap: '0.75rem'
                        }}>
                          {stats.last30Days.map((day, i) => {
                            const isToday = day.date.toDateString() === new Date().toDateString()
                            const intensity = day.value / Math.max(...stats.last30Days.map(d => d.value || 1))
                            return (
                              <div
                                key={i}
                                style={{
                                  aspectRatio: '1',
                                  borderRadius: '12px',
                                  backgroundColor: day.completed 
                                    ? `${habit.color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`
                                    : '#f1f5f9',
                                  border: isToday ? `3px solid ${habit.color}` : '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.8rem',
                                  fontWeight: '700',
                                  color: day.completed ? 'white' : '#94a3b8',
                                  position: 'relative',
                                  transition: 'all 0.2s ease',
                                  cursor: 'pointer'
                                }}
                                title={`${day.date.toLocaleDateString()}: ${day.completed ? `Completed (${day.value})` : 'Not completed'}`}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.1)'
                                  e.currentTarget.style.zIndex = '10'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)'
                                  e.currentTarget.style.zIndex = '1'
                                }}
                              >
                                {day.date.getDate()}
                                {day.completed && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '2px',
                                    right: '2px',
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: '#fbbf24',
                                    border: '1px solid white'
                                  }} />
                                )}
                              </div>
                            )
                          })}
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '2rem',
                          marginTop: '1.5rem',
                          fontSize: '0.9rem',
                          color: '#6b7280'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '4px',
                              backgroundColor: habit.color
                            }} />
                            Completed
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '4px',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #e2e8f0'
                            }} />
                            Missed
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: '#fbbf24'
                            }} />
                            Today
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Weekly Progress Bar */}
                    <div>
                      <h4 style={{
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <Target className="w-5 h-5" style={{ color: habit.color }} />
                        Weekly Consistency
                      </h4>
                      <div style={{
                        background: '#f8fafc',
                        borderRadius: '16px',
                        padding: '2rem',
                        border: '1px solid #e2e8f0'
                      }}>
                        {/* Week progress bars for last 4 weeks */}
                        {Array.from({ length: 4 }).map((_, weekIndex) => {
                          const weekStart = new Date()
                          weekStart.setDate(weekStart.getDate() - (weekIndex * 7) - 6)
                          const weekDays = Array.from({ length: 7 }).map((_, dayIndex) => {
                            const date = new Date(weekStart)
                            date.setDate(date.getDate() + dayIndex)
                            const dateStr = date.toISOString().split('T')[0]
                            const entry = habit.habitEntries.find(e => e.date.toString().split('T')[0] === dateStr)
                            return { date, completed: (entry?.value || 0) > 0 }
                          })
                          const weekCompletion = weekDays.filter(d => d.completed).length
                          const completionRate = (weekCompletion / 7) * 100

                          return (
                            <div key={weekIndex} style={{
                              marginBottom: weekIndex === 3 ? '0' : '1.5rem'
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.75rem'
                              }}>
                                <span style={{
                                  fontSize: '0.9rem',
                                  fontWeight: '600',
                                  color: '#6b7280'
                                }}>
                                  Week of {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <span style={{
                                  fontSize: '0.9rem',
                                  fontWeight: '700',
                                  color: completionRate >= 70 ? '#10b981' : completionRate >= 40 ? '#f59e0b' : '#ef4444'
                                }}>
                                  {weekCompletion}/7 days ({Math.round(completionRate)}%)
                                </span>
                              </div>
                              <div style={{
                                width: '100%',
                                height: '12px',
                                backgroundColor: '#e5e7eb',
                                borderRadius: '6px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${completionRate}%`,
                                  height: '100%',
                                  background: `linear-gradient(90deg, ${habit.color} 0%, ${habit.color}dd 100%)`,
                                  borderRadius: '6px',
                                  transition: 'width 0.8s ease'
                                }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
