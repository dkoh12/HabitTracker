'use client'
import { useState, useCallback, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { HabitCalendar } from '@/components/habit-calendar'
import { HabitSpreadsheet } from '@/components/habit-spreadsheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HabitWithEntries } from '@/types'
import { Star, TrendingUp, Target, Activity, Calendar, BarChart3, Zap, Award, TrendingDown, ChevronUp, ChevronDown } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useAuthValidation } from '@/hooks/useAuthValidation'
import { format, subDays, parseISO, startOfDay, differenceInDays, isToday, isYesterday, subWeeks, startOfWeek, endOfWeek } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
export default function Dashboard() {
  const [habits, setHabits] = useState<HabitWithEntries[]>([])
  const [loading, setLoading] = useState(true)
  
  // Statistics filtering and comparison state
  const [selectedHabits, setSelectedHabits] = useState<string[]>([])
  const [viewMode, setViewMode] = useState('combined') // 'combined', 'individual', 'comparison'
  const [timeFilter, setTimeFilter] = useState('30') // '7', '30', '90', 'all'
  const [sortBy, setSortBy] = useState('name') // 'name', 'success_rate', 'streak', 'days'
  
  // Chart filtering state
  const [visibleHabitsDaily, setVisibleHabitsDaily] = useState<string[]>([])
  const [visibleHabitsWeekly, setVisibleHabitsWeekly] = useState<string[]>([])
  
  // Time range state for charts
  const [dailyTimeRange, setDailyTimeRange] = useState<7 | 14 | 30 | 60 | 90>(30)
  const [weeklyTimeRange, setWeeklyTimeRange] = useState<4 | 8 | 12 | 24 | 52>(12)
  
  const fetchHabits = useCallback(async () => {
    console.log('🔄 fetchHabits called')
    try {
      const response = await fetch('/api/habits')
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Habits fetched:', data.length, 'habits')
        setHabits(data)
      } else if (response.status === 401) {
        // Session is invalid (user no longer exists in database)
        console.log('Session invalid, logging out user')
        await signOut({ callbackUrl: '/auth/signin' })
        return
      } else {
        console.error('❌ fetchHabits error:', response.status)
      }
    } catch (error) {
      console.error('💥 Error fetching habits:', error)
      // The auth validation hook will handle session validation errors
    } finally {
      setLoading(false)
    }
  }, [])
  const { session, status } = useAuthValidation({
    onValidationSuccess: fetchHabits
  })

  // Update selectedHabits when habits change
  useEffect(() => {
    setSelectedHabits(habits.map(h => h.id))
    setVisibleHabitsDaily(habits.map(h => h.name))
    setVisibleHabitsWeekly(habits.map(h => h.name))
  }, [habits])

  const updateHabitEntry = async (habitId: string, date: string, value: number) => {
    console.log('🚀 updateHabitEntry called:', { habitId, date, value })
    try {
      const response = await fetch('/api/habit-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ habitId, date, value })
      })
      console.log('📡 API response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('📊 API response data:', result)
        
        // Refresh habits data to update UI
        await fetchHabits()
        
        // Force a small delay to ensure React re-renders
        await new Promise(resolve => setTimeout(resolve, 50))
      } else {
        const error = await response.text()
        console.error('❌ API error:', response.status, error)
      }
    } catch (error) {
      console.error('💥 updateHabitEntry error:', error)
    }
    
    console.log('✅ Entry updated successfully!')
  }
  const getDetailedHabitStats = (habit: HabitWithEntries) => {
    const entries = habit.habitEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const successfulDays = entries.filter(entry => entry.value > 0).length
    const totalTrackedDays = entries.length
    const missedDays = totalTrackedDays - successfulDays
    const successRate = totalTrackedDays > 0 ? Math.round((successfulDays / totalTrackedDays) * 100) : 0
    
    // Get last 30 days for visualization
    const last30Days = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const entry = entries.find(e => e.date.toString().split('T')[0] === dateStr)
      last30Days.push({
        date: date,
        value: entry?.value || 0,
        completed: (entry?.value || 0) > 0
      })
    }
    
    // Calculate streaks
    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0
    
    // Sort entries by date to calculate streaks
    const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Calculate current streak (from today backwards)
    const today = new Date()
    let checkDate = new Date(today)
    
    while (checkDate >= new Date(sortedEntries[0]?.date || today)) {
      const dateStr = checkDate.toISOString().split('T')[0]
      const entry = sortedEntries.find(e => e.date.toString().split('T')[0] === dateStr)
      
      if (entry && entry.value > 0) {
        currentStreak++
      } else {
        break
      }
      
      checkDate.setDate(checkDate.getDate() - 1)
    }
    
    // Calculate best streak
    sortedEntries.forEach(entry => {
      if (entry.value > 0) {
        tempStreak++
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak
        }
      } else {
        tempStreak = 0
      }
    })
    
    return {
      successfulDays,
      totalTrackedDays,
      missedDays,
      successRate,
      currentStreak,
      bestStreak,
      last30Days
    }
  }

  // Enhanced analytics functions
  const getTrendAnalysis = (habit: HabitWithEntries) => {
    const last14Days = subDays(new Date(), 13)
    const last7Days = subDays(new Date(), 6)
    
    const week1Entries = habit.habitEntries.filter(entry => {
      const entryDateStr = entry.date.toString().substring(0, 10)
      const entryDate = new Date(entryDateStr + 'T12:00:00') // Parse as local date at noon
      return entryDate >= last14Days && entryDate < last7Days
    })
    
    const week2Entries = habit.habitEntries.filter(entry => {
      const entryDateStr = entry.date.toString().substring(0, 10)
      const entryDate = new Date(entryDateStr + 'T12:00:00') // Parse as local date at noon
      return entryDate >= last7Days
    })
    
    const week1Success = week1Entries.filter(e => e.value > 0).length / 7 * 100
    const week2Success = week2Entries.filter(e => e.value > 0).length / 7 * 100
    
    const trend = week2Success - week1Success
    
    return {
      trend,
      improving: trend > 5,
      declining: trend < -5,
      stable: Math.abs(trend) <= 5,
      week1Success: Math.round(week1Success),
      week2Success: Math.round(week2Success)
    }
  }

  const getMotivationalInsights = (habit: HabitWithEntries) => {
    const stats = getDetailedHabitStats(habit)
    const trend = getTrendAnalysis(habit)
    
    const insights = []
    
    if (stats.currentStreak >= 7) {
      insights.push({
        type: 'achievement',
        icon: Award,
        message: `Amazing! ${stats.currentStreak} day streak!`,
        color: 'text-yellow-600'
      })
    }
    
    if (trend.improving) {
      insights.push({
        type: 'trending',
        icon: TrendingUp,
        message: `You're improving! +${trend.trend.toFixed(0)}% this week`,
        color: 'text-green-600'
      })
    }
    
    if (stats.successRate >= 90) {
      insights.push({
        type: 'mastery',
        icon: Star,
        message: `Master level: ${stats.successRate}% success rate!`,
        color: 'text-purple-600'
      })
    }
    
    if (stats.currentStreak === 0 && stats.successRate > 50) {
      insights.push({
        type: 'motivation',
        icon: Zap,
        message: "Time to restart your streak!",
        color: 'text-blue-600'
      })
    }
    
    return insights
  }

  const getWeeklyProgress = () => {
    const weekStart = startOfWeek(new Date())
    const weekEnd = endOfWeek(new Date())
    
    return habits.map(habit => {
      const weekEntries = habit.habitEntries.filter(entry => {
        const entryDateStr = entry.date.toString().substring(0, 10)
        const entryDate = new Date(entryDateStr + 'T12:00:00') // Parse as local date at noon
        return entryDate >= weekStart && entryDate <= weekEnd
      })
      
      const completedDays = weekEntries.filter(e => e.value > 0).length
      const percentage = (completedDays / 7) * 100
      
      return {
        habit,
        completedDays,
        totalDays: 7,
        percentage: Math.round(percentage),
        trend: getTrendAnalysis(habit)
      }
    }).sort((a, b) => b.percentage - a.percentage)
  }

  // Chart data preparation functions
  const getProgressChartData = () => {
    const days = []
    for (let i = dailyTimeRange - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      // Set to noon to avoid timezone issues, same as habit spreadsheet
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
      const dateStr = format(localDate, 'MMM dd')
      const dateForComparison = format(localDate, 'yyyy-MM-dd')
      
      const dayData: any = { date: dateStr, day: dateForComparison }
      
      habits.forEach(habit => {
        const entry = habit.habitEntries.find(e => {
          // Simple string comparison like habit spreadsheet - just compare first 10 characters (YYYY-MM-DD)
          const entryDateStr = e.date.toString().substring(0, 10)
          return entryDateStr === dateForComparison
        })
        // Normalize to percentage of target (0-100%)
        const rawValue = entry?.value || 0
        const percentage = habit.target > 0 ? Math.min((rawValue / habit.target) * 100, 100) : 0
        dayData[habit.name] = Math.round(percentage)
      })
      
      days.push(dayData)
    }
    return days
  }

  const getSuccessRateData = () => {
    return habits.map(habit => {
      const stats = getDetailedHabitStats(habit)
      return {
        name: habit.name,
        successRate: stats.successRate,
        completedDays: stats.successfulDays,
        totalDays: stats.totalTrackedDays,
        color: habit.color
      }
    })
  }

  const getStreakComparisonData = () => {
    return habits.map(habit => {
      const stats = getDetailedHabitStats(habit)
      return {
        name: habit.name,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
        color: habit.color
      }
    })
  }

  const getWeeklyTrendData = () => {
    const weeks = []
    for (let i = weeklyTimeRange - 1; i >= 0; i--) {
      const weekStart = subWeeks(startOfWeek(new Date()), i)
      const weekEnd = endOfWeek(weekStart)
      const weekLabel = `Week ${weeklyTimeRange - i} (${format(weekStart, 'MMM dd')})`
      
      const weekData: any = { week: weekLabel }
      
      habits.forEach(habit => {
        const weekEntries = habit.habitEntries.filter(entry => {
          // Simple string comparison like habit spreadsheet
          const entryDateStr = entry.date.toString().substring(0, 10)
          const entryDate = new Date(entryDateStr + 'T12:00:00') // Parse as local date at noon
          return entryDate >= weekStart && entryDate <= weekEnd
        })
        const successRate = weekEntries.length > 0 ? 
          (weekEntries.filter(e => e.value > 0).length / 7) * 100 : 0
        weekData[habit.name] = Math.round(successRate)
      })
      
      weeks.push(weekData)
    }
    return weeks
  }

  // Chart filtering functions
  const toggleHabitVisibilityDaily = (habitName: string) => {
    setVisibleHabitsDaily(prev => 
      prev.includes(habitName) 
        ? prev.filter(name => name !== habitName)
        : [...prev, habitName]
    )
  }

  const toggleHabitVisibilityWeekly = (habitName: string) => {
    setVisibleHabitsWeekly(prev => 
      prev.includes(habitName) 
        ? prev.filter(name => name !== habitName)
        : [...prev, habitName]
    )
  }
  
  // Don't show loading screen for session loading - let page render immediately
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
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <HabitSpreadsheet
            key={habits.map(h => h.id).join(',')}
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
          
          {/* Analytics Dashboard with Charts */}
          {habits.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              borderRadius: '24px',
              padding: '1.5rem 3rem 3rem 3rem',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '0.5rem'
                }}>Progress Analytics Dashboard</h2>
                <p style={{
                  fontSize: '1.1rem',
                  color: '#64748b',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  Visual insights and trends for your habits over time
                </p>
              </div>

              {/* Charts Grid */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                marginBottom: '2rem'
              }}>
                {/* Daily Progress Line Chart - Full Width */}
                <Card style={{
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                }}>
                  <CardHeader style={{ padding: '1.5rem 2rem 1.5rem 2rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      margin: '0 1rem'
                    }}>
                      <CardTitle style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        Daily Progress (Last {dailyTimeRange} Days)
                      </CardTitle>
                      <select
                        value={dailyTimeRange}
                        onChange={(e) => setDailyTimeRange(Number(e.target.value) as 7 | 14 | 30 | 60 | 90)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          background: 'white',
                          color: '#374151',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                        <option value={60}>60 days</option>
                        <option value={90}>90 days</option>
                      </select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={getProgressChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#6b7280"
                          fontSize={12}
                          tick={{ fill: '#6b7280' }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          fontSize={12}
                          tick={{ fill: '#6b7280' }}
                          domain={[0, 100]}
                          label={{ 
                            value: 'Target Completion (%)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px' }
                          }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any, name: string) => [
                            `${value}% of target`,
                            name
                          ]}
                        />
                        <Legend 
                          onClick={(e) => {
                            if (e.dataKey) {
                              toggleHabitVisibilityDaily(e.dataKey as string)
                            }
                          }}
                          wrapperStyle={{ cursor: 'pointer' }}
                        />
                        {habits.map((habit, index) => (
                          <Line 
                            key={habit.id}
                            type="monotone" 
                            dataKey={habit.name} 
                            stroke={habit.color}
                            strokeWidth={3}
                            dot={{ fill: habit.color, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: habit.color, strokeWidth: 2 }}
                            hide={!visibleHabitsDaily.includes(habit.name)}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Weekly Trends Area Chart - Full Width */}
                <Card style={{
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                }}>
                  <CardHeader style={{ padding: '1.5rem 2rem 1.5rem 2rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      margin: '0 1rem'
                    }}>
                      <CardTitle style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        Weekly Success Trends ({weeklyTimeRange} Weeks)
                      </CardTitle>
                      <select
                        value={weeklyTimeRange}
                        onChange={(e) => setWeeklyTimeRange(Number(e.target.value) as 4 | 8 | 12 | 24 | 52)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          background: 'white',
                          color: '#374151',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        <option value={4}>4 weeks</option>
                        <option value={8}>8 weeks</option>
                        <option value={12}>12 weeks</option>
                        <option value={24}>24 weeks</option>
                        <option value={52}>1 year</option>
                      </select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={getWeeklyTrendData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="week" 
                          stroke="#6b7280"
                          fontSize={12}
                          tick={{ fill: '#6b7280' }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          fontSize={12}
                          tick={{ fill: '#6b7280' }}
                          domain={[0, 100]}
                          label={{ 
                            value: 'Weekly Success Rate (%)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px' }
                          }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value) => [`${value}%`, 'Success Rate']}
                        />
                        <Legend 
                          onClick={(e) => {
                            if (e.dataKey) {
                              toggleHabitVisibilityWeekly(e.dataKey as string)
                            }
                          }}
                          wrapperStyle={{ cursor: 'pointer' }}
                        />
                        {habits.map((habit, index) => (
                          <Area
                            key={habit.id}
                            type="monotone"
                            dataKey={habit.name}
                            stroke={habit.color}
                            fill={habit.color}
                            fillOpacity={0.2}
                            hide={!visibleHabitsWeekly.includes(habit.name)}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Row of Charts */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                gap: '2rem',
                marginBottom: '2rem'
              }}>
                {/* Success Rate Bar Chart */}
                <Card style={{
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                }}>
                  <CardHeader>
                    <CardTitle style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      Success Rate Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={getSuccessRateData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#6b7280"
                          fontSize={12}
                          tick={{ fill: '#6b7280' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          fontSize={12}
                          tick={{ fill: '#6b7280' }}
                          domain={[0, 100]}
                          label={{ 
                            value: 'Success Rate (%)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px' }
                          }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value) => [`${value}%`, 'Success Rate']}
                        />
                        <Bar dataKey="successRate" radius={[4, 4, 0, 0]}>
                          {getSuccessRateData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Streak Comparison */}
                <Card style={{
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                }}>
                  <CardHeader>
                    <CardTitle style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      Current vs Best Streaks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={getStreakComparisonData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#6b7280"
                          fontSize={12}
                          tick={{ fill: '#6b7280' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          fontSize={12}
                          tick={{ fill: '#6b7280' }}
                          label={{ 
                            value: 'Days', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px' }
                          }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ color: '#000000' }}
                          iconType="rect"
                          formatter={(value) => <span style={{ color: '#000000' }}>{value}</span>}
                        />
                        <Bar dataKey="currentStreak" fill="#3b82f6" name="Current Streak" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="bestStreak" fill="#8b5cf6" name="Best Streak" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Statistics Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginTop: '2rem'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  borderRadius: '16px',
                  border: '2px solid #3b82f625'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '900',
                    color: '#3b82f6',
                    marginBottom: '0.5rem'
                  }}>
                    {habits.reduce((sum, habit) => sum + getDetailedHabitStats(habit).successfulDays, 0)}
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    color: '#1f2937',
                    fontWeight: '600'
                  }}>Total Successful Days</div>
                </div>

                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  borderRadius: '16px',
                  border: '2px solid #10b98125'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '900',
                    color: '#10b981',
                    marginBottom: '0.5rem'
                  }}>
                    {Math.round(habits.reduce((sum, habit) => sum + getDetailedHabitStats(habit).successRate, 0) / habits.length)}%
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    color: '#1f2937',
                    fontWeight: '600'
                  }}>Average Success Rate</div>
                </div>

                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '16px',
                  border: '2px solid #f59e0b25'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '900',
                    color: '#f59e0b',
                    marginBottom: '0.5rem'
                  }}>
                    {Math.max(...habits.map(habit => getDetailedHabitStats(habit).currentStreak))}
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    color: '#1f2937',
                    fontWeight: '600'
                  }}>Longest Current Streak</div>
                </div>

                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  background: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)',
                  borderRadius: '16px',
                  border: '2px solid #8b5cf625'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '900',
                    color: '#8b5cf6',
                    marginBottom: '0.5rem'
                  }}>
                    {habits.length}
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    color: '#1f2937',
                    fontWeight: '600'
                  }}>Active Habits</div>
                </div>
              </div>
            </div>
          )}
          
          {/* HabitCalendar moved to bottom */}
          <HabitCalendar
            habits={habits}
            onUpdateEntry={updateHabitEntry}
          />
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
