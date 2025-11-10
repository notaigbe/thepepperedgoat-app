
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Alert } from 'react-native';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        Alert.alert('Sign In Error', error.message);
        return { error };
      }

      console.log('Sign in successful:', data.user?.email);
      return { error: null };
    } catch (error: any) {
      console.error('Sign in exception:', error);
      Alert.alert('Sign In Error', error.message);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    try {
      console.log('Signing up:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
          data: {
            name,
            phone,
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        Alert.alert('Sign Up Error', error.message);
        return { error };
      }

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            name,
            email,
            phone: phone || '',
            points: 0,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // Create default theme settings
        await supabase
          .from('theme_settings')
          .insert({
            user_id: data.user.id,
            mode: 'auto',
            color_scheme: 'default',
          });

        Alert.alert(
          'Registration Successful',
          'Please check your email to verify your account before signing in.',
          [{ text: 'OK' }]
        );
      }

      console.log('Sign up successful:', data.user?.email);
      return { error: null };
    } catch (error: any) {
      console.error('Sign up exception:', error);
      Alert.alert('Sign Up Error', error.message);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        Alert.alert('Sign Out Error', error.message);
      }
    } catch (error: any) {
      console.error('Sign out exception:', error);
      Alert.alert('Sign Out Error', error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
