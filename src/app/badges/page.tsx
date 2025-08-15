'use client'

import React, { useState, useCallback } from 'react'
import { useAuthValidation } from '@/hooks/useAuthValidation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Shield, 
  Star, 
  Flame, 
  Target, 
  Calendar,
  TrendingUp, 
  Crown, 
  Medal, 
  CheckCircle2,
  Trophy,
  Award,
  Zap,
  Heart,
  BookOpen,
  Clock,
  Moon,
  Users,
  UserCheck,
  UserPlus,
  ChevronDown
} from 'lucide-react'

export default function BadgesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showMoreEarned, setShowMoreEarned] = useState(false)
  const [showMoreNotEarned, setShowMoreNotEarned] = useState(false)
  const [badges, setBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(false) // Start with false - no loading screen
  const [dataLoaded, setDataLoaded] = useState(false) // Track if data has been loaded
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    badgesEarned: 0,
    currentStreak: 0,
    habitsCompleted: 0
  })

  // Fetch badges from API
  const fetchBadgesFromAPI = useCallback(async () => {
    try {
      const response = await fetch('/api/badges')
      if (response.ok) {
        const data = await response.json()
        setBadges(data.badges)
        setUserStats(data.userStats)
        setDataLoaded(true) // Mark data as loaded
      } else {
        console.error('Failed to fetch badges')
      }
    } catch (error) {
      console.error('Error fetching badges:', error)
    }
    // No finally block needed - we don't use loading state anymore
  }, [])

  // Add unified auth validation and fetch badges from API
  const { session, status } = useAuthValidation({
    onValidationSuccess: fetchBadgesFromAPI
  })
  
  // Tiered system: BRONZE, SILVER, GOLD, DIAMOND, PLATINUM with III, II, I
  const tiers = [
    { name: 'BRONZE', color: '#cd7f32' },
    { name: 'SILVER', color: '#c0c0c0' },
    { name: 'GOLD', color: '#ffd700' },
    { name: 'DIAMOND', color: '#4f8ff7' },
    { name: 'PLATINUM', color: '#9333ea' }
  ];
  const numerals = ['III', 'II', 'I'];
  // Example thresholds for each sub-level (can be adjusted)
  const tierThresholds = [
    0, 100, 250,   // BRONZE III, II, I
    500, 900, 1400, // SILVER III, II, I
    2000, 2700, 3500, // GOLD III, II, I
    4400, 5400, 6500, // DIAMOND III, II, I
    7700, 9000, 10400 // PLATINUM III, II, I
  ];
  const userPoints = userStats.totalPoints;
  let tierIndex = 0;
  let numeralIndex = 0;
  let nextThreshold = tierThresholds[tierThresholds.length - 1];
  for (let i = 0; i < tierThresholds.length; i++) {
    if (userPoints >= tierThresholds[i]) {
      tierIndex = Math.floor(i / 3);
      numeralIndex = i % 3;
      nextThreshold = tierThresholds[i + 1] || tierThresholds[i];
    }
  }
  const pointsToNext = nextThreshold - userPoints > 0 ? nextThreshold - userPoints : 0;
  const progressPercent = (userPoints - tierThresholds[tierIndex * 3 + numeralIndex]) /
    ((nextThreshold - tierThresholds[tierIndex * 3 + numeralIndex]) || 1) * 100;
  const currentTier = tiers[tierIndex] || tiers[tiers.length - 1];
  const currentNumeral = numerals[numeralIndex] || numerals[2];

  const categories = [
    { id: 'all', name: 'All Badges', icon: Shield },
    { id: 'beginner', name: 'Beginner', icon: Star },
    { id: 'streak', name: 'Streak', icon: Flame },
    { id: 'consistency', name: 'Consistency', icon: Target },
    { id: 'achievement', name: 'Achievement', icon: Trophy },
    { id: 'group', name: 'Group', icon: Users },
    { id: 'special', name: 'Special', icon: Zap }
  ]

  // Filter badges by category and then sort by rarity (highest to lowest)
  const getRarityWeight = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 5
      case 'epic': return 4
      case 'rare': return 3
      case 'uncommon': return 2
      case 'common': return 1
      default: return 0
    }
  }

  const filteredBadges = selectedCategory === 'all' 
    ? badges.sort((a, b) => getRarityWeight(a.rarity) - getRarityWeight(b.rarity))
    : badges
        .filter(badge => badge.category === selectedCategory)
        .sort((a, b) => getRarityWeight(a.rarity) - getRarityWeight(b.rarity))

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#10b981'
      case 'uncommon': return '#f59e0b'
      case 'rare': return '#8b5cf6'
      case 'epic': return '#dc2626'
      case 'legendary': return '#7c2d12'
      default: return '#6b7280'
    }
  }

  const getRarityGlow = (rarity: string) => {
    const color = getRarityColor(rarity)
    return `0 0 20px ${color}40`
  }

  const earnedBadges = badges.filter(badge => badge.earned)
  const totalPoints = earnedBadges.reduce((sum, badge) => sum + badge.points, 0)

  // Icon mapping for dynamic icon rendering
  const iconMap: { [key: string]: any } = {
    CheckCircle2,
    Star,
    Flame,
    Trophy,
    Crown,
    Target,
    Award,
    TrendingUp,
    BookOpen,
    Clock,
    Heart,
    Moon,
    Users,
    UserCheck,
    UserPlus,
    Shield,
    Zap
  }

  // Helper function to get icon component from string
  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || Shield // fallback to Shield if icon not found
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Navigation />
      
      {/* Show nothing while session is not available or data hasn't loaded yet */}
      {(!session || !dataLoaded) ? null : (
        <>
          {/* Rank Badge at Top */}
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        margin: '2rem 0 1.5rem 0',
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#6b7280', marginBottom: 4, letterSpacing: 1 }}>Rank</div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{
            position: 'relative',
            width: 90,
            height: 90,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Shield
              size={90}
              style={{
                color: currentTier.color,
                filter: `drop-shadow(0 4px 18px ${currentTier.color}55)`
              }}
              strokeWidth={2.5}
              fill={`url(#shield-gradient-${currentTier.name})`}
            />
            {/* SVG gradient for shield fill */}
            <svg width="0" height="0">
              <defs>
                <linearGradient id={`shield-gradient-${currentTier.name}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={currentTier.color} stopOpacity="1" />
                  <stop offset="100%" stopColor={currentTier.color} stopOpacity="0.7" />
                </linearGradient>
              </defs>
            </svg>
            <span style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -54%)',
              color: '#fff',
              fontWeight: 900,
              fontSize: 38,
              letterSpacing: 2,
              textShadow: '0 2px 12px #0007',
              userSelect: 'none',
              pointerEvents: 'none',
            }}>{currentNumeral}</span>
          </div>
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: currentTier.color,
            letterSpacing: 1,
            textShadow: '0 1px 4px #0002',
          }}>
            {currentTier.name} {currentNumeral}
          </div>
        </div>
      </div>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
  {/* All Tiers Overview */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}>
          {tiers.map((tier, tIdx) => (
            <div key={tier.name} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: tier.color,
                marginBottom: '0.5rem',
                padding: '0.25rem 1rem',
                border: `2px solid ${tier.color}`,
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.9)'
              }}>
                {tier.name}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {numerals.map((num, nIdx) => {
                  const isCurrent = tIdx === tierIndex && nIdx === numeralIndex;
                  return (
                    <div
                      key={num}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: isCurrent
                          ? `linear-gradient(135deg, ${tier.color} 0%, #3b82f6 100%)`
                          : `linear-gradient(135deg, ${tier.color} 0%, ${tier.color}bb 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isCurrent ? '#fff' : '#fff',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        border: isCurrent ? `2.5px solid #3b82f6` : `1.5px solid ${tier.color}`,
                        boxShadow: isCurrent ? `0 0 12px ${tier.color}cc` : `0 1px 4px ${tier.color}33`,
                        transition: 'all 0.2s',
                        letterSpacing: 1,
                        textShadow: isCurrent ? '0 2px 8px #0006' : '0 1px 2px #0004',
                      }}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {/* Tier Progress Bar */}
        <div style={{
          maxWidth: 500,
          margin: '0 auto 2rem auto',
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 4px 12px #0001',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: currentTier.color }}>
            {currentTier.name} {currentNumeral}
          </div>
          <div style={{ marginBottom: 12, color: '#6b7280', fontWeight: 500 }}>
            {pointsToNext === 0
              ? 'Max Tier!'
              : `${userPoints} / ${nextThreshold} points`}
          </div>
          <div style={{
            width: '100%',
            height: 18,
            background: '#f3f4f6',
            borderRadius: 9,
            overflow: 'hidden',
            marginBottom: 8,
            boxShadow: '0 2px 6px #0001'
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: '#3b82f6',
              borderRadius: 9,
              transition: 'width 0.5s',
            }} />
          </div>
          {pointsToNext > 0 && (
            <div style={{ fontSize: 14, color: '#6b7280' }}>
              {pointsToNext} points to next tier
            </div>
          )}
        </div>
        {/* ...existing code... */}

        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <Card style={{
            background: 'white',
            borderRadius: '16px',
            textAlign: 'center',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#f59e0b',
              marginBottom: '0.5rem'
            }}>
              {totalPoints}
            </div>
            <div style={{ color: '#6b7280', fontWeight: '500' }}>
              Total Points Earned
            </div>
          </Card>

          <Card style={{
            background: 'white',
            borderRadius: '16px',
            textAlign: 'center',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#10b981',
              marginBottom: '0.5rem'
            }}>
              {earnedBadges.length}
            </div>
            <div style={{ color: '#6b7280', fontWeight: '500' }}>
              Badges Earned
            </div>
          </Card>

          <Card style={{
            background: 'white',
            borderRadius: '16px',
            textAlign: 'center',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#8b5cf6',
              marginBottom: '0.5rem'
            }}>
              {badges.length - earnedBadges.length}
            </div>
            <div style={{ color: '#6b7280', fontWeight: '500' }}>
              Badges to Earn
            </div>
          </Card>

          <Card style={{
            background: 'white',
            borderRadius: '16px',
            textAlign: 'center',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#ef4444',
              marginBottom: '0.5rem'
            }}>
              {userStats.currentStreak}
            </div>
            <div style={{ color: '#6b7280', fontWeight: '500' }}>
              Current Streak
            </div>
          </Card>
        </div>

        {/* Category Filter */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          justifyContent: 'center'
        }}>
          {categories.map(category => {
            const IconComponent = category.icon
            const isActive = selectedCategory === category.id
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '25px',
                  border: 'none',
                  background: isActive 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'white',
                  color: isActive ? 'white' : '#6b7280',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}
              >
                <IconComponent size={16} />
                <span>{category.name}</span>
              </button>
            )
          })}
        </div>

        {/* Earned Badges Section */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#10b981',
            marginBottom: '1.5rem'
          }}>
            Badges Earned ({filteredBadges.filter(badge => badge.earned).length})
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredBadges
              .filter(badge => badge.earned)
              .sort((a, b) => getRarityWeight(a.rarity) - getRarityWeight(b.rarity))
              .slice(0, showMoreEarned ? undefined : 3)
              .map(badge => {
                const IconComponent = getIconComponent(badge.icon)
                return (
                  <Card
                    key={badge.id}
                    style={{
                      background: 'white',
                      border: `2px solid ${badge.color}80`,
                      borderRadius: '16px',
                      padding: '1.5rem',
                      position: 'relative',
                      boxShadow: getRarityGlow(badge.rarity),
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Rarity Indicator */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      background: getRarityColor(badge.rarity),
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {badge.rarity}
                    </div>

                    {/* Badge Icon */}
                    <div style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${badge.color} 0%, ${badge.color}dd 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                      boxShadow: `0 8px 16px ${badge.color}40`
                    }}>
                      <IconComponent 
                        size={35}
                        style={{ color: 'white' }} 
                      />
                    </div>

                    {/* Badge Info */}
                    <div>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: badge.color,
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {badge.name}
                        <CheckCircle2 size={16} style={{ color: badge.color }} />
                      </h3>
                      
                      <p style={{
                        color: '#6b7280',
                        fontSize: '0.9rem',
                        marginBottom: '1rem',
                        lineHeight: '1.5'
                      }}>
                        {badge.description}
                      </p>

                      {/* Points and Category */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.8rem',
                          color: '#9ca3af'
                        }}>
                          <Star size={14} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                          <span>{badge.points} points</span>
                        </div>
                        <div style={{
                          padding: '0.25rem 0.5rem',
                          background: '#f3f4f6',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          color: '#6b7280',
                          textTransform: 'capitalize'
                        }}>
                          {badge.category}
                        </div>
                      </div>

                      {/* Requirement */}
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#9ca3af',
                        fontStyle: 'italic',
                        marginBottom: '0.5rem'
                      }}>
                        {badge.requirement}
                      </div>

                      {/* Earned Date */}
                      {badge.earnedDate && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: badge.color,
                          fontWeight: '500'
                        }}>
                          Earned: {new Date(badge.earnedDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
          </div>
          
          {/* Show More Button for Earned Badges */}
          {filteredBadges.filter(badge => badge.earned).length > 3 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginTop: '1.5rem' 
            }}>
              <button
                onClick={() => setShowMoreEarned(!showMoreEarned)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#059669'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#10b981'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {showMoreEarned ? 'Show Less' : `Show ${filteredBadges.filter(badge => badge.earned).length - 3} More`}
                <ChevronDown 
                  size={16} 
                  style={{ 
                    transform: showMoreEarned ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }} 
                />
              </button>
            </div>
          )}
        </div>

        {/* Not Earned Badges Section */}
        <div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#8b5cf6',
            marginBottom: '1.5rem'
          }}>
            Badges to Earn ({filteredBadges.filter(badge => !badge.earned).length})
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredBadges
              .filter(badge => !badge.earned)
              .sort((a, b) => getRarityWeight(a.rarity) - getRarityWeight(b.rarity))
              .slice(0, showMoreNotEarned ? undefined : 3)
              .map(badge => {
                const IconComponent = getIconComponent(badge.icon)
                return (
                  <Card
                    key={badge.id}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e5e7eb',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      position: 'relative',
                      opacity: 0.75,
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Rarity Indicator */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      background: getRarityColor(badge.rarity),
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {badge.rarity}
                    </div>

                    {/* Badge Icon */}
                    <div style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      background: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem'
                    }}>
                      <IconComponent 
                        size={35}
                        style={{ color: '#9ca3af' }} 
                      />
                    </div>

                    {/* Badge Info */}
                    <div>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '0.5rem'
                      }}>
                        {badge.name}
                      </h3>
                      
                      <p style={{
                        color: '#6b7280',
                        fontSize: '0.9rem',
                        marginBottom: '1rem',
                        lineHeight: '1.5'
                      }}>
                        {badge.description}
                      </p>

                      {/* Points and Category */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.8rem',
                          color: '#9ca3af'
                        }}>
                          <Star size={14} />
                          <span>{badge.points} points</span>
                        </div>
                        <div style={{
                          padding: '0.25rem 0.5rem',
                          background: '#f3f4f6',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          color: '#6b7280',
                          textTransform: 'capitalize'
                        }}>
                          {badge.category}
                        </div>
                      </div>

                      {/* Requirement */}
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#9ca3af',
                        fontStyle: 'italic'
                      }}>
                        {badge.requirement}
                      </div>
                    </div>
                  </Card>
                )
              })}
          </div>
          
          {/* Show More Button for Not Earned Badges */}
          {filteredBadges.filter(badge => !badge.earned).length > 3 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginTop: '1.5rem' 
            }}>
              <button
                onClick={() => setShowMoreNotEarned(!showMoreNotEarned)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#7c3aed'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#8b5cf6'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {showMoreNotEarned ? 'Show Less' : `Show ${filteredBadges.filter(badge => !badge.earned).length - 3} More`}
                <ChevronDown 
                  size={16} 
                  style={{ 
                    transform: showMoreNotEarned ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }} 
                />
              </button>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  )
}
