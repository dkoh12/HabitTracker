import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Types for the authenticated user
export interface AuthenticatedUser {
  id: string
  email: string
  name: string | null
  username: string | null
  avatar: string | null
}

// Context object passed to wrapped handlers
export interface AuthContext {
  user: AuthenticatedUser
  request: NextRequest
}

// Type for route handlers that require authentication
export type AuthenticatedHandler<T = any> = (
  request: NextRequest,
  context: AuthContext,
  routeParams?: T
) => Promise<NextResponse> | NextResponse

/**
 * Higher-order function that wraps API route handlers with authentication
 * 
 * Usage:
 * export const GET = withAuth(async (request, { user }) => {
 *   // Your route logic here - user is guaranteed to be authenticated
 *   const habits = await prisma.habit.findMany({ where: { userId: user.id } })
 *   return NextResponse.json(habits)
 * })
 */
export function withAuth<T = any>(handler: AuthenticatedHandler<T>) {
  return async function authenticatedRoute(
    request: NextRequest,
    routeParams?: T
  ): Promise<NextResponse> {
    try {
      // 1. Get and validate session
      const session = await getServerSession(authOptions)

      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' }, 
          { status: 401 }
        )
      }

      // 2. Create authenticated user object with proper typing
      const authenticatedUser: AuthenticatedUser = {
        id: (session.user as any).id,
        email: session.user.email!,
        name: session.user.name,
        username: (session.user as any).username,
        avatar: (session.user as any).avatar
      }

      // 3. Create context object
      const context: AuthContext = {
        user: authenticatedUser,
        request
      }

      // 4. Call the actual handler with authenticated context
      return await handler(request, context, routeParams)

    } catch (error) {
      console.error('API Error:', error)
      
      // Handle specific error types
      if (error instanceof Error) {
        // Check for common database constraint errors
        if (error.message.includes('Unique constraint')) {
          return NextResponse.json(
            { error: 'Resource already exists' },
            { status: 409 }
          )
        }
        
        if (error.message.includes('Foreign key constraint')) {
          return NextResponse.json(
            { error: 'Referenced resource not found' },
            { status: 400 }
          )
        }
      }

      // Generic server error
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Utility for handlers that need both authentication and specific route parameters
 * 
 * Usage for dynamic routes like /api/groups/[id]/route.ts:
 * export const GET = withAuthAndParams(async (request, { user }, { params }) => {
 *   const groupId = await params.id
 *   // Your logic here
 * })
 */
export function withAuthAndParams<T = any>(
  handler: (
    request: NextRequest,
    context: AuthContext,
    routeContext: { params: T }
  ) => Promise<NextResponse> | NextResponse
) {
  return withAuth(async (request, context, routeParams) => {
    return handler(request, context, routeParams as { params: T })
  })
}
