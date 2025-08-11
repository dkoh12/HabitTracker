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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Groups</h1>
            <p className="text-muted-foreground">Share habits and track progress together</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setShowJoinForm(true)} variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Join Group
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>
        </div>

        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Group</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Group Name *
                  </label>
                  <Input
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    placeholder="e.g., Family Fitness, Study Buddies"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Input
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Group</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {showJoinForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Join Group</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={joinGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Invite Code *
                  </label>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter the invite code"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowJoinForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Join Group</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map(group => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>{group.name}</span>
                  </CardTitle>
                  {group.ownerId === (session.user as any)?.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyInviteCode(group.inviteCode)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {group.description && (
                  <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
                )}
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Members ({group.members.length})</h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{group.owner.name || group.owner.email}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Owner</span>
                      </div>
                      {group.members.map(member => (
                        <div key={member.id} className="flex items-center justify-between text-sm">
                          <span>{member.user.name || member.user.email}</span>
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            {member.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {group.groupHabits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Shared Habits ({group.groupHabits.length})</h4>
                      <div className="space-y-1">
                        {group.groupHabits.map((groupHabit, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: groupHabit.habit.color }}
                            />
                            <span>{groupHabit.habit.name}</span>
                            <span className="text-xs text-muted-foreground">
                              by {groupHabit.habit.user.name || groupHabit.habit.user.email}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {group.ownerId === (session.user as any)?.id && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Invite Code: <code className="bg-gray-100 px-1 rounded">{group.inviteCode}</code>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {groups.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No groups yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first group or join an existing one to start sharing habits!
              </p>
              <div className="flex justify-center space-x-2">
                <Button onClick={() => setShowJoinForm(true)} variant="outline">
                  Join Group
                </Button>
                <Button onClick={() => setShowCreateForm(true)}>
                  Create Group
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
