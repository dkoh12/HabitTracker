'use client'

import { useState, useEffect } from 'react'
import { format, subDays, addDays, startOfDay } from 'date-fns'
import { HabitWithEntries } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react'

interface HabitSpreadsheetProps {
  habits: HabitWithEntries[]
  onUpdateEntry: (habitId: string, date: string, value: number) => void
}

export function HabitSpreadsheet({ habits, onUpdateEntry }: HabitSpreadsheetProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [days, setDays] = useState<Date[]>([])

  useEffect(() => {
    // Generate 14 days around current date
    const dayList = []
    for (let i = -7; i <= 6; i++) {
      dayList.push(addDays(currentDate, i))
    }
    setDays(dayList)
  }, [currentDate])

  const getEntryValue = (habitId: string, date: Date) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return 0

    const entry = habit.habitEntries.find(
      e => format(new Date(e.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
    return entry?.value || 0
  }

  const handleCellClick = (habitId: string, date: Date, currentValue: number) => {
    const newValue = currentValue > 0 ? 0 : 1
    onUpdateEntry(habitId, format(date, 'yyyy-MM-dd'), newValue)
  }

  const handleValueChange = (habitId: string, date: Date, increment: boolean) => {
    const currentValue = getEntryValue(habitId, date)
    const newValue = increment ? currentValue + 1 : Math.max(0, currentValue - 1)
    onUpdateEntry(habitId, format(date, 'yyyy-MM-dd'), newValue)
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
            WebkitTextFillColor: 'transparent'
          }}>📅 Habit Tracking Calendar</CardTitle>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subDays(currentDate, 7))}
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
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#374151',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              borderRadius: '20px',
              border: '1px solid #93c5fd'
            }}>
              {format(days[0] || new Date(), 'MMM d')} - {format(days[days.length - 1] || new Date(), 'MMM d, yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
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
      </CardHeader>
      <CardContent style={{ padding: '1.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <thead>
              <tr style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
              }}>
                <th style={{
                  textAlign: 'left',
                  padding: '1rem',
                  borderBottom: '2px solid #e5e7eb',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '0.9rem'
                }}>Habit</th>
                {days.map(day => (
                  <th key={day.toISOString()} style={{
                    textAlign: 'center',
                    padding: '1rem 0.5rem',
                    borderBottom: '2px solid #e5e7eb',
                    fontWeight: '600',
                    minWidth: '80px'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginBottom: '0.25rem'
                    }}>
                      {format(day, 'EEE')}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#374151',
                      fontWeight: '600'
                    }}>
                      {format(day, 'd')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => (
                <tr key={habit.id} style={{
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'all 0.2s ease'
                }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: habit.color,
                          boxShadow: `0 0 0 3px ${habit.color}20`
                        }}
                      />
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '0.95rem'
                      }}>{habit.name}</span>
                      {habit.unit && (
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          background: '#f3f4f6',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '12px'
                        }}>({habit.unit})</span>
                      )}
                    </div>
                  </td>
                  {days.map(day => {
                    const value = getEntryValue(habit.id, day)
                    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    const isFuture = day > new Date()

                    return (
                      <td key={day.toISOString()} style={{
                        padding: '0.5rem',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}>
                          {!isFuture && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleValueChange(habit.id, day, false)}
                                disabled={value <= 0}
                                style={{
                                  height: '24px',
                                  width: '24px',
                                  background: 'transparent',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: value <= 0 ? 'not-allowed' : 'pointer',
                                  color: value <= 0 ? '#d1d5db' : '#ef4444',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: value > 0 ? '2px solid #10b981' : '2px solid #e5e7eb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  transition: 'all 0.2s ease',
                                  background: value > 0 
                                    ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' 
                                    : '#f9fafb',
                                  color: value > 0 ? '#059669' : '#9ca3af',
                                  boxShadow: value > 0 ? '0 0 0 3px rgba(16, 185, 129, 0.1)' : 'none',
                                  transform: isToday ? 'scale(1.1)' : 'scale(1)',
                                  borderColor: isToday && value === 0 ? '#3b82f6' : (value > 0 ? '#10b981' : '#e5e7eb')
                                }}
                                onClick={() => handleCellClick(habit.id, day, value)}
                              >
                                {value > 0 ? value : ''}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleValueChange(habit.id, day, true)}
                                style={{
                                  height: '24px',
                                  width: '24px',
                                  background: 'transparent',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  color: '#10b981',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          {isFuture && (
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: '1px solid #f3f4f6',
                              background: '#f8fafc'
                            }} />
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {habits.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: '#6b7280',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: '12px',
            border: '2px dashed #d1d5db'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>📝</div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>No habits to track yet</h3>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280'
            }}>Create your first habit to start building consistency!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
