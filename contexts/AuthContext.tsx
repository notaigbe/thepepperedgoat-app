
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Alert } from 'react-native';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data?.is_admin || false);
      console.log('Admin status:', data?.is_admin);
    } catch (error) {
      console.error('Exception checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const refreshAdminStatus = async () => {
    if (user?.id) {
      await checkAdminStatus(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        checkAdminStatus(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
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
      if (data.user?.id) {
        await checkAdminStatus(data.user.id);
      }
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

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
        // Comment out for auto-confirm in dev (email testing mode)
        emailRedirectTo: 'https://natively.dev/email-confirmed',
      },
    });

    if (error) {
      console.error('Sign-up error:', error);
      Alert.alert('Sign Up Error', error.message);
      return { error };
    }

    // Handle confirmation or auto-signin
    if (data.user) {
      if (data.session) {
        // Auto-confirmed (dev mode)
        console.log('User auto-confirmed:', data.user.email);
        Alert.alert('Welcome!', 'Your account has been created successfully.');
      } else {
        // Confirmation required (production mode)
        console.log('Confirmation email sent to:', data.user.email);
        Alert.alert(
          'Registration Successful',
          'Please check your email to verify your account before signing in.'
        );
      }
    }

    console.log('Sign-up complete for:', data.user?.email);
    return { error: null };
  } catch (error: any) {
    console.error('Sign-up exception:', error);
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
        throw error;
      }
      setIsAdmin(false);
      console.log('Sign out successful');
    } catch (error: any) {
      console.error('Sign out exception:', error);
      Alert.alert('Sign Out Error', error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        isAdmin,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!session,
        refreshAdminStatus,
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