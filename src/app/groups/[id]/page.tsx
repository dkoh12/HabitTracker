'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GroupWithMembers } from '@/types'
import { ArrowLeft, Users, Calendar, TrendingUp, CheckCircle2, XCircle, Circle, BookOpen, ChevronDown, ChevronUp, Edit3, Trash2, Eye } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAuthValidation } from '@/hooks/useAuthValidation'

interface GroupDetailProps {
  params: Promise<{
    id: string
  }>
}

interface HabitEntry {
  id: string
  habitId: string
  userId: string
  date: string
  value: number
  completed: boolean
}

interface GroupHabitData {
  id: string
  name: string
  description: string | null
  color: string
  target: number
  unit: string | null
  frequency: string
  userId: string
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
}

interface GroupSpreadsheetData {
  dates: string[]
  members: {
    id: string
    name: string
    email: string
    avatar: string | null
    role: string
  }[]
  habits: GroupHabitData[]
  entries: Record<string, Record<string, Record<string, HabitEntry | null>>> // date -> userId -> habitId -> entry
}

export default function GroupDetail({ params }: GroupDetailProps) {
  const router = useRouter()
  const [group, setGroup] = useState<GroupWithMembers | null>(null)
  const [spreadsheetData, setSpreadsheetData] = useState<GroupSpreadsheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(30) // Last 30 days
  const [selectedLeaderboardHabit, setSelectedLeaderboardHabit] = useState('overall') // Filter for leaderboard
  const [selectedChartHabit, setSelectedChartHabit] = useState('overall') // Filter for daily progress chart
  const [selectedChartTimeRange, setSelectedChartTimeRange] = useState(7) // Time range for daily progress chart
  const [groupId, setGroupId] = useState<string | null>(null)
  const [showAllMembers, setShowAllMembers] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState<GroupHabitData | null>(null)
  const [showHabitModal, setShowHabitModal] = useState(false)
  const [modalType, setModalType] = useState<'view' | 'edit' | 'delete'>('view')
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    color: '',
    target: 1,
    unit: '',
    frequency: 'daily'
  })

  // Await params and set groupId
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setGroupId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  const fetchSpreadsheetData = useCallback(async (groupData: GroupWithMembers) => {
    if (!groupId) return
    
    try {
      const response = await fetch(`/api/groups/${groupId}/spreadsheet?days=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched spreadsheet data:', data)
        setSpreadsheetData(data)
      }
    } catch (error) {
      console.error('Error fetching spreadsheet data:', error)
    }
  }, [groupId, dateRange])

  const fetchGroupDetail = useCallback(async () => {
    if (!groupId) return
    
    try {
      const response = await fetch(`/api/groups/${groupId}`)
      if (response.ok) {
        const groupData = await response.json()
        setGroup(groupData)
        await fetchSpreadsheetData(groupData)
      } else if (response.status === 404) {
        router.push('/groups')
      }
    } catch (error) {
      console.error('Error fetching group detail:', error)
    } finally {
      setLoading(false)
    }
  }, [groupId, fetchSpreadsheetData, router])

  const onValidationSuccess = useCallback(() => {
    if (groupId) {
      fetchGroupDetail()
    }
  }, [groupId, fetchGroupDetail])

  const { session, status } = useAuthValidation({
    onValidationSuccess
  })

  // Re-run fetch when groupId changes
  useEffect(() => {
    if (groupId && session) {
      fetchGroupDetail()
    }
  }, [groupId, session, fetchGroupDetail])

  useEffect(() => {
    if (group && groupId) {
      fetchSpreadsheetData(group)
    }
  }, [dateRange, group, groupId, fetchSpreadsheetData])

  const handleCreateSharedHabit = useCallback((newHabit: any) => {
    // Refresh the spreadsheet data to include the new shared habit
    if (group) {
      fetchSpreadsheetData(group)
    }
  }, [group, fetchSpreadsheetData])

  const handleViewHabit = (habit: GroupHabitData) => {
    setSelectedHabit(habit)
    setModalType('view')
    setShowHabitModal(true)
  }

  const handleEditHabit = (habit: GroupHabitData) => {
    setSelectedHabit(habit)
    setEditFormData({
      name: habit.name,
      description: habit.description || '',
      color: habit.color,
      target: habit.target,
      unit: habit.unit || '',
      frequency: habit.frequency
    })
    setModalType('edit')
    setShowHabitModal(true)
  }

  const handleDeleteHabit = (habit: GroupHabitData) => {
    setSelectedHabit(habit)
    setModalType('delete')
    setShowHabitModal(true)
  }

  const confirmDeleteHabit = async () => {
    if (!selectedHabit || !groupId) return

    try {
      const response = await fetch(`/api/groups/${groupId}/shared-habits/${selectedHabit.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setShowHabitModal(false)
        setSelectedHabit(null)
        // Refresh the data
        if (group) {
          await fetchSpreadsheetData(group)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete habit')
      }
    } catch (error) {
      console.error('Error deleting habit:', error)
      alert('An error occurred while deleting the habit')
    }
  }

  const saveHabitChanges = async () => {
    if (!selectedHabit || !groupId) return

    try {
      const response = await fetch(`/api/groups/${groupId}/shared-habits/${selectedHabit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      })

      if (response.ok) {
        setShowHabitModal(false)
        setSelectedHabit(null)
        // Refresh the data
        if (group) {
          await fetchSpreadsheetData(group)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update habit')
      }
    } catch (error) {
      console.error('Error updating habit:', error)
      alert('An error occurred while updating the habit')
    }
  }

  const handleLeaveGroup = async () => {
    if (!groupId || !session?.user) return

    // Check if user is the group owner
    const currentUserId = (session.user as any).id
    const isOwner = group?.owner.id === currentUserId
    
    if (isOwner) {
      alert('Group owners cannot leave their own group. Transfer ownership or delete the group instead.')
      return
    }

    const confirmLeave = window.confirm('Are you sure you want to leave this group? You will lose access to all shared habits and your progress data will remain but be inaccessible to you.')
    
    if (!confirmLeave) return

    try {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Redirect to groups page after successfully leaving
        router.push('/groups')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to leave group')
      }
    } catch (error) {
      console.error('Error leaving group:', error)
      alert('An error occurred while trying to leave the group')
    }
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!groupId || !session?.user) return

    const confirmChange = window.confirm(
      `Are you sure you want to change this member's role to ${newRole.toLowerCase()}?`
    )
    
    if (!confirmChange) return

    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        // Refresh the group data to reflect the role change
        await fetchGroupDetail()
        // Also refresh spreadsheet data to update member roles
        if (group) {
          await fetchSpreadsheetData(group)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to change member role')
      }
    } catch (error) {
      console.error('Error changing member role:', error)
      alert('An error occurred while trying to change the member role')
    }
  }

  const handleHabitEntryClick = async (habitId: string, date: string, memberId: string, currentEntry: any) => {
    if (!groupId || !session?.user) return

    // Only allow users to update their own entries
    const currentUserId = (session.user as any).id
    if (memberId !== currentUserId) {
      return // Don't allow clicking on other users' cells
    }

    try {
      const habit = spreadsheetData?.habits.find(h => h.id === habitId)
      const targetValue = habit?.target || 1
      
      // Prompt user for custom input like in dashboard spreadsheet
      const formatDate = (dateString: string) => {
        const date = new Date(dateString + 'T12:00:00') // Parse as local date at noon
        return date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      }
      
      const currentValue = currentEntry?.value || 0
      const inputValue = prompt(
        `Enter value for ${habit?.name} on ${formatDate(date)}:\n(Target: ${targetValue}${habit?.unit ? ` ${habit.unit}` : ''})`,
        currentValue.toString()
      )
      
      // If user cancels, don't update
      if (inputValue === null) return
      
      const newValue = parseFloat(inputValue)
      if (isNaN(newValue) || newValue < 0) {
        alert('Please enter a valid number (0 or greater)')
        return
      }
      
      const completed = newValue >= targetValue

      console.log('Sending API request:', { date, value: newValue, completed })

      if (newValue === 0) {
        // Delete the entry if value is 0
        const response = await fetch(`/api/groups/${groupId}/shared-habits/${habitId}/entries`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            date
          })
        })

        if (response.ok) {
          console.log('Entry deleted successfully, refreshing data')
          // Refresh spreadsheet data to show the update immediately
          if (group) {
            console.log('About to refresh spreadsheet data after deletion...')
            await fetchSpreadsheetData(group)
            console.log('Spreadsheet data refresh completed after deletion')
          }
        } else {
          console.error('Delete request failed:', response.status, await response.text())
        }
      } else {
        // Create or update the entry
        const response = await fetch(`/api/groups/${groupId}/shared-habits/${habitId}/entries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            date,
            value: newValue,
            completed
          })
        })

        if (response.ok) {
          // Refresh spreadsheet data to show the update immediately
          if (group) {
            await fetchSpreadsheetData(group)
          }
        } else {
          console.error('API request failed:', response.status, await response.text())
        }
      }
    } catch (error) {
      console.error('Error updating habit entry:', error)
    }
  }

  const formatDate = (dateString: string) => {
    // Parse UTC date from backend and display in local timezone
    const date = new Date(dateString + 'T00:00:00.000Z')
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getCompletionIcon = (entry: HabitEntry | null, habit: GroupHabitData) => {
    if (!entry) {
      return <Circle style={{ width: '28px', height: '28px', color: '#d1d5db' }} />
    }
    
    if (entry.completed || entry.value >= habit.target) {
      return <CheckCircle2 style={{ 
        width: '28px', 
        height: '28px', 
        color: '#10b981',
        filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))'
      }} />
    } else if (entry.value > 0) {
      const percentage = (entry.value / habit.target) * 100
      if (percentage >= 50) {
        return (
          <div style={{ position: 'relative' }}>
            <Circle style={{ width: '28px', height: '28px', color: '#f59e0b' }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                background: '#f59e0b',
                borderRadius: '50%'
              }}></div>
            </div>
          </div>
        )
      } else {
        return (
          <div style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderBottom: '17px solid #f59e0b'
            }}></div>
          </div>
        )
      }
    } else {
      // Entry exists but value is 0 - show red X
      return <XCircle style={{ width: '28px', height: '28px', color: '#ef4444' }} />
    }
  }

  // Skip loading screen - render immediately when session exists
  if (status === 'loading') return null

  if (!session || !group) return null

  return (
    <>
      <style jsx>{`
        @keyframes goldBorderPulse {
          0% {
            border-color: #f59e0b;
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.8), 0 0 40px rgba(217, 119, 6, 0.6), 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          25% {
            border-color: #fbbf24;
            box-shadow: 0 0 25px rgba(251, 191, 36, 0.9), 0 0 50px rgba(245, 158, 11, 0.7), 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          50% {
            border-color: #fcd34d;
            box-shadow: 0 0 30px rgba(252, 211, 77, 1), 0 0 60px rgba(251, 191, 36, 0.8), 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          75% {
            border-color: #fbbf24;
            box-shadow: 0 0 25px rgba(251, 191, 36, 0.9), 0 0 50px rgba(245, 158, 11, 0.7), 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          100% {
            border-color: #f59e0b;
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.8), 0 0 40px rgba(217, 119, 6, 0.6), 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        }
      `}</style>
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
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/groups')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              color: '#374151',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Groups
          </Button>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: group.description ? '0.5rem' : 0
              }}>
                <Users style={{
                  width: '32px',
                  height: '32px',
                  color: '#667eea'
                }} />
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: 0
                }}>{group.name}</h1>
              </div>
              {group.description && (
                <p style={{
                  fontSize: '1.125rem',
                  color: '#6b7280',
                  margin: 0,
                  marginLeft: '2.75rem', // Align with title (32px icon + 0.75rem gap)
                  lineHeight: '1.5',
                  fontWeight: '400'
                }}>{group.description}</p>
              )}
            </div>
            
            {/* Show Leave Group button only if user is not the owner */}
            {(() => {
              const hasSession = !!session?.user
              const sessionUserId = (session?.user as any)?.id
              const groupOwnerId = group?.owner.id
              const isOwner = sessionUserId === groupOwnerId
              const shouldShowButton = hasSession && !isOwner
              
              console.log('Leave Group Button Debug:', {
                hasSession,
                sessionUserId,
                groupOwnerId,
                isOwner,
                shouldShowButton
              })
              
              return shouldShowButton
            })() && (
              <Button
                onClick={handleLeaveGroup}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#b91c1c'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#dc2626'
                }}
              >
                Leave Group
              </Button>
            )}
          </div>
        </div>

        {/* Group Habits Management */}
        {spreadsheetData && spreadsheetData.habits.length > 0 && (
          <Card style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            marginBottom: '1.5rem',
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
                  color: '#1f2937',
                  margin: 0
                }}>
                  Group Habits ({spreadsheetData.habits.length})
                </CardTitle>
                <Button
                  onClick={() => router.push(`/groups/${groupId}/create-habit`)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  Add Shared Habit
                </Button>
              </div>
            </CardHeader>
            <CardContent style={{ padding: '0' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '0.875rem',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Habit
                      </th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '0.875rem',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Target
                      </th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '0.875rem',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Frequency
                      </th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '0.875rem',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Created by
                      </th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '0.875rem',
                        borderBottom: '1px solid #e5e7eb',
                        width: '120px'
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {spreadsheetData.habits.map((habit, index) => {
                      const currentUserId = (session?.user as any)?.id
                      const isGroupOwner = group?.owner.id === currentUserId
                      const membership = group?.members.find(m => m.userId === currentUserId)
                      const isAdmin = membership?.role === 'Admin'
                      const canManage = isGroupOwner || isAdmin
                      
                      return (
                        <tr key={habit.id} style={{
                          borderBottom: index < spreadsheetData.habits.length - 1 ? '1px solid #f3f4f6' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem'
                            }}>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: habit.color,
                                flexShrink: 0,
                                boxShadow: `0 0 0 2px ${habit.color}20`
                              }} />
                              <div>
                                <div style={{
                                  fontWeight: '500',
                                  color: '#1f2937',
                                  fontSize: '0.875rem',
                                  marginBottom: '0.25rem'
                                }}>
                                  {habit.name}
                                </div>
                                {habit.description && (
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: '#6b7280',
                                    lineHeight: '1.4'
                                  }}>
                                    {habit.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              fontSize: '0.875rem',
                              color: '#1f2937',
                              fontWeight: '500'
                            }}>
                              {habit.target}{habit.unit && ` ${habit.unit}`}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              fontSize: '0.875rem',
                              color: '#1f2937',
                              textTransform: 'capitalize',
                              background: '#f3f4f6',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px'
                            }}>
                              {habit.frequency}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              {habit.user.avatar ? (
                                <img
                                  src={habit.user.avatar}
                                  alt={habit.user.name || habit.user.email}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    border: '1px solid #d1d5db'
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid #d1d5db'
                                }}>
                                  <span style={{
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                  }}>
                                    {(habit.user.name || habit.user.email).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span style={{
                                fontSize: '0.875rem',
                                color: '#1f2937'
                              }}>
                                {habit.user.name || habit.user.email}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{
                              display: 'flex',
                              gap: '0.5rem',
                              justifyContent: 'flex-end'
                            }}>
                              <button
                                onClick={() => handleViewHabit(habit)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '0.5rem',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'background-color 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                                title="View habit details"
                              >
                                <Eye style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                              </button>
                              
                              {canManage && (
                                <>
                                  <button
                                    onClick={() => handleEditHabit(habit)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '0.5rem',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#fef3c7'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                    title="Edit habit"
                                  >
                                    <Edit3 style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                                  </button>
                                  
                                  <button
                                    onClick={() => handleDeleteHabit(habit)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '0.5rem',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#fee2e2'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                    title="Delete habit"
                                  >
                                    <Trash2 style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Spreadsheet */}
        {spreadsheetData && (
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
                  color: '#1f2937',
                  margin: 0
                }}>Group Progress Tracker</CardTitle>
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
                      background: dateRange === 7 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
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
                      background: dateRange === 30 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                      color: dateRange === 30 ? 'white' : '#374151',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    30 days
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent style={{ padding: '0' }}>
              {spreadsheetData.habits.length === 0 ? (
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
                  }}>No Shared Group Habits Yet</h3>
                  <p style={{
                    color: '#6b7280',
                    marginBottom: '2rem',
                    fontSize: '1rem',
                    lineHeight: '1.6'
                  }}>
                    Create shared habits that all group members can participate in together!
                    <br />
                    Perfect for book clubs, fitness challenges, or learning goals.
                  </p>
                  <Button
                    onClick={() => router.push(`/groups/${groupId}/create-habit`)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0 auto'
                    }}
                  >
                    <BookOpen style={{ width: '20px', height: '20px' }} />
                    Create First Shared Habit
                  </Button>
                </div>
              ) : (
                <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.875rem'
                  }}>
                  {/* Header Row */}
                  <thead>
                    <tr>
                      <th style={{
                        position: 'sticky',
                        left: 0,
                        background: 'white',
                        borderRight: '2px solid #e5e7eb',
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        minWidth: '120px',
                        color: '#374151',
                        fontSize: '0.875rem',
                        zIndex: 3
                      }}>
                        Date
                      </th>
                      <th style={{
                        position: 'sticky',
                        left: '120px',
                        background: 'white',
                        borderRight: '2px solid #e5e7eb',
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        minWidth: '200px',
                        color: '#374151',
                        fontSize: '0.875rem',
                        zIndex: 2
                      }}>
                        Habit
                      </th>
                      {(() => {
                        const currentUserId = (session?.user as any)?.id
                        
                        // Use only group.members since owner is now included there
                        const allMembers = group.members
                        
                        // Sort members: current user first, then others
                        const sortedMembers = allMembers.sort((a, b) => {
                          if (a.id === currentUserId) return -1
                          if (b.id === currentUserId) return 1
                          return 0
                        })
                        
                        return sortedMembers.map(member => (
                          <th key={member.id} style={{
                            border: '1px solid #e5e7eb',
                            padding: '1rem',
                            textAlign: 'center',
                            minWidth: '120px',
                            background: member.userId === currentUserId
                              ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                              : member.role === 'Owner'
                              ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                              : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
                          }}>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              {member.user.avatar ? (
                                <img
                                  src={member.user.avatar}
                                  alt={member.user.name || member.user.email}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: member.userId === currentUserId 
                                      ? '2px solid #3b82f6' 
                                      : member.role === 'Owner'
                                      ? '2px solid #f59e0b'
                                      : '2px solid #e5e7eb'
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: member.userId === currentUserId
                                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                    : member.role === 'Owner'
                                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: member.userId === currentUserId 
                                    ? '2px solid #3b82f6' 
                                    : member.role === 'Owner'
                                    ? '2px solid #f59e0b'
                                    : '2px solid #e5e7eb'
                                }}>
                                  <span style={{
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    fontWeight: '600'
                                  }}>
                                    {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span style={{
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: member.userId === currentUserId 
                                  ? '#1e40af' 
                                  : member.role === 'Owner'
                                  ? '#92400e'
                                  : '#374151',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                maxWidth: '100px'
                              }}>
                                {member.user.name || member.user.email.split('@')[0]}
                                {member.userId === currentUserId && (
                                  <span style={{
                                    display: 'block',
                                    fontSize: '0.75rem',
                                    color: '#3b82f6',
                                    fontWeight: '400'
                                  }}>
                                    (You)
                                  </span>
                                )}
                              </span>
                            </div>
                          </th>
                        ))
                      })()}
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody>
                    {spreadsheetData.dates.map(date => 
                      spreadsheetData.habits.map((habit, habitIndex) => (
                        <tr key={`${date}-${habit.id}`} style={{
                          transition: 'background-color 0.2s ease',
                          borderTop: habitIndex === 0 ? '2px solid #e5e7eb' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          const row = e.currentTarget
                          row.style.backgroundColor = '#f9fafb'
                          // Keep sticky columns white on hover
                          const stickyColumns = row.querySelectorAll('td[style*="position: sticky"]')
                          stickyColumns.forEach(col => {
                            ;(col as HTMLElement).style.backgroundColor = 'white'
                          })
                        }}
                        onMouseLeave={(e) => {
                          const row = e.currentTarget
                          row.style.backgroundColor = 'transparent'
                          // Reset sticky columns to white
                          const stickyColumns = row.querySelectorAll('td[style*="position: sticky"]')
                          stickyColumns.forEach(col => {
                            ;(col as HTMLElement).style.backgroundColor = 'white'
                          })
                        }}>
                          {/* Date Column */}
                          <td style={{
                            position: 'sticky',
                            left: 0,
                            background: 'white',
                            borderRight: '2px solid #e5e7eb',
                            padding: '1rem',
                            borderBottom: '1px solid #e5e7eb',
                            verticalAlign: 'middle',
                            zIndex: 3
                          }}>
                            {habitIndex === 0 && (
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem'
                              }}>
                                <div style={{
                                  fontWeight: '600',
                                  color: '#1f2937',
                                  fontSize: '0.875rem'
                                }}>
                                  {formatDate(date)}
                                </div>
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: '#6b7280'
                                }}>
                                  {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                              </div>
                            )}
                          </td>
                          
                          {/* Habit Column */}
                          <td style={{
                            position: 'sticky',
                            left: '120px',
                            background: 'white',
                            borderRight: '2px solid #e5e7eb',
                            padding: '1rem',
                            borderBottom: '1px solid #e5e7eb',
                            zIndex: 2
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem'
                            }}>
                              <div
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  backgroundColor: habit.color,
                                  flexShrink: 0,
                                  boxShadow: `0 0 0 2px ${habit.color}20`
                                }}
                              />
                              <div style={{
                                minWidth: 0,
                                flex: 1
                              }}>
                                <div style={{
                                  fontWeight: '500',
                                  color: '#1f2937',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                  fontSize: '0.875rem'
                                }}>{habit.name}</div>
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: '#6b7280'
                                }}>
                                  Target: {habit.target}{habit.unit && ` ${habit.unit}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          {/* Member Progress Columns */}
                          {(() => {
                            const currentUserId = (session?.user as any)?.id
                            
                            // Use only group.members since owner is now included there
                            const allMembers = group.members
                            
                            // Sort members: current user first, then others (same as header)
                            const sortedMembers = allMembers.sort((a, b) => {
                              if (a.userId === currentUserId) return -1
                              if (b.userId === currentUserId) return 1
                              return 0
                            })
                            
                            return sortedMembers.map(member => {
                              const entry = spreadsheetData.entries[date]?.[member.userId]?.[habit.id]
                              const isCurrentUser = member.userId === currentUserId
                              
                              return (
                                <td 
                                  key={member.id} 
                                  style={{
                                    border: '1px solid #e5e7eb',
                                    padding: '1rem',
                                    textAlign: 'center',
                                    cursor: isCurrentUser ? 'pointer' : 'default',
                                    transition: 'all 0.2s ease',
                                    transform: 'scale(1)',
                                    backgroundColor: isCurrentUser ? 'transparent' : '#f9fafb',
                                    opacity: isCurrentUser ? 1 : 0.7
                                  }}
                                  onClick={(e) => {
                                    if (!isCurrentUser) return
                                    
                                    // Add click animation - store reference to avoid null error
                                    const target = e.currentTarget
                                    target.style.transform = 'scale(0.95)'
                                    target.style.backgroundColor = '#e0f2fe'
                                    setTimeout(() => {
                                      if (target) {
                                        target.style.transform = 'scale(1)'
                                        target.style.backgroundColor = 'transparent'
                                      }
                                    }, 150)
                                    
                                    handleHabitEntryClick(habit.id, date, member.userId, entry)
                                  }}
                                  onMouseEnter={(e) => {
                                    if (isCurrentUser) {
                                      e.currentTarget.style.outline = '2px solid #10b981'
                                      e.currentTarget.style.outlineOffset = '-1px'
                                      e.currentTarget.style.position = 'relative'
                                      e.currentTarget.style.zIndex = '20'
                                      e.currentTarget.style.transform = 'scale(1.02)'
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (isCurrentUser) {
                                      e.currentTarget.style.outline = 'none'
                                      e.currentTarget.style.outlineOffset = '0'
                                      e.currentTarget.style.position = 'static'
                                      e.currentTarget.style.zIndex = 'auto'
                                      e.currentTarget.style.transform = 'scale(1)'
                                    } else {
                                      e.currentTarget.style.backgroundColor = '#f9fafb'
                                    }
                                  }}
                                >
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}>
                                    {getCompletionIcon(entry, habit)}
                                    {entry && entry.value > 0 && (
                                      <span style={{
                                        fontSize: '0.75rem',
                                        color: '#6b7280'
                                      }}>
                                        {entry.value}{habit.unit && ` ${habit.unit}`}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              )
                            })
                          })()}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Legend - only show when there are habits */}
              <div style={{
                marginTop: '1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: '#374151', 
                  fontWeight: '600', 
                  width: '100%', 
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  Legend
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Circle style={{
                    width: '28px',
                    height: '28px',
                    color: '#d1d5db'
                  }} />
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: '500'
                  }}>No Entry</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle2 style={{
                    width: '28px',
                    height: '28px',
                    color: '#10b981',
                    filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))'
                  }} />
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: '500'
                  }}>Completed</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{ position: 'relative' }}>
                    <Circle style={{
                      width: '28px',
                      height: '28px',
                      color: '#f59e0b'
                    }} />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        background: '#f59e0b',
                        borderRadius: '50%'
                      }}></div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: '500'
                  }}>Partial Progress (≥50% of target)</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: 0,
                      height: 0,
                      borderLeft: '10px solid transparent',
                      borderRight: '10px solid transparent',
                      borderBottom: '17px solid #f59e0b'
                    }}></div>
                  </div>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: '500'
                  }}>Getting Started (&lt;50% of target)</span>
                </div>
              </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Group Statistics */}
        {spreadsheetData && spreadsheetData.habits.length > 0 && (
          <Card style={{
            marginTop: '2rem',
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
              <CardTitle style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18"/>
                  <path d="m19 9-5 5-4-4-3 3"/>
                </svg>
                Group Statistics
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '1.5rem' }}>
              {(() => {
                const currentUserId = (session?.user as any)?.id;
                
                // Prepare data for statistics
                // Use only group.members since owner is now included there
                const allMembers = group.members;

                // Calculate overall completion statistics
                const totalPossibleEntries = spreadsheetData.dates.length * spreadsheetData.habits.length * allMembers.length;
                let totalEntries = 0;
                let totalCompleted = 0;
                let totalPartial = 0;

                // Member-specific statistics
                const memberStats = allMembers.map(member => {
                  let totalPercentagePoints = 0;
                  let memberCompleted = 0;
                  let memberPartial = 0;
                  let memberEntries = 0;

                  spreadsheetData.dates.forEach(date => {
                    spreadsheetData.habits.forEach(habit => {
                      const entry = spreadsheetData.entries[date]?.[member.userId]?.[habit.id];
                      if (entry && entry.value > 0) {
                        memberEntries++;
                        totalEntries++;
                        
                        // Calculate normalized percentage for this entry
                        const normalizedPercentage = Math.min((entry.value / habit.target) * 100, 100);
                        totalPercentagePoints += normalizedPercentage;
                        
                        if (entry.value >= habit.target) {
                          memberCompleted++;
                          totalCompleted++;
                        } else {
                          memberPartial++;
                          totalPartial++;
                        }
                      }
                    });
                  });

                  const totalPossiblePercentage = spreadsheetData.dates.length * spreadsheetData.habits.length * 100;
                  const completionRate = totalPossiblePercentage > 0 ? (totalPercentagePoints / totalPossiblePercentage) * 100 : 0;

                  return {
                    ...member,
                    entries: memberEntries,
                    completed: memberCompleted,
                    partial: memberPartial,
                    completionRate: Math.round(completionRate)
                  };
                });

                // Habit-specific statistics
                const habitStats = spreadsheetData.habits.map(habit => {
                  let totalPercentagePoints = 0;
                  let habitCompleted = 0;
                  let habitPartial = 0;
                  let habitEntries = 0;

                  spreadsheetData.dates.forEach(date => {
                    allMembers.forEach(member => {
                      const entry = spreadsheetData.entries[date]?.[member.userId]?.[habit.id];
                      if (entry && entry.value > 0) {
                        habitEntries++;
                        
                        // Calculate normalized percentage for this entry
                        const normalizedPercentage = Math.min((entry.value / habit.target) * 100, 100);
                        totalPercentagePoints += normalizedPercentage;
                        
                        if (entry.value >= habit.target) {
                          habitCompleted++;
                        } else {
                          habitPartial++;
                        }
                      }
                    });
                  });

                  const totalPossiblePercentage = spreadsheetData.dates.length * allMembers.length * 100;
                  const completionRate = totalPossiblePercentage > 0 ? (totalPercentagePoints / totalPossiblePercentage) * 100 : 0;

                  return {
                    ...habit,
                    entries: habitEntries,
                    completed: habitCompleted,
                    partial: habitPartial,
                    completionRate: Math.round(completionRate)
                  };
                });

                // Daily progress over time
                const dailyProgress = spreadsheetData.dates.map(date => {
                  let totalPercentagePoints = 0;
                  let dayCompleted = 0;
                  let dayPartial = 0;
                  let dayEntries = 0;

                  allMembers.forEach(member => {
                    spreadsheetData.habits.forEach(habit => {
                      const entry = spreadsheetData.entries[date]?.[member.userId]?.[habit.id];
                      if (entry && entry.value > 0) {
                        dayEntries++;
                        
                        // Calculate normalized percentage for this entry
                        const normalizedPercentage = Math.min((entry.value / habit.target) * 100, 100);
                        totalPercentagePoints += normalizedPercentage;
                        
                        if (entry.value >= habit.target) {
                          dayCompleted++;
                        } else {
                          dayPartial++;
                        }
                      }
                    });
                  });

                  const totalPossiblePercentage = allMembers.length * spreadsheetData.habits.length * 100;
                  const completionRate = totalPossiblePercentage > 0 ? (totalPercentagePoints / totalPossiblePercentage) * 100 : 0;

                  return {
                    date,
                    entries: dayEntries,
                    completed: dayCompleted,
                    partial: dayPartial,
                    completionRate: Math.round(completionRate)
                  };
                });

                const overallCompletionRate = totalPossibleEntries > 0 ? Math.round(((totalCompleted + totalPartial) / totalPossibleEntries) * 100) : 0;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Overview Statistics */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem'
                    }}>
                      <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        borderRadius: '12px',
                        border: '1px solid #3b82f6'
                      }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '0.5rem' }}>
                          {overallCompletionRate}%
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '500' }}>
                          Overall Completion Rate
                        </div>
                      </div>
                      
                      <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                        borderRadius: '12px',
                        border: '1px solid #10b981'
                      }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669', marginBottom: '0.5rem' }}>
                          {totalCompleted}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '500' }}>
                          Goals Completed
                        </div>
                      </div>

                      <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        borderRadius: '12px',
                        border: '1px solid #f59e0b'
                      }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706', marginBottom: '0.5rem' }}>
                          {totalPartial}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#d97706', fontWeight: '500' }}>
                          Partial Progress
                        </div>
                      </div>

                      <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                        borderRadius: '12px',
                        border: '1px solid #6b7280'
                      }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>
                          {allMembers.length}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                          Active Members
                        </div>
                      </div>
                    </div>

                    {/* Leaderboard */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                          🏆 Leaderboard
                        </h3>
                        
                        {/* Habit Filter Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Filter by:</span>
                          <select
                            value={selectedLeaderboardHabit}
                            onChange={(e) => setSelectedLeaderboardHabit(e.target.value)}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              border: '2px solid #e5e7eb',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              color: '#374151',
                              background: 'white',
                              cursor: 'pointer',
                              minWidth: '150px'
                            }}
                          >
                            <option value="overall">Overall</option>
                            {spreadsheetData.habits.map(habit => (
                              <option key={habit.id} value={habit.id}>
                                {habit.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {(() => {
                          // Calculate filtered member stats based on selected habit
                          const filteredMemberStats = allMembers.map(member => {
                            let totalPercentagePoints = 0;
                            let memberCompleted = 0;
                            let memberPartial = 0;
                            let memberEntries = 0;
                            let totalPossiblePercentage = 0;

                            if (selectedLeaderboardHabit === 'overall') {
                              // Overall stats (existing logic)
                              spreadsheetData.dates.forEach(date => {
                                spreadsheetData.habits.forEach(habit => {
                                  const entry = spreadsheetData.entries[date]?.[member.userId]?.[habit.id];
                                  if (entry && entry.value > 0) {
                                    memberEntries++;
                                    const normalizedPercentage = Math.min((entry.value / habit.target) * 100, 100);
                                    totalPercentagePoints += normalizedPercentage;
                                    
                                    if (entry.value >= habit.target) {
                                      memberCompleted++;
                                    } else {
                                      memberPartial++;
                                    }
                                  }
                                });
                              });
                              totalPossiblePercentage = spreadsheetData.dates.length * spreadsheetData.habits.length * 100;
                            } else {
                              // Single habit stats
                              const selectedHabit = spreadsheetData.habits.find(h => h.id === selectedLeaderboardHabit);
                              if (selectedHabit) {
                                spreadsheetData.dates.forEach(date => {
                                  const entry = spreadsheetData.entries[date]?.[member.userId]?.[selectedHabit.id];
                                  if (entry && entry.value > 0) {
                                    memberEntries++;
                                    const normalizedPercentage = Math.min((entry.value / selectedHabit.target) * 100, 100);
                                    totalPercentagePoints += normalizedPercentage;
                                    
                                    if (entry.value >= selectedHabit.target) {
                                      memberCompleted++;
                                    } else {
                                      memberPartial++;
                                    }
                                  }
                                });
                                totalPossiblePercentage = spreadsheetData.dates.length * 100;
                              }
                            }

                            const completionRate = totalPossiblePercentage > 0 ? (totalPercentagePoints / totalPossiblePercentage) * 100 : 0;

                            return {
                              ...member,
                              entries: memberEntries,
                              completed: memberCompleted,
                              partial: memberPartial,
                              completionRate: Math.round(completionRate)
                            };
                          });

                          return filteredMemberStats
                            .sort((a, b) => b.completionRate - a.completionRate)
                            .map((member, index) => {
                              const isCurrentUser = member.userId === currentUserId;
                              const isTopThree = index < 3;
                              
                              // Medal colors for top 3
                              const medalColors = {
                                0: { bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', border: '#d97706', text: '#92400e' }, // Gold
                                1: { bg: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)', border: '#9ca3af', text: '#374151' }, // Silver
                                2: { bg: 'linear-gradient(135deg, #cd7c2f 0%, #a16207 100%)', border: '#92400e', text: '#451a03' }  // Bronze
                              };
                              
                              // Background and border colors
                              let cardStyle;
                              if (isTopThree && isCurrentUser) {
                                // Current user in top 3: medal color with special glow effect
                                const medalColor = (medalColors as any)[index];
                                cardStyle = {
                                  background: medalColor.bg,
                                  border: index === 0 
                                    ? `3px solid #f59e0b`
                                    : `3px solid ${medalColor.border}`,
                                  boxShadow: index === 0 
                                    ? `0 0 20px rgba(245, 158, 11, 0.8), 0 0 40px rgba(217, 119, 6, 0.6), 0 4px 12px rgba(0, 0, 0, 0.15)`
                                    : `0 0 20px ${medalColor.border}40, 0 4px 12px rgba(0, 0, 0, 0.15)`,
                                  transform: 'scale(1)',
                                  animation: index === 0 ? 'goldBorderPulse 2s ease-in-out infinite' : 'none'
                                };
                              } else if (isTopThree) {
                                // Other users in top 3: medal colors
                                const medalColor = (medalColors as any)[index];
                                cardStyle = {
                                  background: medalColor.bg,
                                  border: index === 0 
                                    ? `2px solid #f59e0b`
                                    : `2px solid ${medalColor.border}`,
                                  boxShadow: index === 0 
                                    ? `0 0 20px rgba(245, 158, 11, 0.8), 0 0 40px rgba(217, 119, 6, 0.6)`
                                    : 'none',
                                  transform: 'scale(1)',
                                  animation: index === 0 ? 'goldBorderPulse 2s ease-in-out infinite' : 'none'
                                };
                              } else if (isCurrentUser) {
                                // Current user not in top 3: blue
                                cardStyle = {
                                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                  border: '3px solid #3b82f6',
                                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
                                  transform: 'scale(1)'
                                };
                              } else {
                                // Other users not in top 3: white
                                cardStyle = {
                                  background: 'white',
                                  border: '1px solid #e5e7eb',
                                  boxShadow: 'none',
                                  transform: 'scale(1)'
                                };
                              }
                              
                              return (
                                <div key={member.id} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '1rem',
                                  padding: '1rem',
                                  borderRadius: '8px',
                                  transition: 'all 0.2s ease',
                                  ...cardStyle
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: isTopThree ? 'rgba(255, 255, 255, 0.9)' : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                                    border: isTopThree ? `2px solid ${(medalColors as any)[index]?.border || '#d1d5db'}` : '2px solid #d1d5db',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    color: isTopThree ? (medalColors as any)[index]?.text || '#6b7280' : '#6b7280'
                                  }}>
                                    {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                                  </div>
                                  
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '180px' }}>
                                    {member.user.avatar ? (
                                      <img
                                        src={member.user.avatar}
                                        alt={member.user.name || member.user.email}
                                        style={{
                                          width: '32px',
                                          height: '32px',
                                          borderRadius: '50%',
                                          border: isCurrentUser ? '2px solid #3b82f6' : '2px solid #e5e7eb'
                                        }}
                                      />
                                    ) : (
                                      <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: isCurrentUser 
                                          ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: isCurrentUser ? '2px solid #3b82f6' : '2px solid #e5e7eb'
                                      }}>
                                        <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>
                                          {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <div>
                                      <span style={{ 
                                        fontSize: '0.875rem', 
                                        fontWeight: isCurrentUser ? '700' : '500', 
                                        color: isTopThree ? '#1f2937' : (isCurrentUser ? '#1e40af' : '#1f2937')
                                      }}>
                                        {member.user.name || member.user.email.split('@')[0]}
                                        {isCurrentUser && <span style={{ color: isTopThree ? '#1f2937' : '#3b82f6', marginLeft: '0.25rem' }}>(You)</span>}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                      flex: 1,
                                      height: '12px',
                                      background: isTopThree ? 'rgba(255, 255, 255, 0.7)' : '#f3f4f6',
                                      borderRadius: '6px',
                                      overflow: 'hidden',
                                      position: 'relative'
                                    }}>
                                      <div style={{
                                        width: `${member.completionRate}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                        transition: 'width 0.5s ease',
                                        boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)'
                                      }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                                      <span style={{ 
                                        fontSize: '1.25rem', 
                                        fontWeight: 'bold', 
                                        color: isTopThree ? '#1f2937' : (isCurrentUser ? '#1e40af' : '#1f2937')
                                      }}>
                                        {member.completionRate}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                        })()}
                      </div>
                    </div>

                    {/* Performance Comparison Chart */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                        You vs Group Performance
                      </h3>
                      {(() => {
                        const currentUserStats = memberStats.find(m => m.userId === currentUserId);
                        if (!currentUserStats) return null;
                        
                        const groupAverage = Math.round(memberStats.reduce((sum, m) => sum + m.completionRate, 0) / memberStats.length);
                        const userVsGroup = currentUserStats.completionRate - groupAverage;
                        
                        return (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '1rem'
                          }}>
                            <div style={{
                              padding: '1.5rem',
                              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                              borderRadius: '8px',
                              border: '2px solid #3b82f6',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '0.5rem' }}>
                                {currentUserStats.completionRate}%
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '500' }}>
                                Your Performance
                              </div>
                            </div>
                            
                            <div style={{
                              padding: '1.5rem',
                              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                              borderRadius: '8px',
                              border: '1px solid #9ca3af',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>
                                {groupAverage}%
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                                Group Average
                              </div>
                            </div>
                            
                            <div style={{
                              padding: '1.5rem',
                              background: userVsGroup > 0 
                                ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                                : userVsGroup < 0
                                ? 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)'
                                : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                              borderRadius: '8px',
                              border: userVsGroup > 0 
                                ? '1px solid #10b981'
                                : userVsGroup < 0
                                ? '1px solid #ef4444'
                                : '1px solid #f59e0b',
                              textAlign: 'center'
                            }}>
                              <div style={{ 
                                fontSize: '2.5rem', 
                                fontWeight: 'bold',
                                color: userVsGroup > 0 
                                  ? '#059669'
                                  : userVsGroup < 0
                                  ? '#dc2626'
                                  : '#d97706',
                                marginBottom: '0.5rem'
                              }}>
                                {userVsGroup > 0 ? '+' : ''}{userVsGroup}%
                              </div>
                              <div style={{ 
                                fontSize: '0.875rem',
                                color: userVsGroup > 0 
                                  ? '#059669'
                                  : userVsGroup < 0
                                  ? '#dc2626'
                                  : '#d97706',
                                fontWeight: '500'
                              }}>
                                {userVsGroup > 0 
                                  ? 'Above group average!'
                                  : userVsGroup < 0
                                  ? 'Room for improvement!'
                                  : 'Right on average!'}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Habit Performance Comparison */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                        Habit Performance Breakdown
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {habitStats.map(habit => {
                          const currentUserHabitStats = (() => {
                            let totalPercentagePoints = 0;
                            let userCompleted = 0;
                            let userPartial = 0;
                            let userEntries = 0;

                            spreadsheetData.dates.forEach(date => {
                              const entry = spreadsheetData.entries[date]?.[currentUserId]?.[habit.id];
                              if (entry && entry.value > 0) {
                                userEntries++;
                                
                                // Calculate normalized percentage for this entry
                                const normalizedPercentage = Math.min((entry.value / habit.target) * 100, 100);
                                totalPercentagePoints += normalizedPercentage;
                                
                                if (entry.value >= habit.target) {
                                  userCompleted++;
                                } else {
                                  userPartial++;
                                }
                              }
                            });

                            const totalPossiblePercentage = spreadsheetData.dates.length * 100;
                            const userCompletionRate = totalPossiblePercentage > 0 ? (totalPercentagePoints / totalPossiblePercentage) * 100 : 0;
                            
                            return { userCompletionRate: Math.round(userCompletionRate), userCompleted, userPartial, userEntries };
                          })();

                          return (
                            <div key={habit.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem',
                              padding: '1rem',
                              background: 'white',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px' }}>
                                <div style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  backgroundColor: habit.color,
                                  flexShrink: 0
                                }} />
                                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                                  {habit.name}
                                </span>
                              </div>
                              
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280' }}>
                                  <span>You: {currentUserHabitStats.userCompletionRate}%</span>
                                  <span>Group: {habit.completionRate}%</span>
                                </div>
                                <div style={{ position: 'relative', height: '20px', background: '#f3f4f6', borderRadius: '10px', overflow: 'hidden' }}>
                                  {/* Group average bar (background) */}
                                  <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: `${habit.completionRate}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #9ca3af 0%, #6b7280 100%)',
                                    opacity: 0.3
                                  }} />
                                  {/* User progress bar */}
                                  <div style={{
                                    position: 'absolute',
                                    top: '2px',
                                    left: '2px',
                                    width: `calc(${Math.min(currentUserHabitStats.userCompletionRate, 100)}% - 4px)`,
                                    height: 'calc(100% - 4px)',
                                    background: currentUserHabitStats.userCompletionRate >= habit.completionRate
                                      ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                      : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                                    borderRadius: '8px',
                                    transition: 'width 0.5s ease'
                                  }} />
                                  {/* Comparison indicator */}
                                  {currentUserHabitStats.userCompletionRate !== habit.completionRate && (
                                    <div style={{
                                      position: 'absolute',
                                      top: '50%',
                                      left: `${Math.max(currentUserHabitStats.userCompletionRate, habit.completionRate)}%`,
                                      transform: 'translateY(-50%)',
                                      fontSize: '0.75rem',
                                      color: currentUserHabitStats.userCompletionRate > habit.completionRate ? '#10b981' : '#ef4444',
                                      fontWeight: 'bold'
                                    }}>
                                      {currentUserHabitStats.userCompletionRate > habit.completionRate ? '↗' : '↙'}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', minWidth: '120px', textAlign: 'right' }}>
                                Target: {habit.target}{habit.unit && ` ${habit.unit}`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Daily Progress Trend Comparison */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                          📈 Daily Progress: You vs Group
                        </h3>
                        
                        {/* Chart Filters */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          {/* Habit Filter */}
                          {spreadsheetData.habits.length > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Habit:</span>
                              <select
                                value={selectedChartHabit}
                                onChange={(e) => setSelectedChartHabit(e.target.value)}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '6px',
                                  border: '2px solid #e5e7eb',
                                  fontSize: '0.875rem',
                                  fontWeight: '500',
                                  color: '#374151',
                                  background: 'white',
                                  cursor: 'pointer',
                                  minWidth: '120px'
                                }}
                              >
                                <option value="overall">Overall</option>
                                {spreadsheetData.habits.map(habit => (
                                  <option key={habit.id} value={habit.id}>
                                    {habit.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {/* Time Range Filter */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Range:</span>
                            <select
                              value={selectedChartTimeRange}
                              onChange={(e) => setSelectedChartTimeRange(parseInt(e.target.value))}
                              style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                border: '2px solid #e5e7eb',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: '#374151',
                                background: 'white',
                                cursor: 'pointer',
                                minWidth: '100px'
                              }}
                            >
                              <option value={7}>7 days</option>
                              <option value={14}>14 days</option>
                              <option value={30}>30 days</option>
                              <option value={60}>60 days</option>
                              <option value={90}>90 days</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        padding: '1rem',
                        height: '500px'
                      }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={(() => {
                              // Sort daily progress by date descending (most recent first), then take the selected range
                              const sortedDailyProgress = [...dailyProgress].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                              
                              // Filter daily progress data based on selected time range and habit
                              const filteredDailyProgress = sortedDailyProgress
                                .slice(0, selectedChartTimeRange) // Take the first N days (most recent)
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort back to ascending for display
                                .map(day => {
                                  let groupCompletionRate = day.completionRate;
                                  
                                  if (selectedChartHabit !== 'overall') {
                                    // Calculate for specific habit
                                    const selectedHabitData = spreadsheetData.habits.find(h => h.id === selectedChartHabit);
                                    if (selectedHabitData) {
                                      let totalPercentagePoints = 0;
                                      let dayEntries = 0;

                                      allMembers.forEach(member => {
                                        const entry = spreadsheetData.entries[day.date]?.[member.userId]?.[selectedHabitData.id];
                                        if (entry && entry.value > 0) {
                                          dayEntries++;
                                          const normalizedPercentage = Math.min((entry.value / selectedHabitData.target) * 100, 100);
                                          totalPercentagePoints += normalizedPercentage;
                                        }
                                      });

                                      const totalPossiblePercentage = allMembers.length * 100;
                                      groupCompletionRate = totalPossiblePercentage > 0 ? Math.round((totalPercentagePoints / totalPossiblePercentage) * 100) : 0;
                                    } else {
                                      groupCompletionRate = 0;
                                    }
                                  }

                                  // Calculate user's daily progress for selected habit/overall
                                  const userDailyProgress = (() => {
                                    let userTotalPercentagePoints = 0;

                                    if (selectedChartHabit === 'overall') {
                                      spreadsheetData.habits.forEach(habit => {
                                        const entry = spreadsheetData.entries[day.date]?.[currentUserId]?.[habit.id];
                                        if (entry && entry.value > 0) {
                                          const normalizedPercentage = Math.min((entry.value / habit.target) * 100, 100);
                                          userTotalPercentagePoints += normalizedPercentage;
                                        }
                                      });

                                      const userTotalPossiblePercentage = spreadsheetData.habits.length * 100;
                                      return userTotalPossiblePercentage > 0 ? Math.round((userTotalPercentagePoints / userTotalPossiblePercentage) * 100) : 0;
                                    } else {
                                      const selectedHabitData = spreadsheetData.habits.find(h => h.id === selectedChartHabit);
                                      if (!selectedHabitData) return 0;

                                      const entry = spreadsheetData.entries[day.date]?.[currentUserId]?.[selectedHabitData.id];
                                      if (entry && entry.value > 0) {
                                        const normalizedPercentage = Math.min((entry.value / selectedHabitData.target) * 100, 100);
                                        return Math.round(normalizedPercentage);
                                      }
                                      return 0;
                                    }
                                  })();

                                  return {
                                    date: new Date(day.date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric' 
                                    }),
                                    'Your Progress': userDailyProgress,
                                    'Group Average': groupCompletionRate
                                  };
                                });

                              return filteredDailyProgress;
                            })()}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#6b7280"
                              fontSize={12}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis 
                              stroke="#6b7280"
                              fontSize={12}
                              domain={[0, 100]}
                              tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip 
                              formatter={(value, name) => [`${value}%`, name]}
                              labelStyle={{ color: '#374151' }}
                              contentStyle={{ 
                                backgroundColor: '#f9fafb', 
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            <Bar 
                              dataKey="Group Average" 
                              fill="#9ca3af" 
                              opacity={0.6}
                              name="Group Average"
                            />
                            <Bar 
                              dataKey="Your Progress" 
                              fill="#10b981"
                              name="Your Progress"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Group Members Management */}
        {group && spreadsheetData && (
          <Card style={{
            marginTop: '2rem',
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
              <CardTitle style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
              onClick={() => setShowAllMembers(!showAllMembers)}
              >
                <Users style={{ width: '20px', height: '20px' }} />
                Group Members ({group.members.length})
                {showAllMembers ? (
                  <ChevronUp style={{ width: '16px', height: '16px', marginLeft: 'auto' }} />
                ) : (
                  <ChevronDown style={{ width: '16px', height: '16px', marginLeft: 'auto' }} />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: showAllMembers ? '1.5rem' : '0' }}>
              {showAllMembers && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(() => {
                  const currentUserId = (session?.user as any)?.id
                  
                  // Use only group.members since owner is now included there
                  const allMembers = group.members.map(member => ({
                    ...member,
                    memberUserId: member.userId
                  }))
                  
                  return allMembers.map(member => {
                    const isOwner = group.owner.id === currentUserId
                    const currentUserMembership = group.members.find(m => m.userId === currentUserId)
                    const isCurrentUserAdmin = currentUserMembership?.role === 'Admin'
                    const canManageRoles = isOwner || isCurrentUserAdmin
                    const isCurrentMember = member.memberUserId === currentUserId
                    const isOwnerEntry = member.role === 'Owner'

                    return (
                      <div key={member.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        borderRadius: '8px',
                        background: isOwnerEntry
                          ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                          : member.role === 'Admin' 
                          ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                          : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                        border: isOwnerEntry
                          ? '1px solid #f59e0b'
                          : member.role === 'Admin'
                          ? '1px solid #3b82f6'
                          : '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {member.user.avatar ? (
                            <img
                              src={member.user.avatar}
                              alt={member.user.name || member.user.email}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                border: isOwnerEntry
                                  ? '2px solid #f59e0b'
                                  : isCurrentMember
                                  ? '2px solid #3b82f6'
                                  : member.role === 'Admin' 
                                  ? '2px solid #3b82f6' 
                                  : '2px solid #6b7280'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: isCurrentMember
                                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                : isOwnerEntry
                                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                : member.role === 'Admin'
                                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: isCurrentMember
                                ? '2px solid #3b82f6'
                                : isOwnerEntry
                                ? '2px solid #f59e0b'
                                : member.role === 'Admin' 
                                ? '2px solid #3b82f6' 
                                : '2px solid #6b7280'
                            }}>
                              <span style={{
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: '600'
                              }}>
                                {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div style={{
                              fontWeight: '600',
                              color: isCurrentMember
                                ? '#1e40af'
                                : isOwnerEntry
                                ? '#92400e'
                                : member.role === 'Admin' 
                                ? '#1e40af' 
                                : '#374151'
                            }}>
                              {member.user.name || member.user.email.split('@')[0]}
                              {isCurrentMember && (
                                <span style={{
                                  marginLeft: '0.5rem',
                                  fontSize: '0.75rem',
                                  color: '#3b82f6',
                                  fontWeight: '400'
                                }}>
                                  (You)
                                </span>
                              )}
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: isCurrentMember
                                ? '#1d4ed8'
                                : isOwnerEntry
                                ? '#78350f'
                                : member.role === 'Admin' 
                                ? '#1d4ed8' 
                                : '#6b7280'
                            }}>
                              {member.user.email}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: member.role === 'Owner'
                              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                              : member.role === 'Admin'
                              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                              : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                            color: 'white',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em'
                          }}>
                            {member.role === 'Owner' ? 'Owner' : member.role === 'Admin' ? 'Admin' : 'Member'}
                          </span>
                          
                          {canManageRoles && !isOwnerEntry && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {member.role === 'Member' ? (
                                <button
                                  onClick={() => handleRoleChange(member.id, 'Admin')}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    borderRadius: '4px',
                                    border: '1px solid #3b82f6',
                                    background: 'white',
                                    color: '#3b82f6',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#3b82f6'
                                    e.currentTarget.style.color = 'white'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'white'
                                    e.currentTarget.style.color = '#3b82f6'
                                  }}
                                >
                                  Promote to Admin
                                </button>
                              ) : (
                                // Only show demote if not demoting self or if there are other admins
                                (() => {
                                  const otherAdmins = group.members.filter(m => 
                                    m.userId !== member.memberUserId && m.role === 'Admin'
                                  )
                                  const hasOtherAdmins = otherAdmins.length > 0 || isOwner
                                  const canDemote = !isCurrentMember || hasOtherAdmins
                                  
                                  if (canDemote) {
                                    return (
                                      <button
                                        onClick={() => handleRoleChange(member.id, 'Member')}
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: '0.75rem',
                                          fontWeight: '500',
                                          borderRadius: '4px',
                                          border: '1px solid #6b7280',
                                          background: 'white',
                                          color: '#6b7280',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = '#6b7280'
                                          e.currentTarget.style.color = 'white'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = 'white'
                                          e.currentTarget.style.color = '#6b7280'
                                        }}
                                      >
                                        Demote to Member
                                      </button>
                                    )
                                  }
                                  return null
                                })()
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                })()}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Habit Management Modal */}
      {showHabitModal && selectedHabit && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}
        onClick={() => setShowHabitModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                margin: 0,
                color: '#1f2937'
              }}>
                {modalType === 'view' ? 'View Habit' : 
                 modalType === 'edit' ? 'Edit Habit' : 
                 'Delete Habit'}
              </h2>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              {modalType === 'view' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: selectedHabit.color,
                      boxShadow: `0 0 0 2px ${selectedHabit.color}20`
                    }} />
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      margin: 0,
                      color: '#1f2937'
                    }}>{selectedHabit.name}</h3>
                  </div>
                  
                  {selectedHabit.description && (
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>Description</label>
                      <p style={{
                        color: '#6b7280',
                        margin: 0,
                        lineHeight: '1.5'
                      }}>{selectedHabit.description}</p>
                    </div>
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>Target</label>
                      <p style={{
                        color: '#1f2937',
                        margin: 0,
                        fontWeight: '500'
                      }}>{selectedHabit.target}{selectedHabit.unit && ` ${selectedHabit.unit}`}</p>
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>Frequency</label>
                      <p style={{
                        color: '#1f2937',
                        margin: 0,
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>{selectedHabit.frequency}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>Created by</label>
                    <p style={{
                      color: '#1f2937',
                      margin: 0,
                      fontWeight: '500'
                    }}>{selectedHabit.user.name || selectedHabit.user.email}</p>
                  </div>
                </div>
              )}
              
              {modalType === 'edit' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>Habit Name *</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>Description</label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>Color</label>
                      <input
                        type="color"
                        value={editFormData.color}
                        onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                        style={{
                          width: '100%',
                          height: '40px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          outline: 'none'
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
                      }}>Target *</label>
                      <input
                        type="number"
                        min="1"
                        value={editFormData.target}
                        onChange={(e) => setEditFormData({ ...editFormData, target: parseInt(e.target.value) || 1 })}
                        style={{
                          width: '80px',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>Unit</label>
                      <input
                        type="text"
                        value={editFormData.unit}
                        onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                        placeholder="e.g., pages, minutes"
                        style={{
                          width: '120px',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {modalType === 'delete' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem'
                  }}>⚠️</div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#1f2937'
                  }}>Are you sure you want to delete this habit?</h3>
                  <p style={{
                    color: '#6b7280',
                    marginBottom: '1.5rem',
                    lineHeight: '1.5'
                  }}>
                    This action cannot be undone. All progress data for "{selectedHabit.name}" will be permanently deleted for all group members.
                  </p>
                </div>
              )}
            </div>
            
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <Button
                onClick={() => setShowHabitModal(false)}
                variant="outline"
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  color: '#6b7280',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </Button>
              
              {modalType === 'edit' && (
                <Button
                  onClick={saveHabitChanges}
                  disabled={!editFormData.name.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: !editFormData.name.trim() 
                      ? '#d1d5db' 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: !editFormData.name.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  Save Changes
                </Button>
              )}
              
              {modalType === 'delete' && (
                <Button
                  onClick={confirmDeleteHabit}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Delete Habit
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
