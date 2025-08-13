'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useCallback } from 'react'

interface UseAuthValidationOptions {
  /**
   * Callback function to execute after successful user validation
   */
  onValidationSuccess?: () => void | Promise<void>
  
  /**
   * Whether to automatically validate on mount (default: true)
   */
  autoValidate?: boolean
  
  /**
   * Custom redirect URL for sign out (default: '/auth/signin')
   */
  signOutCallbackUrl?: string
}

interface UseAuthValidationReturn {
  /**
   * Current session data
   */
  session: ReturnType<typeof useSession>['data']
  
  /**
   * Session loading status
   */
  status: ReturnType<typeof useSession>['status']
  
  /**
   * Manually trigger user validation
   */
  validateUser: () => Promise<void>
  
  /**
   * Whether the user is authenticated and validated
   */
  isAuthenticated: boolean
}

/**
 * Custom hook that consolidates session validation logic across the application.
 * 
 * This hook:
 * 1. Checks if user has a valid session
 * 2. Redirects to sign-in if no session
 * 3. Validates that the user still exists in the database
 * 4. Signs out user if validation fails
 * 5. Executes callback on successful validation
 * 
 * @param options Configuration options
 * @returns Authentication state and validation function
 */
export function useAuthValidation(options: UseAuthValidationOptions = {}): UseAuthValidationReturn {
  const {
    onValidationSuccess,
    autoValidate = true,
    signOutCallbackUrl = '/auth/signin'
  } = options

  const { data: session, status } = useSession()
  const router = useRouter()

  const validateUser = useCallback(async () => {
    try {
      const userCheckResponse = await fetch('/api/user/me')
      
      if (userCheckResponse.status === 401) {
        console.log('User session invalid after database reset, logging out')
        await signOut({ callbackUrl: signOutCallbackUrl })
        return
      }
      
      // If user validation passes, execute the success callback
      if (onValidationSuccess) {
        await onValidationSuccess()
      }
    } catch (error) {
      console.error('Error validating user session:', error)
      await signOut({ callbackUrl: signOutCallbackUrl })
    }
  }, [onValidationSuccess, signOutCallbackUrl])

  useEffect(() => {
    if (!autoValidate) return
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // Validate that the user still exists in the database
    validateUser()
  }, [session, status, router, validateUser, autoValidate])

  return {
    session,
    status,
    validateUser,
    isAuthenticated: !!session && status === 'authenticated'
  }
}
