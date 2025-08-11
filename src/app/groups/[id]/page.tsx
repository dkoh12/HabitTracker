'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SharedHabitForm } from '@/components/shared-habit-form'
import { GroupWithMembers } from '@/types'
import { ArrowLeft, Users, Calendar, TrendingUp, CheckCircle2, XCircle, Circle, Plus, BookOpen } from 'lucide-react'

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
  }[]
  habits: GroupHabitData[]
  entries: Record<string, Record<string, Record<string, HabitEntry | null>>> // date -> userId -> habitId -> entry
}

export default function GroupDetail({ params }: GroupDetailProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [group, setGroup] = useState<GroupWithMembers | null>(null)
  const [spreadsheetData, setSpreadsheetData] = useState<GroupSpreadsheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(30) // Last 30 days
  const [groupId, setGroupId] = useState<string | null>(null)
  const [showSharedHabitForm, setShowSharedHabitForm] = useState(false)

  // Await params and set groupId
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setGroupId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (status === 'loading' || !groupId) return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchGroupDetail()
  }, [session, status, router, groupId])

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

  const fetchSpreadsheetData = async (groupData: GroupWithMembers) => {
    if (!groupId) return
    
    try {
      const response = await fetch(`/api/groups/${groupId}/spreadsheet?days=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
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

  const handleHabitEntryClick = async (habitId: string, date: string, currentEntry: any) => {
    if (!groupId) return

    try {
      // Toggle completion or increment value
      const newValue = currentEntry ? (currentEntry.completed ? 0 : currentEntry.value + 1) : 1
      const completed = newValue > 0

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
        // Refresh spreadsheet data to show the update
        if (group) {
          fetchSpreadsheetData(group)
        }
      }
    } catch (error) {
      console.error('Error updating habit entry:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getCompletionIcon = (entry: HabitEntry | null, habit: GroupHabitData) => {
    if (!entry) {
      return <Circle className="w-5 h-5 text-gray-300" />
    }
    
    if (entry.completed || entry.value >= habit.target) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />
    } else if (entry.value > 0) {
      return (
        <div className="relative">
          <Circle className="w-5 h-5 text-orange-400" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          </div>
        </div>
      )
    } else {
      return <XCircle className="w-5 h-5 text-red-400" />
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
            gap: '0.75rem'
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
                <Users style={{
                  width: '20px',
                  height: '20px',
                  color: '#667eea'
                }} />
                Members
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '1.5rem' }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#667eea',
                marginBottom: '0.5rem'
              }}>
                {group.members.length + 1}
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>Active members</p>
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
                    onClick={() => setShowSharedHabitForm(true)}
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
                    <Plus style={{ width: '16px', height: '16px' }} />
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
                    onClick={() => setShowSharedHabitForm(true)}
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
                        fontSize: '0.875rem'
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
                        fontSize: '0.875rem'
                      }}>
                        Habit
                      </th>
                      {spreadsheetData.members.map(member => (
                        <th key={member.id} style={{
                          border: '1px solid #e5e7eb',
                          padding: '1rem',
                          textAlign: 'center',
                          minWidth: '120px',
                          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
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
                                  border: '2px solid #e5e7eb'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #e5e7eb'
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
                              color: '#374151',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              maxWidth: '100px'
                            }}>
                              {member.name || member.email.split('@')[0]}
                            </span>
                          </div>
                        </th>
                      ))}
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
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}>
                          {/* Date Column */}
                          <td style={{
                            position: 'sticky',
                            left: 0,
                            background: 'white',
                            borderRight: '2px solid #e5e7eb',
                            padding: '1rem',
                            borderBottom: '1px solid #e5e7eb',
                            verticalAlign: 'middle'
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
                            borderBottom: '1px solid #e5e7eb'
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
                          {spreadsheetData.members.map(member => {
                            const entry = spreadsheetData.entries[date]?.[member.id]?.[habit.id]
                            return (
                              <td 
                                key={member.id} 
                                style={{
                                  border: '1px solid #e5e7eb',
                                  padding: '1rem',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s ease'
                                }}
                                onClick={() => handleHabitEntryClick(habit.id, date, entry)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
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
                          })}
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
                <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600', width: '100%', marginBottom: '0.5rem' }}>
                  Click any cell to mark your progress:
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle2 style={{
                    width: '20px',
                    height: '20px',
                    color: '#10b981'
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
                      width: '20px',
                      height: '20px',
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
                        width: '8px',
                        height: '8px',
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
                    width: '20px',
                    height: '20px',
                    color: '#ef4444'
                  }} />
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: '500'
                  }}>Not Started</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Circle style={{
                    width: '20px',
                    height: '20px',
                    color: '#d1d5db'
                  }} />
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: '500'
                  }}>No Entry</span>
                </div>
              </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Group Description */}
        {group.description && (
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
                margin: 0
              }}>About This Group</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '1.5rem' }}>
              <p style={{
                color: '#374151',
                lineHeight: '1.6',
                fontSize: '1rem'
              }}>{group.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>

    {/* Shared Habit Form Modal */}
    {showSharedHabitForm && groupId && (
      <SharedHabitForm
        groupId={groupId}
        onClose={() => setShowSharedHabitForm(false)}
        onSuccess={handleCreateSharedHabit}
      />
    )}
    </>
  )
}
