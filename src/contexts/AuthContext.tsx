import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  loading: boolean;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    let isHandlingCallback = false;

    // Handle PKCE auth callback with proper error handling
    const handleAuthCallback = async () => {
      if (isHandlingCallback) return;
      isHandlingCallback = true;
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      // Handle errors first
      if (error) {
        console.error('Auth callback error:', error, errorDescription);
        // Let the Auth component handle error display
        return;
      }
      
      // Handle PKCE code exchange
      if (code) {
        setAuthLoading(true);
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            // Add error to URL for Auth component to handle
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('error', 'exchange_failed');
            newUrl.searchParams.set('error_description', exchangeError.message);
            newUrl.searchParams.delete('code');
            window.history.replaceState({}, document.title, newUrl.toString());
          } else if (data.session) {
            // Success - clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error) {
          console.error('Code exchange processing error:', error);
          // Add error to URL for Auth component to handle
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('error', 'processing_failed');
          newUrl.searchParams.set('error_description', 'Authentication processing failed');
          newUrl.searchParams.delete('code');
          window.history.replaceState({}, document.title, newUrl.toString());
        } finally {
          setAuthLoading(false);
        }
      }
    };

    // Handle auth callback before setting up listeners
    handleAuthCallback();

    // Set up auth state listener with proper error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        // Only synchronous state updates here to prevent deadlocks
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle different auth events
        if (event === 'SIGNED_IN') {
          console.log('User signed in successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting initial session:', error);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        console.error('Sign up error:', error);
      } else {
        console.log('Sign up successful, confirmation email sent to:', email);
      }
      
      return { error };
    } catch (error) {
      console.error('Sign up processing error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        
        // Enhanced error handling for email confirmation
        if (error.message.includes('Email not confirmed')) {
          return { 
            error: { 
              ...error, 
              message: 'Email not confirmed',
              details: '請先到您的信箱點擊驗證連結完成帳號驗證後再登入'
            } 
          };
        }
      } else {
        console.log('Sign in successful for:', email);
        
        // Check if user email is confirmed
        if (data.user && !data.user.email_confirmed_at) {
          console.warn('User email not confirmed:', email);
          // Don't block login here as this should be handled by Supabase settings
        }
      }
      
      return { error };
    } catch (error) {
      console.error('Sign in processing error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Sign out successful');
      }
    } catch (error) {
      console.error('Sign out processing error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        console.error('Reset password error:', error);
      } else {
        console.log('Reset password email sent to:', email);
      }
      
      return { error };
    } catch (error) {
      console.error('Reset password processing error:', error);
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error('Update password error:', error);
      } else {
        console.log('Password updated successfully');
      }
      
      return { error };
    } catch (error) {
      console.error('Update password processing error:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    loading,
    authLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};