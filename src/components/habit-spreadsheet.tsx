'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, startOfDay } from 'date-fns'
import { HabitWithEntries } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid3X3, LayoutGrid } from 'lucide-react'

interface HabitSpreadsheetProps {
  habits: HabitWithEntries[]
  onUpdateEntry: (habitId: string, date: string, value: number) => void
}

export function HabitSpreadsheet({ habits, onUpdateEntry }: HabitSpreadsheetProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, number>>(new Map())

  // Clear optimistic updates when habits data changes (real data updated)
  useEffect(() => {
    if (habits.length > 0) {
      setOptimisticUpdates(new Map())
    }
  }, [habits])

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

  const { start: startDate, end: endDate } = getDateRange()

  const getEntryValue = (habitId: string, date: Date) => {
    const dateKey = `${habitId}-${format(date, 'yyyy-MM-dd')}`
    
    // Check for optimistic update first
    if (optimisticUpdates.has(dateKey)) {
      return optimisticUpdates.get(dateKey)!
    }
    
    // Otherwise get the actual value from data
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return 0

    const entry = habit.habitEntries.find(
      e => format(new Date(e.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
    return entry?.value || 0
  }

  const handleCellClick = (habitId: string, date: Date, currentValue: number) => {
    const newValue = currentValue > 0 ? 0 : 1
    const dateString = format(date, 'yyyy-MM-dd')
    const dateKey = `${habitId}-${dateString}`
    
    console.log('📝 handleCellClick:', { habitId, dateString, currentValue, newValue })
    
    // Apply optimistic update immediately for instant UI feedback
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev)
      newMap.set(dateKey, newValue)
      return newMap
    })
    
    // Call the parent's update function
    onUpdateEntry(habitId, dateString, newValue)
    
    // Clear the optimistic update after a delay (when real data should be back)
    setTimeout(() => {
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev)
        newMap.delete(dateKey)
        return newMap
      })
    }, 2000) // Clear after 2 seconds
    
    console.log('✅ Entry updated successfully!')
  }

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
      const dayKey = format(day, 'yyyy-MM-dd')
      const isCurrentMonth = viewMode === 'week' || isSameMonth(day, currentDate)
      const isToday = isSameDay(day, today)
      const isFuture = day > today

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
                  {format(day, 'EEEE')}
                </span>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: isToday ? '800' : '700'
                }}>
                  {format(day, 'do')}
                </span>
              </>
            ) : (
              <span>{format(day, 'd')}</span>
            )}
          </div>
          
          {/* Habit tracking */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: viewMode === 'week' ? '0.5rem' : '3px',
            flex: 1,
            opacity: isCurrentMonth ? 1 : 0.7
          }}>
              {habits.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '1rem 0.5rem',
                  color: '#9ca3af',
                  fontSize: '0.7rem'
                }}>
                  No habits
                </div>
              ) : (
                (selectedHabit ? habits.filter(h => h.id === selectedHabit) : habits.slice(0, viewMode === 'week' ? 10 : 4)).map(habit => {
                  const value = getEntryValue(habit.id, day)
                  const cellId = `${habit.id}-${format(day, 'yyyy-MM-dd')}`
                  const isHovered = hoveredCell === cellId
                  const tooltipText = isFuture 
                    ? `${habit.name}: Future tracking (cannot click)` 
                    : `${habit.name}: ${value > 0 ? '✅ Completed' : '⭕ Not completed'} - Click to toggle`
                  
                  return (
                    <div
                      key={habit.id}
                      onClick={!isFuture ? (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('🎯 CLICKING HABIT:', habit.name, 'for date:', format(day, 'yyyy-MM-dd'), 'current value:', value)
                        handleCellClick(habit.id, day, value)
                      } : undefined}
                      onMouseEnter={() => {
                        if (!isFuture) {
                          setHoveredCell(cellId)
                        }
                      }}
                      onMouseLeave={() => {
                        if (!isFuture) {
                          setHoveredCell(null)
                        }
                      }}
                      style={{
                        width: '100%',
                        height: viewMode === 'week' ? '16px' : '8px',
                        borderRadius: viewMode === 'week' ? '8px' : '4px',
                        backgroundColor: isFuture 
                          ? `${habit.color}10` 
                          : isHovered 
                            ? (value > 0 ? habit.color : `${habit.color}80`)
                            : (value > 0 ? habit.color : `${habit.color}20`),
                        border: isFuture 
                          ? `1px dashed ${habit.color}30` 
                          : (value > 0 ? 'none' : `1px solid ${habit.color}60`),
                        cursor: isFuture ? 'default' : 'pointer',
                        transition: 'all 0.15s ease',
                        transform: !isFuture && isHovered ? 'scale(1.03)' : 'scale(1)',
                        boxShadow: value > 0 && !isFuture 
                          ? `0 0 0 1px ${habit.color}60` 
                          : isHovered && !isFuture 
                            ? `0 0 0 2px ${habit.color}40`
                            : 'none',
                        position: 'relative',
                        opacity: isFuture ? 0.5 : 1,
                        userSelect: 'none',
                        zIndex: isHovered ? 10 : 1,
                        minHeight: viewMode === 'week' ? '16px' : '8px'
                      }}
                      title={tooltipText}
                      aria-label={tooltipText}
                    >
                      {/* Visual completion indicator */}
                      {value > 0 && !isFuture && (
                        <div style={{
                          position: 'absolute',
                          right: '2px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: viewMode === 'week' ? '10px' : '8px',
                          color: 'white',
                          fontWeight: 'bold',
                          textShadow: '0 0 2px rgba(0,0,0,0.5)'
                        }}>
                          ✓
                        </div>
                      )}
                      
                      {/* Count indicator for values > 1 */}
                      {viewMode === 'week' && value > 1 && (
                        <div style={{
                          position: 'absolute',
                          left: '4px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '0.7rem',
                          color: 'white',
                          fontWeight: '600',
                          textShadow: '0 0 2px rgba(0,0,0,0.5)'
                        }}>
                          {value}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              {!selectedHabit && habits.length > (viewMode === 'week' ? 10 : 4) && (
                <div style={{
                  fontSize: '0.7rem',
                  color: '#6b7280',
                  textAlign: 'center',
                  marginTop: '2px'
                }}>
                  +{habits.length - (viewMode === 'week' ? 10 : 4)} more
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
                <Grid3X3 className="w-4 h-4" />
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
                <LayoutGrid className="w-4 h-4" />
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
