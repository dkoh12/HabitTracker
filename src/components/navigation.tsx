'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Home, LogOut, User, ChevronDown, Mail } from 'lucide-react'

export function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  const getLinkStyle = (path: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: isActive(path) ? '#667eea' : '#6b7280',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    background: isActive(path) ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
    transition: 'all 0.2s ease'
  })

  // If user is not logged in, show simplified navbar
  if (!session) {
    return (
      <nav style={{
        borderBottom: '1px solid #e5e7eb',
        background: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '4rem'
          }}>
            <Link href="/" style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textDecoration: 'none'
            }}>
              HabitTracker
            </Link>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Link href="/contact" style={{
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#6b7280',
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}>
                Contact Us
              </Link>
              <Link href="/auth/signin">
                <Button style={{
                  background: 'transparent',
                  color: '#667eea',
                  border: '1px solid #667eea',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav style={{
      borderBottom: '1px solid #e5e7eb',
      background: 'white',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem'
          }}>
            <Link href="/" style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textDecoration: 'none'
            }}>
              HabitTracker
            </Link>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link
                href="/dashboard"
                style={getLinkStyle('/dashboard')}
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/habits"
                style={getLinkStyle('/habits')}
              >
                <Calendar className="w-4 h-4" />
                <span>Habits</span>
              </Link>
              <Link
                href="/groups"
                style={getLinkStyle('/groups')}
              >
                <Users className="w-4 h-4" />
                <span>Groups</span>
              </Link>
              <Link
                href="/contact"
                style={getLinkStyle('/contact')}
              >
                <Mail className="w-4 h-4" />
                <span>Contact Us</span>
              </Link>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            {/* Profile Dropdown */}
            <div 
              style={{ position: 'relative' }}
              onMouseEnter={() => setShowProfileMenu(true)}
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: showProfileMenu ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: showProfileMenu ? '#667eea' : '#6b7280'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  ...((session.user as any)?.avatar 
                    ? {
                        backgroundImage: `url(${(session.user as any).avatar})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }
                    : {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }
                  ),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {!(session.user as any)?.avatar && (session.user?.name || session.user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span>Welcome, {session.user?.name || session.user?.email}</span>
                <ChevronDown className="w-4 h-4" style={{
                  transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }} />
              </button>
              
              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% - 2px)', // Reduce gap to prevent mouse leaving area
                    right: 0,
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                    minWidth: '200px',
                    zIndex: 50,
                    overflow: 'hidden'
                  }}
                >
                  <Link
                    href="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      textDecoration: 'none',
                      color: '#374151',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      borderBottom: '1px solid #f3f4f6'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8fafc'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <User className="w-4 h-4" style={{ color: '#667eea' }} />
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      signOut()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      color: '#374151',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fef2f2'
                      e.currentTarget.style.color = '#dc2626'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#374151'
                    }}
                  >
                    <LogOut className="w-4 h-4" style={{ color: '#dc2626' }} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
