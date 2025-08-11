'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { HabitSpreadsheet } from '@/components/habit-spreadsheet'
import { HabitForm } from '@/components/habit-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HabitWithEntries, HabitFormData } from '@/types'
import { Plus } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [habits, setHabits] = useState<HabitWithEntries[]>([])
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchHabits()
  }, [session, status, router])

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits')
      if (response.ok) {
        const data = await response.json()
        setHabits(data)
      }
    } catch (error) {
      console.error('Error fetching habits:', error)
    } finally {
      setLoading(false)
    }
  }

  const createHabit = async (habitData: HabitFormData) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(habitData)
      })

      if (response.ok) {
        setShowHabitForm(false)
        fetchHabits()
      }
    } catch (error) {
      console.error('Error creating habit:', error)
    }
  }

  const updateHabitEntry = async (habitId: string, date: string, value: number) => {
    try {
      const response = await fetch('/api/habit-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ habitId, date, value })
      })

      if (response.ok) {
        fetchHabits()
      }
    } catch (error) {
      console.error('Error updating habit entry:', error)
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
          }}>Loading your dashboard...</p>
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
            }}>Dashboard</h1>
            <p style={{
              color: '#6b7280',
              fontSize: '1.1rem'
            }}>Track your daily habits and build consistency</p>
          </div>
          <Button onClick={() => setShowHabitForm(true)} style={{
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
            New Habit
          </Button>
        </div>

        {showHabitForm && (
          <div style={{ marginBottom: '2rem' }}>
            <HabitForm
              onSubmit={createHabit}
              onCancel={() => setShowHabitForm(false)}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <HabitSpreadsheet
            habits={habits}
            onUpdateEntry={updateHabitEntry}
          />

          {habits.length > 0 && (
            <Card style={{
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
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
                }}>Your Habits Overview</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: '1.5rem' }}>
                <div style={{
                  display: 'grid',
                  gap: '1rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                }}>
                  {habits.map(habit => (
                    <div
                      key={habit.id}
                      style={{
                        padding: '1.25rem',
                        border: '2px solid #f3f4f6',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.75rem'
                      }}>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: habit.color,
                            boxShadow: `0 0 0 3px ${habit.color}20`
                          }}
                        />
                        <h3 style={{
                          fontWeight: '600',
                          fontSize: '1.1rem',
                          color: '#1f2937'
                        }}>{habit.name}</h3>
                      </div>
                      {habit.description && (
                        <p style={{
                          fontSize: '0.9rem',
                          color: '#6b7280',
                          marginBottom: '0.75rem',
                          lineHeight: '1.4'
                        }}>
                          {habit.description}
                        </p>
                      )}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                          borderRadius: '20px',
                          color: '#2563eb',
                          textTransform: 'capitalize'
                        }}>{habit.frequency}</span>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                          borderRadius: '20px',
                          color: '#059669'
                        }}>Target: {habit.target}{habit.unit && ` ${habit.unit}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
