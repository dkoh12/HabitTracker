'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GroupWithMembers, GroupFormData } from '@/types'
import { Users, Plus, Copy, UserPlus, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuthValidation } from '@/hooks/useAuthValidation'

export default function Groups() {
  const router = useRouter()
  const [groups, setGroups] = useState<GroupWithMembers[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [createFormData, setCreateFormData] = useState<GroupFormData>({ name: '', description: '' })
  const [inviteCode, setInviteCode] = useState('')
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({})

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const { session, status } = useAuthValidation({
    onValidationSuccess: fetchGroups
  })

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createFormData)
      })

      if (response.ok) {
        setShowCreateForm(false)
        setCreateFormData({ name: '', description: '' })
        fetchGroups()
      }
    } catch (error) {
      console.error('Error creating group:', error)
    }
  }

  const joinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inviteCode })
      })

      if (response.ok) {
        setShowJoinForm(false)
        setInviteCode('')
        fetchGroups()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to join group')
      }
    } catch (error) {
      console.error('Error joining group:', error)
    }
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    alert('Invite code copied to clipboard!')
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
          }}>Loading your groups...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}>Groups</h1>
            <p style={{
              color: '#6b7280',
              fontSize: '1.1rem'
            }}>Share habits and track progress together</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button onClick={() => setShowJoinForm(true)} variant="outline" style={{
              padding: '0.75rem 1.5rem',
              border: '2px solid #667eea',
              background: 'white',
              color: '#667eea',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}>
              <UserPlus className="w-4 h-4" />
              Join Group
            </Button>
            <Button onClick={() => setShowCreateForm(true)} style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}>
              <Plus className="w-4 h-4" />
              Create Group
            </Button>
          </div>
        </div>

        {showCreateForm && (
          <Card style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <CardHeader style={{
              padding: '1.5rem',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <CardTitle style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>🏗️ Create New Group</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '1.5rem' }}>
              <form onSubmit={createGroup} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                    color: '#374151'
                  }}>
                    Group Name *
                  </label>
                  <Input
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    placeholder="e.g., Family Fitness, Study Buddies"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      background: 'white'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                    color: '#374151'
                  }}>
                    Description
                  </label>
                  <Input
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                    placeholder="Optional description"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      background: 'white'
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #f3f4f6'
                }}>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} style={{
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
                  }}>Create Group</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {showJoinForm && (
          <Card style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <CardHeader style={{
              padding: '1.5rem',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <CardTitle style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>🤝 Join Group</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '1.5rem' }}>
              <form onSubmit={joinGroup} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                    color: '#374151'
                  }}>
                    Invite Code *
                  </label>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter the invite code"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      background: 'white'
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #f3f4f6'
                }}>
                  <Button type="button" variant="outline" onClick={() => setShowJoinForm(false)} style={{
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
                  }}>Join Group</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))'
        }}>
          {groups.map(group => (
            <Card 
              key={group.id} 
              onClick={() => router.push(`/groups/${group.id}`)}
              style={{
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)'
              }}
            >
              <CardHeader style={{
                padding: '1rem 1.5rem 0.75rem',
                borderBottom: '1px solid #f3f4f6',
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <CardTitle style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0'
                  }}>
                    <Users style={{
                      width: '20px',
                      height: '20px',
                      color: '#667eea'
                    }} />
                    <span>{group.name}</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent style={{ padding: '1rem 1.5rem 1.5rem' }}>
                {group.description && (
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#6b7280',
                    marginBottom: '0.5rem',
                    marginTop: '0',
                    lineHeight: '1.5'
                  }}>{group.description}</p>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      marginBottom: '0.75rem',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      👥 Members ({group.members.length + 1})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(() => {
                        const currentUserId = (session?.user as any)?.id
                        
                        // Create combined list: owner + members
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
                        
                        // Sort: current user first, then others
                        const sortedMembers = allMembers.sort((a, b) => {
                          if (a.memberUserId === currentUserId) return -1
                          if (b.memberUserId === currentUserId) return 1
                          return 0
                        })
                        
                        return sortedMembers.slice(0, expandedMembers[group.id] ? sortedMembers.length : 5).map(member => {
                          const isCurrentUser = member.memberUserId === currentUserId
                          const isOwnerEntry = member.role === 'OWNER'
                          const isCurrentUserOwner = isCurrentUser && isOwnerEntry
                          
                          return (
                            <div key={member.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.85rem',
                              padding: '0.5rem',
                              background: isCurrentUser
                                ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                                : '#f8fafc',
                              borderRadius: '8px',
                              border: isCurrentUser
                                ? '1px solid #3b82f6'
                                : '1px solid #f1f5f9'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                color: isCurrentUser
                                  ? '#1e40af'
                                  : '#1f2937', 
                                fontWeight: '500' 
                              }}>
                                {member.user.avatar ? (
                                  <img
                                    src={member.user.avatar}
                                    alt={member.user.name || member.user.email}
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '50%',
                                      border: isCurrentUser
                                        ? '1px solid #3b82f6'
                                        : '1px solid #d1d5db'
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: isCurrentUser
                                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                      : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: isCurrentUser
                                      ? '1px solid #3b82f6'
                                      : '1px solid #d1d5db'
                                  }}>
                                    <span style={{
                                      color: 'white',
                                      fontSize: '0.75rem',
                                      fontWeight: '600'
                                    }}>
                                      {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <span>
                                  {member.user.name || member.user.email}
                                  {isCurrentUser && (
                                    <span style={{
                                      marginLeft: '0.5rem',
                                      fontSize: '0.75rem',
                                      color: '#3b82f6',
                                      fontWeight: '400'
                                    }}>
                                      (You)
                                    </span>
                                  )}
                                </span>
                              </div>
                              <span style={{
                                fontSize: '0.75rem',
                                background: member.role === 'OWNER'
                                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                  : member.role === 'Admin'
                                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                  : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontWeight: '600',
                                textTransform: 'capitalize'
                              }}>
                                {member.role === 'OWNER' ? 'Owner' : member.role}
                              </span>
                            </div>
                          )
                        })
                      })()}
                      {(() => {
                        const currentUserId = (session?.user as any)?.id
                        const totalMembers = group.members.length + 1 // +1 for owner
                        
                        return totalMembers > 5 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation() // Prevent event bubbling to parent Card
                              setExpandedMembers(prev => ({
                                ...prev,
                                [group.id]: !prev[group.id]
                              }))
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              width: '100%',
                              padding: '0.5rem',
                              background: 'transparent',
                              border: '1px dashed #d1d5db',
                              borderRadius: '8px',
                              color: '#6b7280',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              marginTop: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f9fafb'
                              e.currentTarget.style.borderColor = '#9ca3af'
                              e.currentTarget.style.color = '#374151'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.borderColor = '#d1d5db'
                              e.currentTarget.style.color = '#6b7280'
                            }}
                          >
                            {expandedMembers[group.id] ? (
                              <>
                                <ChevronUp size={16} />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown size={16} />
                                Show {totalMembers - 5} More Members
                              </>
                            )}
                          </button>
                        )
                      })()}
                    </div>
                  </div>

                  {group.groupHabits.length > 0 && (
                    <div>
                      <h4 style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        marginBottom: '0.75rem',
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        🎯 Shared Habits ({group.groupHabits.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {group.groupHabits.map((groupHabit, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.85rem',
                            padding: '0.5rem',
                            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                            borderRadius: '8px',
                            border: '1px solid #bbf7d0'
                          }}>
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: groupHabit.habit.color,
                                boxShadow: `0 0 0 2px ${groupHabit.habit.color}20`
                              }}
                            />
                            <span style={{ color: '#1f2937', fontWeight: '500' }}>
                              {groupHabit.habit.name}
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              marginLeft: 'auto'
                            }}>
                              by {groupHabit.habit.user.name || groupHabit.habit.user.email}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {group.ownerId === (session.user as any)?.id && (
                    <div style={{
                      paddingTop: '1rem',
                      borderTop: '1px solid #f3f4f6'
                    }}>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        🔑 Invite Code: 
                        <code style={{
                          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          color: '#374151',
                          fontWeight: '600'
                        }}>{group.inviteCode}</code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyInviteCode(group.inviteCode)
                          }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #e5e7eb',
                            background: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.75rem',
                            height: 'auto'
                          }}
                        >
                          <Copy style={{
                            width: '12px',
                            height: '12px',
                            color: '#6b7280'
                          }} />
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {groups.length === 0 && (
          <Card style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent style={{
              textAlign: 'center',
              padding: '3rem 2rem'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem'
              }}>👥</div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#1f2937'
              }}>No groups yet</h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '2rem',
                fontSize: '1.1rem',
                lineHeight: '1.6'
              }}>
                Create your first group or join an existing one to start sharing habits!
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                <Button onClick={() => setShowJoinForm(true)} variant="outline" style={{
                  padding: '0.75rem 1.5rem',
                  border: '2px solid #667eea',
                  background: 'white',
                  color: '#667eea',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}>
                  Join Group
                </Button>
                <Button onClick={() => setShowCreateForm(true)} style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease'
                }}>
                  Create Group
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
