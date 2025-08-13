'use client'

import React, { useState } from 'react'
import { HabitFormData, HabitWithEntries } from '@/types'
import { UnifiedHabitForm } from './unified-habit-form'

interface HabitFormProps {
  onSubmit: (data: HabitFormData) => void
  onCancel?: () => void
  habit?: HabitWithEntries
  isEditing?: boolean
}

export function HabitForm({ onSubmit, onCancel, habit, isEditing = false }: HabitFormProps) {
  const [loading, setLoading] = useState(false)

  const handleUnifiedSubmit = async (formData: HabitFormData) => {
    setLoading(true)
    
    try {
      onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <UnifiedHabitForm
      onSubmit={handleUnifiedSubmit}
      onCancel={onCancel}
      habit={habit}
      isEditing={isEditing}
      title={isEditing ? 'Edit Habit' : 'Create New Habit'}
      loading={loading}
    />
  )
}
