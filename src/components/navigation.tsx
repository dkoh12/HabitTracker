'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Home, LogOut } from 'lucide-react'

export function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) return null

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

  if (!session) return null

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
                href="/"
                style={getLinkStyle('/')}
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
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span style={{
              fontSize: '0.9rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Welcome, {session.user?.name || session.user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'transparent',
                border: 'none',
                color: '#6b7280',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
