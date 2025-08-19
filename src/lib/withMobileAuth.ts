import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

export async function verifyJWT(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    return user;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export function withMobileAuth<T extends unknown[]>(
  handler: (request: NextRequest, context: { user: AuthenticatedUser }, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const user = await verifyJWT(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(request, { user }, ...args);
  };
}

// Separate wrapper for dynamic routes that need params
export function withMobileAuthAndParams(
  handler: (request: NextRequest, context: { user: AuthenticatedUser }, routeContext: { params: Promise<{ id: string }> }) => Promise<Response>
) {
  return async (request: NextRequest, routeContext: { params: Promise<{ id: string }> }): Promise<Response> => {
    const user = await verifyJWT(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(request, { user }, routeContext);
  };
}
