import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'supervisor' | 'manager'
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user.email!)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        await fetchUserProfile(session.user.email)
      }
    } catch (error) {
      console.error('Error checking session:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) throw error
      setUser(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(null)
    }
  }

  const signIn = async (email: string, name?: string) => {
    try {
      setLoading(true)

      // Check if email is authorized
      const { data: authorized, error: authError } = await supabase
        .from('authorized_emails')
        .select('*')
        .eq('email', email)
        .single()

      if (authError || !authorized) {
        toast.error('Email not authorized. Please contact your manager.')
        return false
      }

      // Send magic link
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      })

      if (signInError) throw signInError

      // Create or update user profile
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          email,
          name: name || email.split('@')[0],
          role: authorized.role,
        })

      if (upsertError) throw upsertError

      toast.success('Check your email for the login link!')
      return true
    } catch (error) {
      console.error('Error signing in:', error)
      toast.error('Failed to sign in')
      return false
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  return {
    user,
    loading,
    signIn,
    signOut
  }
}