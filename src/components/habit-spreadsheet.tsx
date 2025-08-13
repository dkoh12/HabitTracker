'use client'

import { useState } from 'react'
import { format, startOfWeek, endOfWeek, addDays, subWeeks, addWeeks } from 'date-fns'
import { HabitWithEntries } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Table as TableIcon, CheckCircle2, XCircle, Circle } from 'lucide-react'

interface HabitSpreadsheetProps {
  habits: HabitWithEntries[]
  onUpdateEntry: (habitId: string, date: string, value: number) => void
}

export function HabitSpreadsheet({ habits, onUpdateEntry }: HabitSpreadsheetProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dateRange, setDateRange] = useState<7 | 30>(7)

  // Debug: Log when component re-renders and what habits data we have
  console.log('🔄 HabitSpreadsheet render:', { 
    habitsCount: habits.length,
    firstHabitEntries: habits[0]?.habitEntries?.length || 0,
    timestamp: new Date().toISOString()
  })

  // Calculate date range based on current date and range selection
  const getDateRange = () => {
    if (dateRange === 7) {
      const weekStart = startOfWeek(currentDate)
      const weekEnd = endOfWeek(currentDate)
      return { start: weekStart, end: weekEnd }
    } else {
      // For 30 days, show last 30 days from current date
      const end = new Date(currentDate)
      const start = new Date(currentDate)
      start.setDate(start.getDate() - 29) // 30 days including today
      return { start, end }
    }
  }

  const { start: startDate, end: endDate } = getDateRange()

  // Generate array of dates for the range
  const getDatesArray = () => {
    const dates = []
    let currentDay = new Date(startDate)
    while (currentDay <= endDate) {
      dates.push(format(currentDay, 'yyyy-MM-dd'))
      currentDay = addDays(currentDay, 1)
    }
    return dates
  }

  const dates = getDatesArray()

  const getEntryValue = (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return 0

    // Simple date matching - find entry that matches the date string
    const entry = habit.habitEntries.find(e => {
      // Just compare the first 10 characters (YYYY-MM-DD) of both dates
      const entryDateStr = e.date.toString().substring(0, 10)
      return entryDateStr === date
    })
    
    const value = entry?.value || 0
    console.log('🎯 getEntryValue:', { habitId: habit.name, date, entryFound: !!entry, allEntries: habit.habitEntries.map(e => ({ date: e.date, value: e.value })), returnValue: value })
    return value
  }

  const handleCellClick = (habitId: string, date: string) => {
    console.log('🔥 CELL CLICKED!', { habitId, date })
    
    const currentValue = getEntryValue(habitId, date)
    const habit = habits.find(h => h.id === habitId)
    
    console.log('🔥 Current state:', { 
      currentValue, 
      habitName: habit?.name
    })
    
    let newValue: number

    // Simple rotation: 0 → 3 → 2 → 1 → 0
    // 0 = none, 1 = red (failed), 2 = yellow (partial), 3 = green (completed)
    if (currentValue === 0) {
      // none → green
      newValue = 3
      console.log('🔥 none → green:', newValue)
    } else if (currentValue === 3) {
      // green → yellow
      newValue = 2
      console.log('🔥 green → yellow:', newValue)
    } else if (currentValue === 2) {
      // yellow → red
      newValue = 1
      console.log('🔥 yellow → red:', newValue)
    } else if (currentValue === 1) {
      // red → none
      newValue = 0
      console.log('🔥 red → none:', newValue)
    } else {
      // fallback → green
      newValue = 3
      console.log('🔥 fallback → green:', newValue)
    }

    console.log('🔥 Calling onUpdateEntry with:', { habitId, date, value: newValue })
    onUpdateEntry(habitId, date, newValue)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'MMM d')
  }

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    return {
      day: format(date, 'd'),
      weekday: format(date, 'EEE'),
      month: format(date, 'MMM')
    }
  }

  const navigatePrevious = () => {
    if (dateRange === 7) {
      setCurrentDate(subWeeks(currentDate, 1))
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 30)
      setCurrentDate(newDate)
    }
  }

  const navigateNext = () => {
    if (dateRange === 7) {
      setCurrentDate(addWeeks(currentDate, 1))
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 30)
      setCurrentDate(newDate)
    }
  }

  const getDateRangeText = () => {
    if (dateRange === 7) {
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
    } else {
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
    }
  }

  const getCompletionIcon = (value: number, target: number, habitId: string, date: string) => {
    // Simple value-based system: 0=none, 1=red, 2=yellow, 3=green
    if (value === 0) {
      // No entry - gray circle
      return <Circle style={{ width: '20px', height: '20px', color: '#d1d5db' }} />
    } else if (value === 3) {
      // Completed - green checkmark
      return <CheckCircle2 style={{ 
        width: '20px', 
        height: '20px', 
        color: '#10b981',
        filter: 'drop-shadow(0 0 2px rgba(16, 185, 129, 0.4))'
      }} />
    } else if (value === 2) {
      // Partial progress - yellow circle with dot
      return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Circle style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              background: '#f59e0b',
              borderRadius: '50%'
            }}></div>
          </div>
        </div>
      )
    } else if (value === 1) {
      // Failed attempt - red X
      return <XCircle style={{ width: '20px', height: '20px', color: '#ef4444' }} />
    } else {
      // Fallback - gray circle
      return <Circle style={{ width: '20px', height: '20px', color: '#d1d5db' }} />
    }
  }

  const getCellColor = (value: number, target: number, habitId: string, date: string) => {
    // Simple value-based system: 0=none, 1=red, 2=yellow, 3=green
    if (value === 0) {
      return '#ffffff' // white for no entry
    } else if (value === 1) {
      return '#fecaca' // light red for failed attempt
    } else if (value === 2) {
      return '#fef3c7' // light yellow for partial
    } else if (value === 3) {
      return '#dcfce7' // light green for completed
    }
    return '#ffffff' // fallback to white
  }

  const getCellTextColor = (value: number, target: number, habitId: string, date: string) => {
    // Simple value-based system: 0=none, 1=red, 2=yellow, 3=green
    if (value === 0) {
      return '#9ca3af' // gray for no entry
    } else if (value === 1) {
      return '#dc2626' // red for failed attempt
    } else if (value === 2) {
      return '#92400e' // dark yellow for partial
    } else if (value === 3) {
      return '#166534' // dark green for completed
    }
    return '#9ca3af' // fallback to gray
  }

  return (
    <Card style={{
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      marginBottom: '2rem'
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <TableIcon className="w-6 h-6" style={{ color: '#10b981' }} />
            Habit Spreadsheet
          </CardTitle>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {/* Date Range Toggle */}
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <Button
                variant={dateRange === 7 ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(7)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  borderRadius: '8px',
                  border: dateRange === 7 ? 'none' : '2px solid #e5e7eb',
                  background: dateRange === 7 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'white',
                  color: dateRange === 7 ? 'white' : '#374151',
                  transition: 'all 0.2s ease'
                }}
              >
                7 days
              </Button>
              <Button
                variant={dateRange === 30 ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(30)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  borderRadius: '8px',
                  border: dateRange === 30 ? 'none' : '2px solid #e5e7eb',
                  background: dateRange === 30 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'white',
                  color: dateRange === 30 ? 'white' : '#374151',
                  transition: 'all 0.2s ease'
                }}
              >
                30 days
              </Button>
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
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronLeft className="w-4 h-4" style={{ color: '#6b7280' }} />
              </Button>
              <span style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                borderRadius: '20px',
                border: '1px solid #10b981',
                minWidth: '200px',
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
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronRight className="w-4 h-4" style={{ color: '#6b7280' }} />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent style={{ padding: '0' }}>
        {habits.length === 0 ? (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem'
            }}>📊</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#1f2937'
            }}>No Habits Yet</h3>
            <p style={{
              color: '#6b7280',
              marginBottom: '2rem',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              Create your first habit to start tracking your progress in spreadsheet format!
            </p>
          </div>
        ) : (
          <div style={{ 
            overflowX: 'auto',
            border: '1px solid #e5e7eb',
            borderTop: 'none'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace'
            }}>
              {/* Header Row */}
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {/* Date column header */}
                  <th style={{
                    position: 'sticky',
                    left: 0,
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    minWidth: '100px',
                    color: '#374151',
                    fontSize: '0.875rem',
                    zIndex: 10
                  }}>
                    Date
                  </th>
                  {/* Habit columns */}
                  {habits.map(habit => (
                    <th key={habit.id} style={{
                      border: '1px solid #d1d5db',
                      padding: '0.75rem',
                      textAlign: 'center',
                      minWidth: '120px',
                      maxWidth: '150px',
                      background: '#f9fafb',
                      fontWeight: '600',
                      color: '#374151',
                      wordWrap: 'break-word'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: habit.color,
                          marginBottom: '0.25rem'
                        }} />
                        <div style={{
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          textAlign: 'center',
                          lineHeight: '1.2'
                        }}>
                          {habit.name}
                        </div>
                        <div style={{
                          fontSize: '0.7rem',
                          color: '#6b7280',
                          textAlign: 'center'
                        }}>
                          Target: {habit.target}{habit.unit && ` ${habit.unit}`}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body Rows - One row per date */}
              <tbody>
                {dates.map((date, dateIndex) => {
                  const dateInfo = formatDateHeader(date)
                  const isToday = format(new Date(), 'yyyy-MM-dd') === date
                  
                  return (
                    <tr key={date} style={{
                      background: isToday ? '#f0fdf4' : (dateIndex % 2 === 0 ? '#ffffff' : '#f9fafb'),
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isToday) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isToday) {
                        e.currentTarget.style.backgroundColor = dateIndex % 2 === 0 ? '#ffffff' : '#f9fafb'
                      }
                    }}>
                      {/* Date cell */}
                      <td style={{
                        position: 'sticky',
                        left: 0,
                        background: isToday ? '#ecfdf5' : (dateIndex % 2 === 0 ? '#ffffff' : '#f9fafb'),
                        border: '1px solid #d1d5db',
                        padding: '0.75rem',
                        fontWeight: isToday ? '700' : '500',
                        color: isToday ? '#166534' : '#374151',
                        zIndex: 5
                      }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.125rem'
                        }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: isToday ? '700' : '600'
                          }}>
                            {dateInfo.month} {dateInfo.day}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: isToday ? '#059669' : '#6b7280'
                          }}>
                            {dateInfo.weekday}
                          </div>
                        </div>
                      </td>

                      {/* Habit cells */}
                      {habits.map(habit => {
                        const value = getEntryValue(habit.id, date)
                        const target = habit.target || 1
                        const cellBg = getCellColor(value, target, habit.id, date)
                        const textColor = getCellTextColor(value, target, habit.id, date)
                        
                        return (
                          <td key={habit.id} style={{
                            border: '1px solid #d1d5db',
                            padding: '0.5rem',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            cursor: 'pointer',
                            background: cellBg,
                            color: textColor,
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            transition: 'all 0.15s ease',
                            userSelect: 'none'
                          }}
                          onClick={() => handleCellClick(habit.id, date)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = 'inset 0 0 0 1px #10b981'
                            e.currentTarget.style.border = '1px solid #10b981'
                            e.currentTarget.style.transform = 'scale(1.02)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none'
                            e.currentTarget.style.border = '1px solid #d1d5db'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                          title={`${habit.name} on ${formatDate(date)}: ${value}${habit.unit || ''} (Target: ${target}${habit.unit || ''}) - Click to cycle: Green → Yellow → Red → None`}
                          >
                            {getCompletionIcon(value, target, habit.id, date)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        {habits.length > 0 && (
          <div style={{
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            fontSize: '0.875rem'
          }}>
            <div style={{
              fontWeight: '600',
              color: '#374151',
              marginRight: '0.5rem'
            }}>
              Legend:
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Circle style={{ width: '16px', height: '16px', color: '#d1d5db' }} />
              <span style={{ color: '#6b7280' }}>No entry</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10b981' }} />
              <span style={{ color: '#166534' }}>Target reached</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Circle style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '4px',
                    height: '4px',
                    background: '#f59e0b',
                    borderRadius: '50%'
                  }}></div>
                </div>
              </div>
              <span style={{ color: '#92400e' }}>Partial progress</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <XCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
              <span style={{ color: '#dc2626' }}>Attempted but failed</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
