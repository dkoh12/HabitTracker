'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Home, LogOut } from 'lucide-react'

export function Navigation() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-primary">
              HabitTracker
            </Link>
            <div className="flex space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/habits"
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Calendar className="w-4 h-4" />
                <span>Habits</span>
              </Link>
              <Link
                href="/groups"
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Users className="w-4 h-4" />
                <span>Groups</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {session.user?.name || session.user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="flex items-center space-x-2"
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
