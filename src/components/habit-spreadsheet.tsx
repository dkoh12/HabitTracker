'use client'

import { useState } from 'react'
import { format, startOfWeek, endOfWeek, addDays, subWeeks, addWeeks } from 'date-fns'
import { HabitWithEntries } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Table as TableIcon, CheckCircle2, XCircle, Circle, Triangle } from 'lucide-react'

interface HabitSpreadsheetProps {
  habits: HabitWithEntries[]
  onUpdateEntry: (habitId: string, date: string, value: number) => void
}

export function HabitSpreadsheet({ habits, onUpdateEntry }: HabitSpreadsheetProps) {
  // Navigation state - this controls which week/month we're viewing
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [dateRange, setDateRange] = useState<7 | 30>(7)

  // Calculate date range based on navigation state and range selection
  const getDateRange = () => {
    if (dateRange === 7) {
      // Use the navigation currentDate for week calculation
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
      return { start: weekStart, end: weekEnd }
    } else {
      // For 30 days, show last 30 days from current date
      const end = new Date(currentDate)
      const start = new Date(currentDate)
      start.setDate(start.getDate() - 29) // 30 days including today
      return { start, end }
    }
  }

  // Calculate the date range and generate dates array
  const { start: startDate, end: endDate } = getDateRange()
  
  const dates = (() => {
    const datesArray = []
    let currentDay = new Date(startDate)
    while (currentDay <= endDate) {
      datesArray.push(format(currentDay, 'yyyy-MM-dd'))
      currentDay = addDays(currentDay, 1)
    }
    return datesArray
  })()

  const getEntryValue = (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return 0

    // Simple date matching - find entry that matches the date string
    const entry = habit.habitEntries.find(e => {
      // Just compare the first 10 characters (YYYY-MM-DD) of both dates
      const entryDateStr = e.date.toString().substring(0, 10)
      return entryDateStr === date
    })
    
    return entry?.value || 0
  }

  const handleCellClick = (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return
    
    const currentValue = getEntryValue(habitId, date)
    const target = habit.target
    
    // Prompt user for custom input
    const inputValue = prompt(
      `Enter value for ${habit.name} on ${formatDate(date)}:\n(Target: ${target}${habit.unit ? ` ${habit.unit}` : ''})`,
      currentValue.toString()
    )
    
    // If user cancels or enters invalid input, don't update
    if (inputValue === null) return
    
    const newValue = parseFloat(inputValue)
    if (isNaN(newValue) || newValue < 0) {
      alert('Please enter a valid number (0 or greater)')
      return
    }
    
    onUpdateEntry(habitId, date, newValue)
  }

  const formatDate = (dateString: string) => {
    // Fix timezone issue: parse as local date instead of UTC
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day, 12, 0, 0) // Set to noon to avoid timezone issues
    return format(date, 'MMM d')
  }

  const formatDateHeader = (dateString: string) => {
    // Fix timezone issue: parse as local date instead of UTC
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day, 12, 0, 0) // Set to noon to avoid timezone issues
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
    if (value === 0) {
      // No entry - gray circle
      return <Circle style={{ width: '20px', height: '20px', color: '#d1d5db' }} />
    } else if (value >= target) {
      // Completed (value equals or exceeds target) - green checkmark
      return <CheckCircle2 style={{ 
        width: '20px', 
        height: '20px', 
        color: '#10b981',
        filter: 'drop-shadow(0 0 2px rgba(16, 185, 129, 0.4))'
      }} />
    } else if (value >= target * 0.5) {
      // Partial progress (value is at least 50% of target) - yellow circle with dot
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
    } else {
      // Some progress but less than 50% of target - yellow triangle (getting started)
      return <Triangle style={{ 
        width: '20px', 
        height: '20px', 
        color: '#f59e0b',
        fill: '#f59e0b'
      }} />
    }
  }

  const getCellColor = (value: number, target: number, habitId: string, date: string) => {
    // Match the logic from getCompletionIcon to keep background consistent with icon
    if (value === 0) {
      return '#ffffff' // white for no entry
    } else if (value >= target) {
      return '#dcfce7' // light green for completed (target met or exceeded)
    } else if (value >= target * 0.5) {
      return '#fef3c7' // light yellow for partial progress (50%+ of target)
    } else {
      return '#fecaca' // light red for minimal progress (less than 50% of target)
    }
  }

  const getCellTextColor = (value: number, target: number, habitId: string, date: string) => {
    // Match the logic from getCompletionIcon to keep text color consistent with icon
    if (value === 0) {
      return '#9ca3af' // gray for no entry
    } else if (value >= target) {
      return '#166534' // dark green for completed (target met or exceeded)
    } else if (value >= target * 0.5) {
      return '#92400e' // dark yellow for partial progress (50%+ of target)
    } else {
      return '#92400e' // yellow for minimal progress (less than 50% of target)
    }
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
            overflowX: habits.length > 4 ? 'auto' : 'visible',
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
                  // Check if this date is today
                  const today = new Date()
                  const todayString = format(today, 'yyyy-MM-dd')
                  const isToday = date === todayString
                  
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
                            {dateInfo.month} {dateInfo.day} {isToday && '(today)'}
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
                        const textColor = getCellTextColor(value, target, habit.id, date)
                        
                        return (
                          <td key={habit.id} style={{
                            border: '1px solid #d1d5db',
                            padding: '0.5rem',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            cursor: 'pointer',
                            color: textColor,
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            transition: 'all 0.15s ease',
                            userSelect: 'none'
                          }}
                          onClick={() => handleCellClick(habit.id, date)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.border = '2px solid #10b981'
                            e.currentTarget.style.position = 'relative'
                            e.currentTarget.style.zIndex = '20'
                            e.currentTarget.style.transform = 'scale(1.02)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.border = '1px solid #e5e7eb'
                            e.currentTarget.style.position = 'static'
                            e.currentTarget.style.zIndex = 'auto'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                          >
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              {getCompletionIcon(value, target, habit.id, date)}
                              {value > 0 && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: '#6b7280'
                                }}>
                                  {value}{habit.unit && ` ${habit.unit}`}
                                </span>
                              )}
                            </div>
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
              <span style={{ color: '#6b7280' }}>No Entry</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10b981' }} />
              <span style={{ color: '#166534' }}>Completed</span>
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
              <span style={{ color: '#92400e' }}>Partial Progress (≥50% of target)</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Triangle style={{ 
                width: '16px', 
                height: '16px', 
                color: '#f59e0b',
                fill: '#f59e0b'
              }} />
              <span style={{ color: '#92400e' }}>Getting Started (&lt;50% of target)</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
