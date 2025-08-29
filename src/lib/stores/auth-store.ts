import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string | undefined
  fullName: string | null
  avatarUrl: string | null
  role: string
  timezone: string
  settings: Record<string, unknown>
}

export interface AuthState {
  user: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  setUser: (user: UserProfile | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        session: null,
        isLoading: true,
        isAuthenticated: false,
        error: null,

        signIn: async (email: string, password: string) => {
          try {
            set({ isLoading: true, error: null })

            const response = await fetch('/api/auth/signin', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            })

            const data = await response.json()

            if (!response.ok) {
              throw new Error(data.error || 'Sign in failed')
            }

            if (data.success && data.data) {
              set({
                user: data.data.user,
                session: data.data.session,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              })
            } else {
              throw new Error('Invalid response from server')
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
            })
            throw error
          }
        },

        signUp: async (email: string, password: string, fullName: string) => {
          try {
            set({ isLoading: true, error: null })

            const response = await fetch('/api/auth/signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password, fullName }),
            })

            const data = await response.json()

            if (!response.ok) {
              throw new Error(data.error || 'Sign up failed')
            }

            if (data.success && data.data) {
              set({
                user: data.data.user,
                session: data.data.session,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              })
            } else {
              throw new Error('Invalid response from server')
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
            })
            throw error
          }
        },

        signOut: async () => {
          try {
            set({ isLoading: true, error: null })

            const response = await fetch('/api/auth/signout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            })

            if (!response.ok) {
              console.warn('Sign out request failed, clearing local state anyway')
            }

            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            })
          } catch (error) {
            console.error('Sign out error:', error)
            // Clear local state even if API call fails
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            })
          }
        },

        resetPassword: async (email: string) => {
          try {
            set({ isLoading: true, error: null })

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/auth/reset-password`,
            })

            if (error) {
              throw error
            }

            set({ isLoading: false, error: null })
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Password reset failed'
            set({
              isLoading: false,
              error: errorMessage,
            })
            throw error
          }
        },

        updateProfile: async (updates: Partial<UserProfile>) => {
          try {
            set({ isLoading: true, error: null })

            const response = await fetch('/api/profile', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updates),
            })

            const data = await response.json()

            if (!response.ok) {
              throw new Error(data.error || 'Profile update failed')
            }

            if (data.success && data.data) {
              const currentUser = get().user
              set({
                user: { ...currentUser, ...data.data } as UserProfile,
                isLoading: false,
                error: null,
              })
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Profile update failed'
            set({
              isLoading: false,
              error: errorMessage,
            })
            throw error
          }
        },

        setUser: (user: UserProfile | null) => {
          set({
            user,
            isAuthenticated: !!user,
          })
        },

        setSession: (session: Session | null) => {
          set({ session })
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading })
        },

        setError: (error: string | null) => {
          set({ error })
        },

        clearError: () => {
          set({ error: null })
        },

        initialize: async () => {
          try {
            set({ isLoading: true, error: null })

            // Get initial session
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
              console.error('Error getting session:', error)
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              })
              return
            }

            if (session?.user) {
              // Fetch user profile
              try {
                const response = await fetch('/api/profile', {
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                  },
                })

                if (response.ok) {
                  const data = await response.json()
                  if (data.success && data.data) {
                    set({
                      user: data.data,
                      session,
                      isAuthenticated: true,
                      isLoading: false,
                      error: null,
                    })
                    return
                  }
                }
              } catch (profileError) {
                console.warn('Could not fetch profile:', profileError)
              }

              // Fallback to basic user info from session
              set({
                user: {
                  id: session.user.id,
                  email: session.user.email,
                  fullName: session.user.user_metadata?.full_name || null,
                  avatarUrl: null,
                  role: 'owner',
                  timezone: 'UTC',
                  settings: {},
                },
                session,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              })
            } else {
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              })
            }
          } catch (error) {
            console.error('Auth initialization error:', error)
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            })
          }
        },
      }),
      {
        name: 'vrbnbxoss-auth-store',
        partialize: (state) => ({
          user: state.user,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'vrbnbxoss-auth-store',
    }
  )
)

// Set up Supabase auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  const { setSession, initialize } = useAuthStore.getState()
  
  switch (event) {
    case 'SIGNED_IN':
      setSession(session)
      initialize()
      break
    case 'SIGNED_OUT':
      setSession(null)
      useAuthStore.setState({
        user: null,
        session: null,
        isAuthenticated: false,
        error: null,
      })
      break
    case 'TOKEN_REFRESHED':
      setSession(session)
      break
  }
})