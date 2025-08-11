import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

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
        token.username = (user as any).username
        token.avatar = (user as any).avatar
      }
      
      // Handle session updates (like when profile name or avatar changes)
      if (trigger === 'update') {
        if (session?.name) {
          token.name = session.name
        }
        if (session?.avatar !== undefined) {
          token.avatar = session.avatar
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub
        ;(session.user as any).username = token.username
        ;(session.user as any).avatar = token.avatar
        // Make sure the updated name from token is reflected in session
        if (token.name) {
          session.user.name = token.name
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin'
  }
}
