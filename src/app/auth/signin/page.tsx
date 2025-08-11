'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, ArrowRight, Calendar, Users, TrendingUp } from 'lucide-react'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid credentials')
      } else {
        router.push('/')
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        display: 'flex',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Left side - Hero */}
        <div style={{
          width: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '48px',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }} className="hidden lg:flex">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                <Calendar size={24} />
              </div>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                margin: 0,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                color: 'white'
              }}>HabitTracker</h1>
            </div>
            
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ 
                fontSize: '36px', 
                fontWeight: 'bold', 
                lineHeight: '1.1', 
                marginBottom: '16px',
                textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                color: 'white'
              }}>
                Build Better Habits Together
              </h2>
              <p style={{ 
                fontSize: '18px', 
                opacity: 0.95, 
                lineHeight: '1.6',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '12px 16px',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)'
              }}>
                Track your daily habits, build streaks, and share your progress with friends and family.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <TrendingUp size={24} />
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Track Progress</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <Users size={24} />
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Share with Groups</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <Calendar size={24} />
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Daily Tracking</div>
            </div>
          </div>
        </div>

        {/* Right side - Sign In Form */}
        <div style={{
          flex: 1,
          padding: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            {/* Mobile logo */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }} className="lg:hidden">
              <div style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  <Calendar size={24} color="white" />
                </div>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>
                  HabitTracker
                </h1>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                Welcome back
              </h2>
              <p style={{ color: '#6b7280', margin: 0, fontSize: '16px' }}>Sign in to continue your habit journey</p>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Email address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        width: '20px',
                        height: '20px'
                      }} />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          paddingLeft: '44px',
                          height: '48px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          fontSize: '16px',
                          backgroundColor: '#ffffff'
                        }}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        width: '20px',
                        height: '20px'
                      }} />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                          paddingLeft: '44px',
                          height: '48px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          fontSize: '16px',
                          backgroundColor: '#ffffff'
                        }}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '12px',
                      padding: '12px'
                    }}>
                      <div style={{ color: '#991b1b', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>
                        {error}
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    style={{
                      width: '100%',
                      height: '48px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: '600',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 10px 15px -3px rgba(102, 126, 234, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </Button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <p style={{ color: '#6b7280', margin: 0, lineHeight: '1.6' }}>
                    Don't have an account?
                  </p>
                  <Link 
                    href="/auth/signup" 
                    style={{ 
                      fontWeight: '600', 
                      color: '#667eea', 
                      textDecoration: 'none',
                      fontSize: '16px',
                      display: 'inline-block',
                      marginTop: '4px'
                    }}
                  >
                    Create one now
                  </Link>
                </div>

            <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '24px' }}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 1024px) {
          .lg\\:hidden {
            display: none !important;
          }
          .hidden {
            display: block !important;
          }
        }
        
        @media (min-width: 1024px) {
          .lg\\:flex {
            display: flex !important;
          }
          .lg\\:hidden {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
