import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// Extended user type for NextAuth
interface ExtendedUser {
  id: string;
  email: string;
  name: string | null;
  username: string;
  avatar: string | null;
}

// Extended JWT token type
interface ExtendedToken {
  sub?: string;
  name?: string | null;
  username?: string;
  avatar?: string | null;
}

// Extended session type
interface ExtendedSession {
  name?: string;
  avatar?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.username = (user as ExtendedUser).username
        token.avatar = (user as ExtendedUser).avatar
      }
      
      // Handle session updates (like when profile name or avatar changes)
      if (trigger === 'update') {
        const updateSession = session as ExtendedSession
        if (updateSession?.name) {
          token.name = updateSession.name
        }
        if (updateSession?.avatar !== undefined) {
          token.avatar = updateSession.avatar
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const extendedToken = token as ExtendedToken
        ;(session.user as ExtendedUser).id = extendedToken.sub || ''
        ;(session.user as ExtendedUser).username = extendedToken.username || ''
        ;(session.user as ExtendedUser).avatar = extendedToken.avatar || null
        // Make sure the updated name from token is reflected in session
        if (extendedToken.name) {
          session.user.name = extendedToken.name
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin'
  }
}
