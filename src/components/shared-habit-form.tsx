'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { HabitFormData } from '@/types'
import { UnifiedHabitForm } from './unified-habit-form'

interface SharedHabitFormProps {
  groupId: string
  onClose: () => void
  onSuccess: (habit: any) => void
}

export function SharedHabitForm({ groupId, onClose, onSuccess }: SharedHabitFormProps) {
  const [loading, setLoading] = useState(false)

  const handleUnifiedSubmit = async (formData: HabitFormData) => {
    setLoading(true)

    try {
      // Prepare the data to send (use full HabitFormData - no conversion needed)
      const habitData = {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        target: formData.target,
        unit: formData.unit,
        startDate: formData.startDate,
        endDate: formData.hasEndDate ? formData.endDate : null,
        scheduleType: formData.scheduleType,
        selectedDays: formData.scheduleType === 'weekly' ? formData.selectedDays : [],
        monthlyType: formData.scheduleType === 'monthly' ? formData.monthlyType : null,
        monthlyDate: formData.scheduleType === 'monthly' && formData.monthlyType === 'date' ? formData.monthlyDate : null,
        monthlyWeekday: formData.scheduleType === 'monthly' && formData.monthlyType === 'weekday' ? formData.monthlyWeekday : null,
        monthlyWeek: formData.scheduleType === 'monthly' && formData.monthlyType === 'weekday' ? formData.monthlyWeek : null,
        customInterval: formData.scheduleType === 'custom' ? formData.customInterval : null,
        customUnit: formData.scheduleType === 'custom' ? formData.customUnit : null
      }

      const response = await fetch(`/api/groups/${groupId}/shared-habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(habitData)
      })

      if (response.ok) {
        const newHabit = await response.json()
        onSuccess(newHabit)
        onClose()
      } else {
        throw new Error('Failed to create shared habit')
      }
    } catch (error) {
      console.error('Error creating shared habit:', error)
      alert('Failed to create shared habit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-0.5rem',
            right: '-0.5rem',
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            background: 'white',
            border: '2px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <X size={16} color="#6b7280" />
        </button>

        {/* Unified form */}
        <UnifiedHabitForm
          onSubmit={handleUnifiedSubmit}
          onCancel={onClose}
          title="Create Shared Group Habit"
          loading={loading}
        />
      </div>
    </div>
  )
}
