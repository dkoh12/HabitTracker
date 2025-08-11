'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GroupWithMembers, GroupFormData } from '@/types'
import { Users, Plus, Copy, UserPlus } from 'lucide-react'

export default function Groups() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState<GroupWithMembers[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [createFormData, setCreateFormData] = useState<GroupFormData>({ name: '', description: '' })
  const [inviteCode, setInviteCode] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchGroups()
  }, [session, status, router])

  const fetchGroups = async () => {
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
  }

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
            <Card key={group.id} style={{
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
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
                  justifyContent: 'space-between'
                }}>
                  <CardTitle style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    <Users style={{
                      width: '20px',
                      height: '20px',
                      color: '#667eea'
                    }} />
                    <span>{group.name}</span>
                  </CardTitle>
                  {group.ownerId === (session.user as any)?.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyInviteCode(group.inviteCode)}
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
                      <Copy style={{
                        width: '16px',
                        height: '16px',
                        color: '#6b7280'
                      }} />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent style={{ padding: '1.5rem' }}>
                {group.description && (
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#6b7280',
                    marginBottom: '1.5rem',
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
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        padding: '0.5rem',
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        borderRadius: '8px'
                      }}>
                        <span style={{ color: '#1f2937', fontWeight: '500' }}>
                          {group.owner.name || group.owner.email}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          background: '#2563eb',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontWeight: '600'
                        }}>Owner</span>
                      </div>
                      {group.members.map(member => (
                        <div key={member.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.85rem',
                          padding: '0.5rem',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #f1f5f9'
                        }}>
                          <span style={{ color: '#1f2937', fontWeight: '500' }}>
                            {member.user.name || member.user.email}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            background: '#e5e7eb',
                            color: '#374151',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}>
                            {member.role}
                          </span>
                        </div>
                      ))}
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
                      <p style={{
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
                      </p>
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
