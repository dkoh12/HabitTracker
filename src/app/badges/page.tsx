'use client'

import React, { useState } from 'react'
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
  Clock
} from 'lucide-react'

export default function BadgesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [userStats] = useState({
    totalPoints: 850,
    badgesEarned: 8,
    currentStreak: 15,
    habitsCompleted: 127
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

  // Badge definitions with categories and requirements
  const badges = [
    // Beginner badges
    {
      id: 'first_habit',
      name: 'First Steps',
      description: 'Create your very first habit',
      category: 'beginner',
      icon: CheckCircle2,
      color: '#10b981',
      points: 10,
      rarity: 'common',
      requirement: 'Create 1 habit',
      earned: true,
      earnedDate: '2025-08-01'
    },
    {
      id: 'habit_starter',
      name: 'Habit Starter',
      description: 'Complete your first habit entry',
      category: 'beginner',
      icon: Star,
      color: '#f59e0b',
      points: 25,
      rarity: 'common',
      requirement: 'Complete 1 habit entry',
      earned: true,
      earnedDate: '2025-08-02'
    },
    {
      id: 'three_day_streak',
      name: 'Getting Started',
      description: 'Maintain a 3-day streak',
      category: 'beginner',
      icon: Flame,
      color: '#ef4444',
      points: 50,
      rarity: 'common',
      requirement: 'Complete 3 days in a row',
      earned: true,
      earnedDate: '2025-08-04'
    },

    // Streak badges
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      category: 'streak',
      icon: Flame,
      color: '#f59e0b',
      points: 100,
      rarity: 'uncommon',
      requirement: 'Complete 7 days in a row',
      earned: true,
      earnedDate: '2025-08-08'
    },
    {
      id: 'two_week_champion',
      name: 'Two Week Champion',
      description: 'Maintain a 14-day streak',
      category: 'streak',
      icon: Trophy,
      color: '#8b5cf6',
      points: 200,
      rarity: 'rare',
      requirement: 'Complete 14 days in a row',
      earned: true,
      earnedDate: '2025-08-15'
    },
    {
      id: 'month_master',
      name: 'Month Master',
      description: 'Achieve a 30-day streak',
      category: 'streak',
      icon: Crown,
      color: '#dc2626',
      points: 500,
      rarity: 'epic',
      requirement: 'Complete 30 days in a row',
      earned: false
    },

    // Consistency badges
    {
      id: 'consistent_performer',
      name: 'Consistent Performer',
      description: 'Achieve 70% completion rate over 2 weeks',
      category: 'consistency',
      icon: Target,
      color: '#3b82f6',
      points: 150,
      rarity: 'uncommon',
      requirement: '70% completion for 14 days',
      earned: true,
      earnedDate: '2025-08-10'
    },
    {
      id: 'reliability_master',
      name: 'Reliability Master',
      description: 'Achieve 85% completion rate over a month',
      category: 'consistency',
      icon: Award,
      color: '#06b6d4',
      points: 300,
      rarity: 'rare',
      requirement: '85% completion for 30 days',
      earned: false
    },

    // Achievement badges
    {
      id: 'century_club',
      name: 'Century Club',
      description: 'Complete 100 habit entries',
      category: 'achievement',
      icon: TrendingUp,
      color: '#84cc16',
      points: 250,
      rarity: 'rare',
      requirement: 'Complete 100 total entries',
      earned: true,
      earnedDate: '2025-08-12'
    },
    {
      id: 'habit_collector',
      name: 'Habit Collector',
      description: 'Track 10 different habits',
      category: 'achievement',
      icon: BookOpen,
      color: '#ec4899',
      points: 200,
      rarity: 'uncommon',
      requirement: 'Create 10 different habits',
      earned: false
    },

    // Special badges
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Complete habits before 8 AM for 7 days',
      category: 'special',
      icon: Clock,
      color: '#f97316',
      points: 150,
      rarity: 'uncommon',
      requirement: 'Complete before 8 AM for 7 days',
      earned: true,
      earnedDate: '2025-08-07'
    },
    {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Achieve 100% completion for a full week',
      category: 'special',
      icon: Heart,
      color: '#e11d48',
      points: 300,
      rarity: 'rare',
      requirement: '100% completion for 7 days',
      earned: false
    }
  ]

  const categories = [
    { id: 'all', name: 'All Badges', icon: Shield },
    { id: 'beginner', name: 'Beginner', icon: Star },
    { id: 'streak', name: 'Streak', icon: Flame },
    { id: 'consistency', name: 'Consistency', icon: Target },
    { id: 'achievement', name: 'Achievement', icon: Trophy },
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Navigation />
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

        {/* Badges Grid - Sorted by Rarity within Categories */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredBadges.map(badge => {
            const IconComponent = badge.icon
            return (
              <Card
                key={badge.id}
                style={{
                  background: badge.earned 
                    ? `linear-gradient(135deg, ${badge.color}10 0%, ${badge.color}05 100%)`
                    : '#f8fafc',
                  border: badge.earned 
                    ? `2px solid ${badge.color}40`
                    : '1px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  position: 'relative',
                  opacity: badge.earned ? 1 : 0.75,
                  boxShadow: badge.earned ? getRarityGlow(badge.rarity) : '0 2px 4px rgba(0, 0, 0, 0.05)',
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
                  background: badge.earned 
                    ? `linear-gradient(135deg, ${badge.color} 0%, ${badge.color}dd 100%)`
                    : '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: badge.earned ? `0 8px 16px ${badge.color}40` : 'none'
                }}>
                  <IconComponent 
                    size={35}
                    style={{ 
                      color: badge.earned ? 'white' : '#9ca3af' 
                    }} 
                  />
                </div>

                {/* Badge Info */}
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: badge.earned ? badge.color : '#6b7280',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {badge.name}
                    {badge.earned && (
                      <CheckCircle2 size={16} style={{ color: badge.color }} />
                    )}
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
                    fontStyle: 'italic',
                    marginBottom: badge.earned ? '0.5rem' : '0'
                  }}>
                    {badge.requirement}
                  </div>

                  {/* Earned Date */}
                  {badge.earned && badge.earnedDate && (
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
      </div>
    </div>
  )
}
