
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Define a more comprehensive interface for authenticated user data
interface AuthUser extends User {
  name?: string;
  isAdmin?: boolean;
  isApproved?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  loading: boolean;
  error: string | null;
  session: Session | null;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (data: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isApproved: false,
  loading: true,
  error: null,
  session: null,
  signUp: async () => ({ error: null }),
  login: async () => ({ error: null }),
  logout: async () => {},
  resetPassword: async () => ({ error: null }),
  updateProfile: async () => ({ error: null }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // Check if the user is an admin
  const checkAdminStatus = (email: string) => {
    return email === 'admin@upkar.com';
  };

  // Check if the doctor is approved
  const checkDoctorApproval = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('is_approved')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking doctor approval:', error);
        return false;
      }

      return data?.is_approved || false;
    } catch (error) {
      console.error('Error in checkDoctorApproval:', error);
      return false;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          const currentUser = currentSession.user as AuthUser;
          
          // Check if admin
          const isUserAdmin = checkAdminStatus(currentUser.email || '');
          setIsAdmin(isUserAdmin);
          
          // If not admin, check if doctor is approved
          if (!isUserAdmin) {
            const isDoctorApproved = await checkDoctorApproval(currentUser.id);
            setIsApproved(isDoctorApproved);
            currentUser.isApproved = isDoctorApproved;
          } else {
            // Admins are always approved
            setIsApproved(true);
            currentUser.isApproved = true;
          }
          
          currentUser.isAdmin = isUserAdmin;
          currentUser.name = currentUser.user_metadata?.name || '';
          setUser(currentUser);
        } else {
          setUser(null);
          setIsAdmin(false);
          setIsApproved(false);
        }
        
        // Handle auth events
        if (event === 'SIGNED_IN') {
          console.log('User signed in successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          const initialUser = initialSession.user as AuthUser;
          
          // Check if admin
          const isUserAdmin = checkAdminStatus(initialUser.email || '');
          setIsAdmin(isUserAdmin);
          
          // If not admin, check if doctor is approved
          if (!isUserAdmin) {
            const isDoctorApproved = await checkDoctorApproval(initialUser.id);
            setIsApproved(isDoctorApproved);
            initialUser.isApproved = isDoctorApproved;
          } else {
            // Admins are always approved
            setIsApproved(true);
            initialUser.isApproved = true;
          }
          
          initialUser.isAdmin = isUserAdmin;
          initialUser.name = initialUser.user_metadata?.name || '';
          
          setUser(initialUser);
          setSession(initialSession);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) {
        setError(error.message);
        return { error };
      }

      // After signup, the doctor needs approval - they are not automatically approved
      return { error: null };
    } catch (err: any) {
      setError(err.message);
      return { error: err };
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error.message);
        return { error };
      }

      // Success - check if admin
      const isUserAdmin = checkAdminStatus(email);
      
      // If not admin, check if approved
      if (!isUserAdmin && data.user) {
        const isDoctorApproved = await checkDoctorApproval(data.user.id);
        
        if (!isDoctorApproved) {
          // Sign out if not approved
          await supabase.auth.signOut();
          setError('Your account is pending approval. Please wait for admin approval or contact support.');
          toast.error('Login Failed', {
            description: 'Your account is pending approval. Please wait for admin approval.'
          });
          return { error: { message: 'Account pending approval' } };
        }
      }
      
      return { error: null };
    } catch (err: any) {
      setError(err.message);
      return { error: err };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      
      if (error) {
        setError(error.message);
        return { error };
      }
      
      return { error: null };
    } catch (err: any) {
      setError(err.message);
      return { error: err };
    }
  };

  // Update profile function
  const updateProfile = async (data: any) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data
      });
      
      if (error) {
        setError(error.message);
        return { error };
      }
      
      if (user) {
        setUser({
          ...user,
          ...data
        });
      }
      
      return { error: null };
    } catch (err: any) {
      setError(err.message);
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isApproved,
        loading,
        error,
        session,
        signUp,
        login,
        logout,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
