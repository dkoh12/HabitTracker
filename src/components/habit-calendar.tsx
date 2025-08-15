'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, startOfDay } from 'date-fns'
import { HabitWithEntries } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Calendar1, CalendarDays } from 'lucide-react'

interface HabitCalendarProps {
  habits: HabitWithEntries[]
  onUpdateEntry: (habitId: string, date: string, value: number) => void
}

interface CustomActivity {
  id: string
  text: string
  color: string
  date: string | Date
  createdAt: Date
  updatedAt: Date
  userId: string
}

export function HabitCalendar({ habits, onUpdateEntry }: HabitCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [customActivities, setCustomActivities] = useState<CustomActivity[]>([])
  const [editingActivity, setEditingActivity] = useState<{ date: string; activity?: CustomActivity } | null>(null)
  const [activityText, setActivityText] = useState('')
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  // Removed hover and optimistic update state since toggle functionality is removed

  // Predefined colors for custom activities (different from typical habit colors)
  const activityColors = [
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#10b981', // emerald
    '#ef4444', // red
    '#3b82f6', // blue
    '#f97316', // orange
    '#84cc16', // lime
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#6366f1', // indigo
  ]

  // Calculate date ranges based on view mode
  const getDateRange = () => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate)
      const weekEnd = endOfWeek(currentDate)
      return { start: weekStart, end: weekEnd }
    } else {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(monthStart)
      const start = startOfWeek(monthStart)
      const end = endOfWeek(monthEnd)
      return { start, end }
    }
  }

  const getRandomActivityColor = () => {
    return activityColors[Math.floor(Math.random() * activityColors.length)]
  }

  // API functions for custom activities
  const loadCustomActivities = async (startDate: Date, endDate: Date) => {
    setIsLoadingActivities(true)
    try {
      const params = new URLSearchParams({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      })
      
      const response = await fetch(`/api/custom-activities?${params}`)
      if (response.ok) {
        const activities = await response.json()
        console.log('Loaded custom activities:', activities)
        setCustomActivities(activities)
      } else {
        console.error('Failed to load custom activities:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading custom activities:', error)
    } finally {
      setIsLoadingActivities(false)
    }
  }

  const createCustomActivity = async (date: string, text: string) => {
    try {
      const response = await fetch('/api/custom-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          color: getRandomActivityColor(),
          date
        })
      })

      if (response.ok) {
        const newActivity = await response.json()
        setCustomActivities(prev => [...prev, newActivity])
        return newActivity
      } else {
        const error = await response.json()
        console.error('Failed to create custom activity:', error)
        alert(error.error || 'Failed to create activity')
      }
    } catch (error) {
      console.error('Error creating custom activity:', error)
      alert('Failed to create activity')
    }
  }

  const updateCustomActivityAPI = async (activityId: string, text: string) => {
    try {
      const response = await fetch(`/api/custom-activities/${activityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      })

      if (response.ok) {
        const updatedActivity = await response.json()
        setCustomActivities(prev => 
          prev.map(activity => 
            activity.id === activityId ? updatedActivity : activity
          )
        )
        return updatedActivity
      } else {
        const error = await response.json()
        console.error('Failed to update custom activity:', error)
        alert(error.error || 'Failed to update activity')
      }
    } catch (error) {
      console.error('Error updating custom activity:', error)
      alert('Failed to update activity')
    }
  }

  const deleteCustomActivityAPI = async (activityId: string) => {
    try {
      const response = await fetch(`/api/custom-activities/${activityId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCustomActivities(prev => prev.filter(activity => activity.id !== activityId))
        return true
      } else {
        const error = await response.json()
        console.error('Failed to delete custom activity:', error)
        alert(error.error || 'Failed to delete activity')
        return false
      }
    } catch (error) {
      console.error('Error deleting custom activity:', error)
      alert('Failed to delete activity')
      return false
    }
  }

  // Load custom activities when date range changes
  useEffect(() => {
    const { start: startDate, end: endDate } = getDateRange()
    console.log('Loading custom activities for date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'))
    loadCustomActivities(startDate, endDate)
  }, [currentDate, viewMode])

  const addCustomActivity = async (date: string, text: string) => {
    await createCustomActivity(date, text)
  }

  const updateCustomActivity = async (activityId: string, text: string) => {
    await updateCustomActivityAPI(activityId, text)
  }

  const deleteCustomActivity = async (activityId: string) => {
    return await deleteCustomActivityAPI(activityId)
  }

  const getCustomActivitiesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const activities = customActivities.filter(activity => {
      // activity.date should now always be a string in YYYY-MM-DD format from the API
      const activityDate = typeof activity.date === 'string' 
        ? activity.date 
        : format(new Date(activity.date), 'yyyy-MM-dd')
      const matches = activityDate === dateStr
      if (matches) {
        console.log('Found activity for date', dateStr, ':', activity)
      }
      return matches
    })
    console.log('Getting activities for date:', dateStr, 'found:', activities.length, 'activities from total:', customActivities.length)
    return activities
  }

  const handleActivitySubmit = async () => {
    if (!activityText.trim() || !editingActivity) return
    
    if (editingActivity.activity) {
      // Editing existing activity
      await updateCustomActivity(editingActivity.activity.id, activityText.trim())
    } else {
      // Adding new activity
      await addCustomActivity(editingActivity.date, activityText.trim())
    }
    
    setEditingActivity(null)
    setActivityText('')
  }

  const handleActivityCancel = () => {
    setEditingActivity(null)
    setActivityText('')
  }

  const { start: startDate, end: endDate } = getDateRange()

  const getEntryValue = (habitId: string, date: Date) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return 0

    const entry = habit.habitEntries.find(
      e => format(new Date(e.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
    return entry?.value || 0
  }

  // Toggle functionality removed - calendar is now read-only

  const getHabitStats = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return { completed: 0, total: 0 }

    let completed = 0
    let total = 0
    let currentDay = new Date(startDate)

    while (currentDay <= endDate) {
      // For week view, count all days; for month view, only count current month days for stats
      if (viewMode === 'week' || isSameMonth(currentDay, currentDate)) {
        total++
        if (currentDay <= new Date() && getEntryValue(habitId, currentDay) > 0) {
          completed++
        }
      }
      currentDay = addDays(currentDay, 1)
    }

    return { completed, total }
  }

  const navigatePrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1))
    } else {
      setCurrentDate(subMonths(currentDate, 1))
    }
  }

  const navigateNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1))
    } else {
      setCurrentDate(addMonths(currentDate, 1))
    }
  }

  const getDateRangeText = () => {
    if (viewMode === 'week') {
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
    } else {
      return format(currentDate, 'MMMM yyyy')
    }
  }

  const renderCalendarDays = () => {
    const days = []
    let day = startDate
    const today = new Date()

    while (day <= endDate) {
      const currentDay = new Date(day) // Create a copy for this iteration
      const dayKey = format(currentDay, 'yyyy-MM-dd')
      const isCurrentMonth = viewMode === 'week' || isSameMonth(currentDay, currentDate)
      const isToday = isSameDay(currentDay, today)
      const isFuture = currentDay > today

      days.push(
        <div
          key={dayKey}
          style={{
            minHeight: viewMode === 'week' ? '150px' : '120px',
            border: '1px solid #e5e7eb',
            background: isCurrentMonth 
              ? (isToday ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : 'white')
              : '#f8fafc',
            padding: '0.75rem',
            position: 'relative',
            opacity: isCurrentMonth ? 1 : 0.5,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Date label */}
          <div style={{
            fontSize: viewMode === 'week' ? '1rem' : '0.8rem',
            fontWeight: isToday ? '700' : '600',
            color: isToday ? '#1d4ed8' : (isCurrentMonth ? '#374151' : '#9ca3af'),
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: viewMode === 'week' ? 'flex-start' : 'center',
            flexDirection: viewMode === 'week' ? 'column' : 'row',
            gap: viewMode === 'week' ? '0.25rem' : '0.5rem'
          }}>
            {viewMode === 'week' ? (
              <>
                <span style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}>
                  {format(currentDay, 'EEEE')}
                </span>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: isToday ? '800' : '700'
                }}>
                  {format(currentDay, 'do')}
                </span>
              </>
            ) : (
              <span>{format(currentDay, 'd')}</span>
            )}
          </div>
          
          {/* Habit tracking and custom activities */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: viewMode === 'week' ? '0.5rem' : '3px',
            flex: 1,
            opacity: isCurrentMonth ? 1 : 0.7,
            overflow: 'hidden',
            width: '100%',
            maxWidth: '100%'
          }}>
              {/* Habits */}
              {habits.length === 0 && getCustomActivitiesForDate(currentDay).length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '1rem 0.5rem',
                  color: '#9ca3af',
                  fontSize: '0.7rem'
                }}>
                  No habits or activities
                </div>
              ) : (
                <>
                  {/* Render habits */}
                  {(selectedHabit ? habits.filter(h => h.id === selectedHabit) : habits.slice(0, viewMode === 'week' ? 8 : 3)).map(habit => {
                    const value = getEntryValue(habit.id, currentDay)
                    
                    return (
                      <div
                        key={habit.id}
                        style={{
                          width: '100%',
                          height: viewMode === 'week' ? '16px' : '8px',
                          borderRadius: viewMode === 'week' ? '8px' : '4px',
                          backgroundColor: isFuture 
                            ? `${habit.color}10` 
                            : (value > 0 ? habit.color : `${habit.color}20`),
                          border: isFuture 
                            ? `1px dashed ${habit.color}30` 
                            : (value > 0 ? 'none' : `1px solid ${habit.color}60`),
                          transition: 'all 0.15s ease',
                          position: 'relative',
                          opacity: isFuture ? 0.5 : 1,
                          userSelect: 'none',
                          minHeight: viewMode === 'week' ? '16px' : '8px'
                        }}
                      >
                        {/* Fraction indicator showing value/target */}
                        {!isFuture && (
                          <div style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: viewMode === 'week' ? '10px' : '8px',
                            color: 'white',
                            fontWeight: 'bold',
                            textShadow: '0 0 2px rgba(0,0,0,0.5)',
                            whiteSpace: 'nowrap'
                          }}>
                            {value}/{habit.target}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  
                  {/* Render custom activities */}
                  {getCustomActivitiesForDate(currentDay).map(activity => (
                    <div
                      key={activity.id}
                      style={{
                        width: '100%',
                        maxWidth: '100%',
                        minHeight: viewMode === 'week' ? '20px' : '12px',
                        borderRadius: viewMode === 'week' ? '8px' : '4px',
                        backgroundColor: 'white',
                        border: `2px solid ${activity.color}`,
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        userSelect: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: viewMode === 'week' ? '4px 6px' : '2px 4px',
                        overflow: 'hidden',
                        boxSizing: 'border-box'
                      }}
                      onClick={() => {
                        setEditingActivity({ date: format(currentDay, 'yyyy-MM-dd'), activity })
                        setActivityText(activity.text)
                      }}
                      onDoubleClick={async () => {
                        if (window.confirm('Delete this activity?')) {
                          await deleteCustomActivity(activity.id)
                        }
                      }}
                    >
                      {/* Activity text */}
                      <div style={{
                        fontSize: viewMode === 'week' ? '10px' : '8px',
                        color: activity.color,
                        fontWeight: 'bold',
                        width: '100%',
                        lineHeight: viewMode === 'week' ? '12px' : '10px',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto',
                        overflow: 'hidden',
                        maxWidth: '100%'
                      }}>
                        {activity.text}
                      </div>
                    </div>
                  ))}
                </>
              )}
              
              {/* Add activity button */}
              {isCurrentMonth && !isFuture && (
                <button
                  onClick={() => {
                    // Create a new date object to avoid timezone issues
                    const activityDate = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate())
                    const dateString = format(activityDate, 'yyyy-MM-dd')
                    console.log('Add activity clicked for date:', dateString, 'original day:', currentDay)
                    setEditingActivity({ date: dateString })
                    setActivityText('')
                  }}
                  style={{
                    width: '100%',
                    height: viewMode === 'week' ? '16px' : '10px',
                    borderRadius: viewMode === 'week' ? '6px' : '4px',
                    backgroundColor: 'transparent',
                    border: '1px dashed #9ca3af',
                    color: '#6b7280',
                    fontSize: viewMode === 'week' ? '10px' : '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement
                    target.style.borderColor = '#6b7280'
                    target.style.backgroundColor = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement
                    target.style.borderColor = '#9ca3af'
                    target.style.backgroundColor = 'transparent'
                  }}
                >
                  + Add activity
                </button>
              )}
              
              {!selectedHabit && habits.length > (viewMode === 'week' ? 8 : 3) && (
                <div style={{
                  fontSize: '0.7rem',
                  color: '#6b7280',
                  textAlign: 'center',
                  marginTop: '2px'
                }}>
                  +{habits.length - (viewMode === 'week' ? 8 : 3)} more habits
                </div>
              )}
            </div>
        </div>
      )
      day = addDays(day, 1)
    }

    return days
  }

  return (
    <Card style={{
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }}>
      <CardHeader style={{
        padding: '1.5rem',
        borderBottom: '1px solid #f3f4f6',
        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <CardTitle style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CalendarIcon className="w-6 h-6" style={{ color: '#667eea' }} />
            Habit Calendar
          </CardTitle>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              background: '#f3f4f6',
              borderRadius: '12px',
              padding: '0.25rem',
              gap: '0.25rem'
            }}>
              <button
                onClick={() => setViewMode('week')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: viewMode === 'week' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'transparent',
                  color: viewMode === 'week' ? 'white' : '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Calendar1 className="w-4 h-4" />
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: viewMode === 'month' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'transparent',
                  color: viewMode === 'month' ? 'white' : '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <CalendarDays className="w-4 h-4" />
                Month
              </button>
            </div>

            {/* Navigation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Button
                variant="outline"
                size="sm"
                onClick={navigatePrevious}
                style={{
                  padding: '0.5rem',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronLeft className="w-4 h-4" style={{ color: '#6b7280' }} />
              </Button>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#374151',
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                borderRadius: '20px',
                border: '1px solid #93c5fd',
                minWidth: '180px',
                textAlign: 'center'
              }}>
                {getDateRangeText()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={navigateNext}
                style={{
                  padding: '0.5rem',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronRight className="w-4 h-4" style={{ color: '#6b7280' }} />
              </Button>
            </div>
          </div>
        </div>

        {/* Habit Filter */}
        {habits.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '0.9rem',
                color: '#6b7280',
                fontWeight: '500'
              }}>Filter:</span>
              <button
                onClick={() => setSelectedHabit(null)}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: selectedHabit === null 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : '#f3f4f6',
                  color: selectedHabit === null ? 'white' : '#6b7280',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                All Habits
              </button>
              {habits.map(habit => (
                <button
                  key={habit.id}
                  onClick={() => setSelectedHabit(habit.id)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    border: 'none',
                    background: selectedHabit === habit.id 
                      ? habit.color 
                      : '#f3f4f6',
                    color: selectedHabit === habit.id ? 'white' : '#6b7280',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {habit.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent style={{ padding: '0' }}>
        {/* Calendar Header - Days of Week */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderBottom: '2px solid #e5e7eb'
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              style={{
                padding: '1rem 0.5rem',
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                borderRight: '1px solid #e5e7eb'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          minHeight: viewMode === 'week' ? '200px' : '600px'
        }}>
          {renderCalendarDays()}
        </div>

        {/* Legend or Empty State */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #f3f4f6',
          background: '#f8fafc'
        }}>
          {habits.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#6b7280',
              padding: '1rem'
            }}>
              <div style={{
                fontSize: '2rem',
                marginBottom: '0.5rem'
              }}>📝</div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.25rem'
              }}>No habits to track yet</h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>Create your first habit to start building consistency!</p>
            </div>
          ) : (
            <>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>Legend:</span>
                {(selectedHabit ? habits.filter(h => h.id === selectedHabit) : habits).map(habit => {
                  const { completed, total } = getHabitStats(habit.id)
                  return (
                    <div key={habit.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: habit.color
                      }} />
                      <span style={{
                        fontSize: '0.8rem',
                        color: '#374151',
                        fontWeight: '500'
                      }}>
                        {habit.name}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        background: '#f3f4f6',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '10px'
                      }}>
                        {completed}/{total}
                      </span>
                    </div>
                  )
                })}
                
                {/* Custom activities legend */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    width: '12px',
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: 'white',
                    border: '2px solid #8b5cf6'
                  }} />
                  <span style={{
                    fontSize: '0.8rem',
                    color: '#374151',
                    fontWeight: '500'
                  }}>
                    Custom Activities
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    background: '#f3f4f6',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '10px'
                  }}>
                    {customActivities.length}
                  </span>
                </div>
              </div>
              
              {/* Note about editing habits */}
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderRadius: '8px',
                border: '1px solid #bae6fd'
              }}>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#0369a1',
                  margin: 0,
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  📝 Note: Habit values can only be modified through the Habit Spreadsheet above
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
      
      {/* Activity editing modal */}
      {editingActivity && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {editingActivity.activity ? 'Edit Activity' : 'Add Activity'}
            </h3>
            
            <div style={{
              marginBottom: '1rem'
            }}>
              <label style={{
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#6b7280',
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                Activity Description
              </label>
              <input
                type="text"
                value={activityText}
                onChange={(e) => setActivityText(e.target.value)}
                placeholder="e.g., Dinner with Jenny, My birthday..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem 0.75rem 0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb'
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleActivitySubmit()
                  } else if (e.key === 'Escape') {
                    handleActivityCancel()
                  }
                }}
              />
            </div>
            
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleActivityCancel}
                style={{
                  padding: '0.5rem 1rem',
                  border: '2px solid #e5e7eb',
                  backgroundColor: 'white',
                  color: '#6b7280',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement
                  target.style.backgroundColor = '#f9fafb'
                  target.style.borderColor = '#d1d5db'
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement
                  target.style.backgroundColor = 'white'
                  target.style.borderColor = '#e5e7eb'
                }}
              >
                Cancel
              </button>
              
              {editingActivity.activity && (
                <button
                  onClick={async () => {
                    if (window.confirm('Delete this activity?')) {
                      const success = await deleteCustomActivity(editingActivity.activity!.id)
                      if (success) {
                        handleActivityCancel()
                      }
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '2px solid #ef4444',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement
                    target.style.backgroundColor = '#dc2626'
                    target.style.borderColor = '#dc2626'
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement
                    target.style.backgroundColor = '#ef4444'
                    target.style.borderColor = '#ef4444'
                  }}
                >
                  Delete
                </button>
              )}
              
              <button
                onClick={handleActivitySubmit}
                disabled={!activityText.trim()}
                style={{
                  padding: '0.5rem 1rem',
                  border: '2px solid #3b82f6',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: activityText.trim() ? 'pointer' : 'not-allowed',
                  opacity: activityText.trim() ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (activityText.trim()) {
                    const target = e.target as HTMLButtonElement
                    target.style.backgroundColor = '#2563eb'
                    target.style.borderColor = '#2563eb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activityText.trim()) {
                    const target = e.target as HTMLButtonElement
                    target.style.backgroundColor = '#3b82f6'
                    target.style.borderColor = '#3b82f6'
                  }
                }}
              >
                {editingActivity.activity ? 'Update' : 'Add'} Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
