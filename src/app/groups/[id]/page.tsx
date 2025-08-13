'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GroupWithMembers } from '@/types'
import { ArrowLeft, Users, Calendar, TrendingUp, CheckCircle2, XCircle, Circle, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [groupId, setGroupId] = useState<string | null>(null)
  const [showAllMembers, setShowAllMembers] = useState(false)

  // Await params and set groupId
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setGroupId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  const fetchGroupDetail = async () => {
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
  }

  const { session, status } = useAuthValidation({
    onValidationSuccess: () => {
      if (groupId) {
        fetchGroupDetail()
      }
    }
  })

  // Re-run fetch when groupId changes
  useEffect(() => {
    if (groupId && session) {
      fetchGroupDetail()
    }
  }, [groupId])

  const fetchSpreadsheetData = async (groupData: GroupWithMembers) => {
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
  }

  useEffect(() => {
    if (group && groupId) {
      fetchSpreadsheetData(group)
    }
  }, [dateRange, group, groupId])

  const handleCreateSharedHabit = (newHabit: any) => {
    // Refresh the spreadsheet data to include the new shared habit
    if (group) {
      fetchSpreadsheetData(group)
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
    console.log('=== HABIT ENTRY CLICK DEBUG ===')
    console.log('Parameters received:', { habitId, date, memberId, currentEntry })
    console.log('Session user ID:', (session?.user as any)?.id)
    console.log('Session user info:', { 
      id: (session?.user as any)?.id, 
      email: session?.user?.email,
      name: session?.user?.name 
    })
    
    if (!groupId || !session?.user) return

    // Only allow users to update their own entries
    const currentUserId = (session.user as any).id
    console.log('Current user ID:', currentUserId, 'Member ID:', memberId)
    if (memberId !== currentUserId) {
      console.log('Not current user, skipping click')
      return // Don't allow clicking on other users' cells
    }

    console.log('Click handler called with:', { 
      habitId, 
      date, 
      memberId, 
      currentEntry,
      currentEntryDetails: currentEntry ? {
        id: currentEntry.id,
        value: currentEntry.value,
        completed: currentEntry.completed,
        userId: currentEntry.userId,
        habitId: currentEntry.habitId
      } : null,
      targetValue: spreadsheetData?.habits.find(h => h.id === habitId)?.target
    })

    try {
      const habit = spreadsheetData?.habits.find(h => h.id === habitId)
      const targetValue = habit?.target || 1
      
      let newValue: number
      let completed: boolean
      
      // Enhanced cycling: No Entry -> Completed -> Partial -> Not Started -> No Entry
      if (!currentEntry) {
        // No entry -> Go to completed
        newValue = targetValue
        completed = true
        console.log('State: No Entry -> Completed')
      } else if (currentEntry.completed || currentEntry.value >= targetValue) {
        // Completed -> Go to partial progress
        newValue = Math.max(1, Math.floor(targetValue / 2))
        completed = false
        console.log('State: Completed -> Partial Progress')
      } else if (currentEntry.value > 0 && currentEntry.value < targetValue && !currentEntry.completed) {
        // Partial progress -> Go to not started (red X)
        newValue = 0
        completed = false
        console.log('State: Partial Progress -> Not Started (red X)')
      } else if (currentEntry.value === 0 && !currentEntry.completed) {
        // Not started (red X) -> Go back to no entry (remove entry completely)
        // We'll handle this by deleting the entry in the API
        newValue = -1 // Special value to indicate deletion
        completed = false
        console.log('State: Not Started -> Delete Entry')
      } else {
        // Fallback: go to completed
        newValue = targetValue
        completed = true
        console.log('State: Fallback -> Completed')
      }

      console.log('Sending API request:', { date, value: newValue, completed })

      if (newValue === -1) {
        // Delete the entry
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
          console.log('API request successful, refreshing data')
          // Refresh spreadsheet data to show the update immediately
          if (group) {
            console.log('About to refresh spreadsheet data...')
            await fetchSpreadsheetData(group)
            console.log('Spreadsheet data refresh completed')
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
    console.log('formatDate: input =', dateString, 'parsed UTC =', date.toISOString(), 'formatted local =', date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }))
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getCompletionIcon = (entry: HabitEntry | null, habit: GroupHabitData) => {
    console.log('getCompletionIcon called with:', { entry, habit: { name: habit.name, target: habit.target } })
    
    if (!entry) {
      console.log('No entry - showing gray circle')
      return <Circle style={{ width: '28px', height: '28px', color: '#d1d5db' }} />
    }
    
    if (entry.completed || entry.value >= habit.target) {
      console.log('Completed - showing green checkmark')
      return <CheckCircle2 style={{ 
        width: '28px', 
        height: '28px', 
        color: '#10b981',
        filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))'
      }} />
    } else if (entry.value > 0) {
      console.log('Partial progress - showing yellow circle')
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
      // Entry exists but value is 0 - show red X
      console.log('Not started - showing red X')
      return <XCircle style={{ width: '28px', height: '28px', color: '#ef4444' }} />
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ 
            marginTop: '1rem', 
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: '500'
          }}>Loading group details...</p>
        </div>
      </div>
    )
  }

  if (!session || !group) return null

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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

        {/* Group Info */}
        <div style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          marginBottom: '2rem'
        }}>
          <Card style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <CardHeader style={{
              padding: '1.5rem 1.5rem 1rem 1.5rem',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <CardTitle style={{
                fontSize: '1.125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#1f2937',
                fontWeight: '600'
              }}>
                <TrendingUp style={{
                  width: '20px',
                  height: '20px',
                  color: '#10b981'
                }} />
                Habits
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '1.5rem' }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#10b981',
                marginBottom: '0.5rem'
              }}>
                {spreadsheetData?.habits.length || 0}
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>Shared habits</p>
            </CardContent>
          </Card>

          <Card style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <CardHeader style={{
              padding: '1.5rem 1.5rem 1rem 1.5rem',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <CardTitle style={{
                fontSize: '1.125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#1f2937',
                fontWeight: '600'
              }}>
                <Calendar style={{
                  width: '20px',
                  height: '20px',
                  color: '#8b5cf6'
                }} />
                Tracking
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '1.5rem' }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#8b5cf6',
                marginBottom: '0.5rem'
              }}>
                {dateRange}
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>Days tracked</p>
            </CardContent>
          </Card>
        </div>

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
                  gap: '0.5rem',
                  alignItems: 'center'
                }}>
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
                        
                        // Create combined list: owner + members (same as members management section)
                        const allMembers = [
                          { 
                            ...group.owner, 
                            role: 'OWNER',
                            id: group.owner.id  // Ensure consistent id field
                          },
                          ...spreadsheetData.members.filter(member => member.id !== group.owner.id) // Avoid duplicates
                        ]
                        
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
                            background: member.id === currentUserId
                              ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                              : member.role === 'OWNER'
                              ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                              : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
                          }}>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              {member.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt={member.name || member.email}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: member.id === currentUserId 
                                      ? '2px solid #3b82f6' 
                                      : member.role === 'OWNER'
                                      ? '2px solid #f59e0b'
                                      : '2px solid #e5e7eb'
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: member.id === currentUserId
                                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                    : member.role === 'OWNER'
                                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: member.id === currentUserId 
                                    ? '2px solid #3b82f6' 
                                    : member.role === 'OWNER'
                                    ? '2px solid #f59e0b'
                                    : '2px solid #e5e7eb'
                                }}>
                                  <span style={{
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    fontWeight: '600'
                                  }}>
                                    {(member.name || member.email).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span style={{
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: member.id === currentUserId 
                                  ? '#1e40af' 
                                  : member.role === 'OWNER'
                                  ? '#92400e'
                                  : '#374151',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                maxWidth: '100px'
                              }}>
                                {member.name || member.email.split('@')[0]}
                                {member.id === currentUserId && (
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
                            
                            // Create combined list: owner + members (same as header and members management)
                            const allMembers = [
                              { 
                                ...group.owner, 
                                role: 'OWNER',
                                id: group.owner.id  // Ensure consistent id field
                              },
                              ...spreadsheetData.members.filter(member => member.id !== group.owner.id) // Avoid duplicates
                            ]
                            
                            // Sort members: current user first, then others (same as header)
                            const sortedMembers = allMembers.sort((a, b) => {
                              if (a.id === currentUserId) return -1
                              if (b.id === currentUserId) return 1
                              return 0
                            })
                            
                            return sortedMembers.map(member => {
                              const entry = spreadsheetData.entries[date]?.[member.id]?.[habit.id]
                              const isCurrentUser = member.id === currentUserId
                              
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
                                    
                                    handleHabitEntryClick(habit.id, date, member.id, entry)
                                  }}
                                  onMouseEnter={(e) => {
                                    if (isCurrentUser) {
                                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                                      e.currentTarget.style.transform = 'scale(1.02)'
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (isCurrentUser) {
                                      e.currentTarget.style.backgroundColor = 'transparent'
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
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}>
                    ✓
                  </div>
                  Click on your own cells to cycle through progress states:
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
                  }}>Partial Progress</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <XCircle style={{
                    width: '28px',
                    height: '28px',
                    color: '#ef4444'
                  }} />
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: '500'
                  }}>Not Started</span>
                </div>
              </div>
                </>
              )}
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
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
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
                Group Members ({group.members.length + 1})
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
                  
                  // Create combined list: owner + members (no sorting in detail page)
                  const allMembers = [
                    { 
                      ...group.owner, 
                      role: 'OWNER',
                      memberUserId: group.owner.id,
                      user: group.owner
                    },
                    ...group.members.map(member => ({
                      ...member,
                      memberUserId: member.userId
                    }))
                  ]
                  
                  return allMembers.map(member => {
                    const isOwner = group.owner.id === currentUserId
                    const currentUserMembership = group.members.find(m => m.userId === currentUserId)
                    const isCurrentUserAdmin = currentUserMembership?.role === 'Admin'
                    const canManageRoles = isOwner || isCurrentUserAdmin
                    const isCurrentMember = member.memberUserId === currentUserId
                    const isOwnerEntry = member.role === 'OWNER'

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
                            background: member.role === 'OWNER'
                              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                              : member.role === 'Admin'
                              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                              : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                            color: 'white',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em'
                          }}>
                            {member.role === 'OWNER' ? 'Owner' : member.role === 'Admin' ? 'Admin' : 'Member'}
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
    </div>
    </>
  )
}
