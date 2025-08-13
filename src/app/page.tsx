'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'

export default function Home() {
  const [randomAvatar, setRandomAvatar] = useState<string>('')

  useEffect(() => {
    // List of avatar filenames from your default_avatar directory
    const avatarFiles = [
      'avatar_1826783377633780368.jpg',
      'avatar_1826783377633780374.jpg',
      'avatar_1826783377633780381.jpg',
      'avatar_1826783377633780386.jpg',
      'avatar_1826783377633780393.jpg',
      'avatar_1826783377633780401.jpg',
      'avatar_1826783377633780406.jpg',
      'avatar_1826783377633780411.jpg',
      'avatar_1826783377633780417.jpg',
      'avatar_1826783377633780422.jpg',
      'avatar_1826783377633780427.jpg',
      'avatar_1826783377633780434.jpg',
      'avatar_1826783377633780439.jpg',
      'avatar_1826783377633780444.jpg',
      'avatar_1826783377633780449.jpg',
      'avatar_1826783377633780454.jpg',
      'avatar_1826783377633780460.jpg',
      'avatar_1826783377633780465.jpg',
      'avatar_1826783377633780468.jpg',
      'avatar_1826783377633780473.jpg',
      'avatar_1826783377633780476.jpg',
      'avatar_1826783377633780484.jpg',
      'avatar_1826783377633780490.jpg',
      'avatar_1826783377633780493.jpg',
      'avatar_1826783377633780499.jpg',
      'avatar_1826783377633780506.jpg'
    ]

    // Select a random avatar
    const randomIndex = Math.floor(Math.random() * avatarFiles.length)
    const selectedAvatar = avatarFiles[randomIndex]
    setRandomAvatar(`/uploads/default_avatar/${selectedAvatar}`)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Navigation />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 80px)',
        padding: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'white',
          padding: '3rem',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem'
          }}>
            Welcome to HabitTracker
          </h1>
          
          <p style={{
            fontSize: '1.2rem',
            color: '#6b7280',
            marginBottom: '2rem'
          }}>
            Build better habits, one day at a time
          </p>

          {randomAvatar && (
            <div style={{
              marginBottom: '2rem'
            }}>
              <img
                src={randomAvatar}
                alt="Random Avatar"
                style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid #667eea',
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                }}
              />
            </div>
          )}

          <p style={{
            fontSize: '1rem',
            color: '#6b7280'
          }}>
            Click on "Dashboard" to start tracking your habits!
          </p>
        </div>
      </div>
    </div>
  )
}
