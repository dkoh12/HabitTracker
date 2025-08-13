'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { HabitFormData, HabitWithEntries } from '@/types'

interface UnifiedHabitFormProps {
  onSubmit: (formData: HabitFormData) => void
  onCancel?: () => void
  habit?: HabitWithEntries
  isEditing?: boolean
  title?: string
  loading?: boolean
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

export function UnifiedHabitForm({ 
  onSubmit, 
  onCancel, 
  habit, 
  isEditing = false,
  title,
  loading = false
}: UnifiedHabitFormProps) {
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
  
  const [targetInputValue, setTargetInputValue] = useState('')

  // Populate form data when editing
  useEffect(() => {
    if (habit && isEditing) {
      setFormData({
        name: habit.name,
        description: habit.description || '',
        color: habit.color || colors[0],
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
      setTargetInputValue(habit.target.toString())
    }
  }, [habit, isEditing])

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

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }))
  }

  const getDayAbbreviation = (day: string) => {
    const abbrevs: { [key: string]: string } = {
      sunday: 'Sun',
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat'
    }
    return abbrevs[day] || day
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
          {title || (isEditing ? 'Edit Habit' : 'Habit Details')}
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
                value={targetInputValue}
                onChange={(e) => {
                  const value = e.target.value
                  setTargetInputValue(value)
                  
                  if (value === '') {
                    // Don't update formData.target when empty, let it stay as is
                    return
                  }
                  
                  const numValue = parseInt(value)
                  if (!isNaN(numValue) && numValue > 0) {
                    setFormData({ ...formData, target: numValue })
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value
                  if (value === '' || isNaN(parseInt(value)) || parseInt(value) < 1) {
                    setTargetInputValue('')
                    setFormData({ ...formData, target: 1 })
                  }
                }}
                placeholder="1"
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
                placeholder="e.g., pages, minutes"
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
              Start Date *
            </label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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

          {/* End Date */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                id="hasEndDate"
                checked={formData.hasEndDate}
                onChange={(e) => setFormData({ ...formData, hasEndDate: e.target.checked, endDate: e.target.checked ? formData.endDate : '' })}
                style={{ marginRight: '0.5rem' }}
              />
              <label htmlFor="hasEndDate" style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Set end date
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
                  boxSizing: 'border-box'
                }}
              />
            )}
          </div>

          {/* Schedule Type */}
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

          {/* Weekly Schedule Options */}
          {formData.scheduleType === 'weekly' && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Select Days *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    style={{
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: formData.selectedDays.includes(day) ? '#3b82f6' : '#e5e7eb',
                      backgroundColor: formData.selectedDays.includes(day) ? '#3b82f6' : 'white',
                      color: formData.selectedDays.includes(day) ? 'white' : '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {getDayAbbreviation(day)}
                  </button>
                ))}
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
                <button
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    selectedDays: [] 
                  })}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Monthly Schedule Options */}
          {formData.scheduleType === 'monthly' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Monthly Type *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="radio"
                      value="date"
                      checked={formData.monthlyType === 'date'}
                      onChange={(e) => setFormData({ ...formData, monthlyType: e.target.value as 'date' | 'weekday' })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    On a specific date
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="radio"
                      value="weekday"
                      checked={formData.monthlyType === 'weekday'}
                      onChange={(e) => setFormData({ ...formData, monthlyType: e.target.value as 'date' | 'weekday' })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    On a specific weekday
                  </label>
                </div>
              </div>

              {formData.monthlyType === 'date' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Date (1-31) *
                  </label>
                  <Input
                    type="number"
                    value={formData.monthlyDate}
                    onChange={(e) => setFormData({ ...formData, monthlyDate: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="31"
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
              )}

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
                      Which Week *
                    </label>
                    <select
                      value={formData.monthlyWeek}
                      onChange={(e) => setFormData({ ...formData, monthlyWeek: e.target.value as 'first' | 'second' | 'third' | 'fourth' | 'last' })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem',
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
                      Day of Week *
                    </label>
                    <select
                      value={formData.monthlyWeekday}
                      onChange={(e) => setFormData({ ...formData, monthlyWeekday: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="sunday">Sunday</option>
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Schedule Options */}
          {formData.scheduleType === 'custom' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Every *
                </label>
                <Input
                  type="number"
                  value={formData.customInterval}
                  onChange={(e) => setFormData({ ...formData, customInterval: parseInt(e.target.value) || 1 })}
                  min="1"
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
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Time Unit *
                </label>
                <select
                  value={formData.customUnit}
                  onChange={(e) => setFormData({ ...formData, customUnit: e.target.value as 'days' | 'weeks' | 'months' })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
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
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: formData.color === color ? '3px solid #1f2937' : '2px solid #e5e7eb',
                    backgroundColor: color,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Submit and Cancel Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#374151',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Creating...' : (isEditing ? 'Update Habit' : 'Create Habit')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
