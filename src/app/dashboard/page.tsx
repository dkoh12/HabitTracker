'use client'
import { useState, useCallback, useEffect } from 'react'
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
  
  // Statistics filtering and comparison state
  const [selectedHabits, setSelectedHabits] = useState<string[]>([])
  const [viewMode, setViewMode] = useState('combined') // 'combined', 'individual', 'comparison'
  const [timeFilter, setTimeFilter] = useState('30') // '7', '30', '90', 'all'
  const [sortBy, setSortBy] = useState('name') // 'name', 'success_rate', 'streak', 'days'
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

  // Update selectedHabits when habits change
  useEffect(() => {
    setSelectedHabits(habits.map(h => h.id))
  }, [habits])
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
          <HabitSpreadsheet
            key={habits.map(h => h.id).join(',')}
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
          
          {/* Enhanced Habit Statistics Section with Filtering and Comparison */}
          {habits.length > 0 && (() => {

            const filteredHabits = habits
              .filter(habit => selectedHabits.includes(habit.id))
              .sort((a, b) => {
                const statsA = getDetailedHabitStats(a)
                const statsB = getDetailedHabitStats(b)
                
                switch (sortBy) {
                  case 'success_rate':
                    return statsB.successRate - statsA.successRate
                  case 'streak':
                    return statsB.currentStreak - statsA.currentStreak
                  case 'days':
                    return statsB.successfulDays - statsA.successfulDays
                  default:
                    return a.name.localeCompare(b.name)
                }
              })

            const allStats = filteredHabits.map(habit => ({ habit, stats: getDetailedHabitStats(habit) }))

            return (
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                borderRadius: '24px',
                padding: '3rem',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
                border: '1px solid #f1f5f9'
              }}>
                {/* Header with Controls */}
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
                  }}>Progress Analytics Dashboard</h2>
                  <p style={{
                    fontSize: '1.1rem',
                    color: '#64748b',
                    maxWidth: '600px',
                    margin: '0 auto 2rem auto'
                  }}>
                    Compare habits, analyze trends, and track your progress with advanced filtering and overlay features
                  </p>

                  {/* Control Panel */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e2e8f0'
                  }}>
                    {/* View Mode Toggle */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#6b7280' }}>View Mode</span>
                      <div style={{
                        display: 'flex',
                        background: '#f3f4f6',
                        borderRadius: '12px',
                        padding: '4px'
                      }}>
                        {[
                          { value: 'combined', label: 'Combined', icon: '📊' },
                          { value: 'individual', label: 'Individual', icon: '📈' },
                          { value: 'comparison', label: 'Compare', icon: '⚖️' }
                        ].map(mode => (
                          <button
                            key={mode.value}
                            onClick={() => setViewMode(mode.value)}
                            style={{
                              padding: '0.75rem 1.25rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: viewMode === mode.value ? 'white' : 'transparent',
                              color: viewMode === mode.value ? '#1f2937' : '#6b7280',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              boxShadow: viewMode === mode.value ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span>{mode.icon}</span>
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Filter */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#6b7280' }}>Time Range</span>
                      <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          background: 'white',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                        <option value="all">All Time</option>
                      </select>
                    </div>

                    {/* Sort Options */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#6b7280' }}>Sort By</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          background: 'white',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="name">Name</option>
                        <option value="success_rate">Success Rate</option>
                        <option value="streak">Current Streak</option>
                        <option value="days">Total Days</option>
                      </select>
                    </div>

                    {/* Habit Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#6b7280' }}>Select Habits</span>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        maxWidth: '300px'
                      }}>
                        {habits.map(habit => (
                          <button
                            key={habit.id}
                            onClick={() => {
                              setSelectedHabits(prev => 
                                prev.includes(habit.id) 
                                  ? prev.filter(id => id !== habit.id)
                                  : [...prev, habit.id]
                              )
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 1rem',
                              borderRadius: '20px',
                              background: selectedHabits.includes(habit.id) 
                                ? `linear-gradient(135deg, ${habit.color}20 0%, ${habit.color}10 100%)`
                                : '#f3f4f6',
                              color: selectedHabits.includes(habit.id) ? habit.color : '#6b7280',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              border: selectedHabits.includes(habit.id) ? `2px solid ${habit.color}40` : '2px solid transparent'
                            }}
                          >
                            <div style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: habit.color,
                              opacity: selectedHabits.includes(habit.id) ? 1 : 0.5
                            }} />
                            {habit.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content based on view mode */}
                {viewMode === 'combined' && (
                  <div>
                    {/* Combined Overview Metrics */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1.5rem',
                      marginBottom: '3rem'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        background: 'linear-gradient(135deg, #3b82f620 0%, #3b82f610 100%)',
                        borderRadius: '20px',
                        border: '2px solid #3b82f630'
                      }}>
                        <div style={{
                          fontSize: '3rem',
                          fontWeight: '900',
                          color: '#3b82f6',
                          marginBottom: '0.5rem'
                        }}>{allStats.reduce((sum, { stats }) => sum + stats.successfulDays, 0)}</div>
                        <div style={{
                          fontSize: '1rem',
                          color: '#6b7280',
                          fontWeight: '600'
                        }}>Total Successful Days</div>
                      </div>
                      
                      <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        background: 'linear-gradient(135deg, #10b98120 0%, #10b98110 100%)',
                        borderRadius: '20px',
                        border: '2px solid #10b98130'
                      }}>
                        <div style={{
                          fontSize: '3rem',
                          fontWeight: '900',
                          color: '#10b981',
                          marginBottom: '0.5rem'
                        }}>{Math.round(allStats.reduce((sum, { stats }) => sum + stats.successRate, 0) / allStats.length)}%</div>
                        <div style={{
                          fontSize: '1rem',
                          color: '#6b7280',
                          fontWeight: '600'
                        }}>Average Success Rate</div>
                      </div>
                      
                      <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        background: 'linear-gradient(135deg, #8b5cf620 0%, #8b5cf610 100%)',
                        borderRadius: '20px',
                        border: '2px solid #8b5cf630'
                      }}>
                        <div style={{
                          fontSize: '3rem',
                          fontWeight: '900',
                          color: '#8b5cf6',
                          marginBottom: '0.5rem'
                        }}>{Math.max(...allStats.map(({ stats }) => stats.currentStreak))}</div>
                        <div style={{
                          fontSize: '1rem',
                          color: '#6b7280',
                          fontWeight: '600'
                        }}>Longest Current Streak</div>
                      </div>
                    </div>
                  </div>
                )}

                {viewMode === 'comparison' && filteredHabits.length >= 2 && (
                  <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '2.5rem',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      marginBottom: '2rem',
                      textAlign: 'center'
                    }}>Habit Comparison Dashboard</h4>
                    
                    {/* Comparison metrics */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: `120px repeat(${filteredHabits.length}, 1fr)`,
                      gap: '1rem',
                      marginBottom: '3rem'
                    }}>
                      {/* Header row */}
                      <div style={{ fontWeight: '700', color: '#6b7280', fontSize: '0.9rem' }}>Metric</div>
                      {filteredHabits.map(habit => (
                        <div key={habit.id} style={{
                          textAlign: 'center',
                          padding: '1rem',
                          background: `linear-gradient(135deg, ${habit.color}10 0%, ${habit.color}05 100%)`,
                          borderRadius: '12px',
                          border: `1px solid ${habit.color}20`
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem'
                          }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: habit.color
                            }} />
                            <span style={{
                              fontWeight: '700',
                              fontSize: '1rem',
                              color: '#1f2937'
                            }}>{habit.name}</span>
                          </div>
                        </div>
                      ))}
                      
                      {/* Success Rate Row */}
                      <div style={{ fontWeight: '600', color: '#6b7280', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>Success Rate</div>
                      {allStats.map(({ habit, stats }) => (
                        <div key={`success-${habit.id}`} style={{
                          textAlign: 'center',
                          padding: '1.5rem',
                          background: 'white',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{
                            fontSize: '2rem',
                            fontWeight: '900',
                            color: habit.color,
                            marginBottom: '0.5rem'
                          }}>{stats.successRate}%</div>
                          <div style={{
                            width: '100%',
                            height: '8px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${stats.successRate}%`,
                              height: '100%',
                              backgroundColor: habit.color,
                              borderRadius: '4px'
                            }} />
                          </div>
                        </div>
                      ))}
                      
                      {/* Current Streak Row */}
                      <div style={{ fontWeight: '600', color: '#6b7280', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>Current Streak</div>
                      {allStats.map(({ habit, stats }) => (
                        <div key={`streak-${habit.id}`} style={{
                          textAlign: 'center',
                          padding: '1.5rem',
                          background: 'white',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{
                            fontSize: '2rem',
                            fontWeight: '900',
                            color: habit.color,
                            marginBottom: '0.5rem'
                          }}>{stats.currentStreak}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>days</div>
                        </div>
                      ))}
                      
                      {/* Total Days Row */}
                      <div style={{ fontWeight: '600', color: '#6b7280', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>Total Days</div>
                      {allStats.map(({ habit, stats }) => (
                        <div key={`days-${habit.id}`} style={{
                          textAlign: 'center',
                          padding: '1.5rem',
                          background: 'white',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{
                            fontSize: '2rem',
                            fontWeight: '900',
                            color: habit.color,
                            marginBottom: '0.5rem'
                          }}>{stats.successfulDays}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>completed</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Overlay progress comparison */}
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '16px',
                      padding: '2rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h5 style={{
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                      }}>Progress Overlay - Last 30 Days</h5>
                      
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
                        {Array.from({ length: 30 }).map((_, i) => {
                          const date = new Date()
                          date.setDate(date.getDate() - (29 - i))
                          const isToday = date.toDateString() === new Date().toDateString()
                          
                          return (
                            <div
                              key={i}
                              style={{
                                aspectRatio: '1',
                                borderRadius: '12px',
                                border: isToday ? '3px solid #3b82f6' : '1px solid #e2e8f0',
                                position: 'relative',
                                background: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                color: '#6b7280'
                              }}
                            >
                              {date.getDate()}
                              {/* Habit completion dots */}
                              <div style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1px'
                              }}>
                                {filteredHabits.map((habit, habitIndex) => {
                                  const dateStr = date.toISOString().split('T')[0]
                                  const entry = habit.habitEntries.find(e => e.date.toString().split('T')[0] === dateStr)
                                  const completed = (entry?.value || 0) > 0
                                  
                                  return (
                                    <div
                                      key={habit.id}
                                      style={{
                                        width: '4px',
                                        height: '4px',
                                        borderRadius: '50%',
                                        backgroundColor: completed ? habit.color : '#e5e7eb'
                                      }}
                                    />
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {viewMode === 'individual' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    {allStats.map(({ habit, stats }) => (
                      <div
                        key={habit.id}
                        style={{
                          padding: '2.5rem',
                          background: 'white',
                          borderRadius: '20px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                          border: `2px solid ${habit.color}15`
                        }}
                      >
                        {/* Individual habit content - simplified version of original */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          marginBottom: '2rem'
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
                              margin: 0
                            }}>{habit.name}</h3>
                          </div>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                          gap: '1.5rem'
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
                              fontWeight: '600'
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
                              fontWeight: '600'
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
                              fontWeight: '600'
                            }}>Current Streak</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
          
          {/* HabitCalendar moved to bottom */}
          <HabitCalendar
            habits={habits}
            onUpdateEntry={updateHabitEntry}
          />
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
