'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { HabitFormData, HabitWithEntries } from '@/types'
import { Clock } from 'lucide-react'

interface HabitFormProps {
  onSubmit: (data: HabitFormData) => void
  onCancel?: () => void
  habit?: HabitWithEntries
  isEditing?: boolean
}

const colors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280'  // Gray
]

export function HabitForm({ onSubmit, onCancel, habit, isEditing = false }: HabitFormProps) {
  const [formData, setFormData] = useState<HabitFormData>({
    name: '',
    description: '',
    color: colors[0],
    target: 1,
    unit: '',
    startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    endDate: '',
    hasEndDate: false,
    scheduleType: 'weekly' as 'weekly' | 'monthly' | 'custom', // Type of schedule
    selectedDays: [] as string[], // For weekly: ['monday', 'wednesday', 'friday']
    monthlyType: 'date' as 'date' | 'weekday', // For monthly: specific date or nth weekday
    monthlyDate: 1, // For monthly by date: 1-31
    monthlyWeekday: 'monday' as string, // For monthly by weekday: which day
    monthlyWeek: 'first' as 'first' | 'second' | 'third' | 'fourth' | 'last', // Which occurrence
    customInterval: 1,
    customUnit: 'days' as 'days' | 'weeks' | 'months'
  })

  // Populate form data when editing
  useEffect(() => {
    if (isEditing && habit) {
      setFormData({
        name: habit.name,
        description: habit.description || '',
        color: habit.color,
        target: habit.target,
        unit: habit.unit || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        hasEndDate: false,
        scheduleType: 'weekly',
        selectedDays: [],
        monthlyType: 'date',
        monthlyDate: 1,
        monthlyWeekday: 'monday',
        monthlyWeek: 'first',
        customInterval: 1,
        customUnit: 'days'
      })
    }
  }, [isEditing, habit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate end date if provided
    if (formData.hasEndDate && formData.endDate && formData.endDate <= formData.startDate) {
      alert('End date must be after start date')
      return
    }
    
    // Validate that scheduling is properly configured
    if (formData.scheduleType === 'weekly' && formData.selectedDays.length === 0) {
      alert('Please select at least one day of the week for weekly schedule')
      return
    }
    if (formData.scheduleType === 'monthly' && formData.monthlyType === 'date' && (formData.monthlyDate < 1 || formData.monthlyDate > 31)) {
      alert('Please select a valid date (1-31) for monthly schedule')
      return
    }
    if (formData.scheduleType === 'custom' && formData.customInterval < 1) {
      alert('Please enter a valid interval for custom schedule')
      return
    }
    
    onSubmit(formData)
  }

  return (
    <Card style={{
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
    }}>
      <CardHeader style={{
        padding: '1.5rem',
        borderBottom: '1px solid #f3f4f6',
        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
      }}>
        <CardTitle style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#1f2937',
          margin: 0
        }}>
          {isEditing ? 'Edit Habit' : 'Habit Details'}
        </CardTitle>
      </CardHeader>
      <CardContent style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Name */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Habit Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Read 20 pages, Exercise 30 minutes"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this habit..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Target and Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Target
              </label>
              <Input
                type="number"
                min="1"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 1 })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Unit
              </label>
              <Input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="pages, minutes, chapters"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              <Clock style={{ width: '14px', height: '14px', display: 'inline', marginRight: '0.25rem' }} />
              Start Date *
            </label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'white',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* End Date */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <input
                type="checkbox"
                id="hasEndDate"
                checked={formData.hasEndDate}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  hasEndDate: e.target.checked,
                  endDate: e.target.checked ? formData.endDate : ''
                })}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#667eea'
                }}
              />
              <label 
                htmlFor="hasEndDate"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Set End Date
              </label>
            </div>
            
            {formData.hasEndDate && (
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  background: 'white',
                  boxSizing: 'border-box'
                }}
              />
            )}
          </div>

          {/* Schedule Type Selector */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Schedule Type
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem'
            }}>
              {[
                { key: 'weekly', label: 'Weekly', desc: 'Specific days each week' },
                { key: 'monthly', label: 'Monthly', desc: 'Specific dates each month' },
                { key: 'custom', label: 'Custom', desc: 'Every N days/weeks/months' }
              ].map(type => {
                const isSelected = formData.scheduleType === type.key
                return (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, scheduleType: type.key as any })}
                    style={{
                      padding: '0.75rem',
                      border: isSelected ? '2px solid #667eea' : '2px solid #e5e7eb',
                      borderRadius: '8px',
                      background: isSelected ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                      color: isSelected ? 'white' : '#374151',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                  >
                    <div>{type.label}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                      {type.desc}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Weekly Schedule */}
          {formData.scheduleType === 'weekly' && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Select Days of the Week
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.5rem'
              }}>
                {[
                  { key: 'sunday', label: 'Sun', full: 'Sunday' },
                  { key: 'monday', label: 'Mon', full: 'Monday' },
                  { key: 'tuesday', label: 'Tue', full: 'Tuesday' },
                  { key: 'wednesday', label: 'Wed', full: 'Wednesday' },
                  { key: 'thursday', label: 'Thu', full: 'Thursday' },
                  { key: 'friday', label: 'Fri', full: 'Friday' },
                  { key: 'saturday', label: 'Sat', full: 'Saturday' }
                ].map(day => {
                  const isSelected = formData.selectedDays.includes(day.key)
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => {
                        const newSelectedDays = isSelected
                          ? formData.selectedDays.filter(d => d !== day.key)
                          : [...formData.selectedDays, day.key]
                        setFormData({ ...formData, selectedDays: newSelectedDays })
                      }}
                      style={{
                        padding: '0.75rem 0.5rem',
                        border: isSelected ? '2px solid #667eea' : '2px solid #e5e7eb',
                        borderRadius: '8px',
                        background: isSelected ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                        color: isSelected ? 'white' : '#374151',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center'
                      }}
                      title={day.full}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
              
              {/* Quick Select Options */}
              <div style={{
                marginTop: '0.75rem',
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    selectedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] 
                  })}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Weekdays
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    selectedDays: ['saturday', 'sunday'] 
                  })}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Weekends
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    selectedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] 
                  })}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Every Day
                </button>
              </div>
            </div>
          )}

          {/* Monthly Schedule */}
          {formData.scheduleType === 'monthly' && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Monthly Schedule Type
              </label>
              
              {/* Monthly Type Selector */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                {[
                  { key: 'date', label: 'By Date', desc: 'Same date each month' },
                  { key: 'weekday', label: 'By Weekday', desc: 'Same weekday occurrence' }
                ].map(type => {
                  const isSelected = formData.monthlyType === type.key
                  return (
                    <button
                      key={type.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, monthlyType: type.key as any })}
                      style={{
                        padding: '0.75rem',
                        border: isSelected ? '2px solid #667eea' : '2px solid #e5e7eb',
                        borderRadius: '8px',
                        background: isSelected ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                        color: isSelected ? 'white' : '#374151',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center'
                      }}
                    >
                      <div>{type.label}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                        {type.desc}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Date Selection */}
              {formData.monthlyType === 'date' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Day of Month (1-31)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.monthlyDate}
                    onChange={(e) => setFormData({ ...formData, monthlyDate: parseInt(e.target.value) || 1 })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Weekday Selection */}
              {formData.monthlyType === 'weekday' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Which Occurrence
                    </label>
                    <select
                      value={formData.monthlyWeek}
                      onChange={(e) => setFormData({ ...formData, monthlyWeek: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        background: 'white',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="first">First</option>
                      <option value="second">Second</option>
                      <option value="third">Third</option>
                      <option value="fourth">Fourth</option>
                      <option value="last">Last</option>
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Day of Week
                    </label>
                    <select
                      value={formData.monthlyWeekday}
                      onChange={(e) => setFormData({ ...formData, monthlyWeekday: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        background: 'white',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Schedule */}
          {formData.scheduleType === 'custom' && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Custom Interval
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Every
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.customInterval}
                    onChange={(e) => setFormData({ ...formData, customInterval: parseInt(e.target.value) || 1 })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Unit
                  </label>
                  <select
                    value={formData.customUnit}
                    onChange={(e) => setFormData({ ...formData, customUnit: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'white',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Color */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Color
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    border: formData.color === color ? '3px solid #374151' : '2px solid #e5e7eb',
                    backgroundColor: color,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: formData.color === color ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: formData.color === color ? `0 0 0 3px ${color}20` : 'none'
                  }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid #f3f4f6'
          }}>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid #e5e7eb',
                background: 'white',
                color: '#6b7280',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                Cancel
              </Button>
            )}
            <Button type="submit" style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}>
              {isEditing ? 'Update Habit' : 'Create Habit'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
