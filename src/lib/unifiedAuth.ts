import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export interface AuthContext {
  user: AuthUser;
  source: 'session' | 'jwt';
}

/**
 * Unified auth middleware that handles both NextAuth sessions (web) and JWT tokens (mobile)
 * This allows us to use the same APIs for both web and mobile without duplication
 */
export async function withUnifiedAuth(req: NextRequest): Promise<AuthContext> {
  // First, try NextAuth session (for web app)
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      // For NextAuth, we need to fetch the user from database to get the ID
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        }
      });

      if (user) {
        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name || 'Unknown',
            avatar: user.avatar,
          },
          source: 'session'
        };
      }
    }
  } catch {
    // NextAuth session failed, continue to JWT
  }

  // Second, try JWT token (for mobile app)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { userId: string; email: string };
      
      // Fetch user from database to ensure they still exist
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || 'Unknown',
          avatar: user.avatar,
        },
        source: 'jwt'
      };
    } catch {
      throw new Error('Invalid JWT token');
    }
  }

  throw new Error('No valid authentication found');
}

/**
 * Higher-order function to wrap API routes with unified auth
 */
export function requireAuth<T extends unknown[]>(
  handler: (req: NextRequest, auth: AuthContext, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    try {
      const auth = await withUnifiedAuth(req);
      return await handler(req, auth, ...args);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Utility for handlers that need both authentication and specific route parameters
 * 
 * Usage for dynamic routes like /api/groups/[id]/route.ts:
 * export const GET = requireAuthAndParams(async (request, auth, { params }) => {
 *   const groupId = await params.id
 *   // Your logic here
 * })
 */
export function requireAuthAndParams<T = unknown>(
  handler: (
    request: NextRequest,
    auth: AuthContext,
    routeContext: { params: Promise<T> }
  ) => Promise<Response>
) {
  return requireAuth(async (request, auth, routeContext) => {
    return handler(request, auth, routeContext as { params: Promise<T> });
  });
}
