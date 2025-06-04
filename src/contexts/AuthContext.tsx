
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  isRejected: boolean;
  rejectionReason: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; error?: any }>;
  signup: (email: string, password: string, userData: any) => Promise<{ success: boolean; message: string }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error?: any }>;
  logout: () => Promise<void>;
  updateUserProfile: (data: any) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check user's role and approval status
          await checkUserStatus(session.user);
        } else {
          setIsAdmin(false);
          setIsApproved(false);
          setIsRejected(false);
          setRejectionReason(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserStatus(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserStatus = async (user: User) => {
    try {
      console.log('Checking user status for:', user.id);
      
      // Check if user is admin
      const adminEmails = ['admin@upkarpharma.com', 'admin@upkar.com', 'admin1@upkarpharma.com'];
      const userIsAdmin = adminEmails.includes(user.email || '') || 
                         user.user_metadata?.isAdmin === true ||
                         user.app_metadata?.role === 'admin';
      
      setIsAdmin(userIsAdmin);
      
      if (userIsAdmin) {
        console.log('User is admin, skipping doctor status check');
        setIsApproved(true);
        setIsRejected(false);
        setRejectionReason(null);
        return;
      }
      
      // For non-admin users, check doctor approval status
      const { data: doctorData, error } = await supabase
        .from('doctors')
        .select('is_approved, rejection_reason')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error checking doctor status:', error);
        if (error.code === 'PGRST116') {
          console.log('No doctor record found for user');
          setIsApproved(false);
          setIsRejected(false);
          setRejectionReason(null);
        }
        return;
      }
      
      console.log('Doctor data:', doctorData);
      
      if (doctorData) {
        const approved = doctorData.is_approved === true;
        const rejected = doctorData.is_approved === false && doctorData.rejection_reason !== null;
        
        setIsApproved(approved);
        setIsRejected(rejected);
        setRejectionReason(doctorData.rejection_reason);
        
        console.log('Doctor status:', { approved, rejected, reason: doctorData.rejection_reason });
      }
    } catch (error) {
      console.error('Error in checkUserStatus:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { 
          success: false, 
          message: error.message || 'Login failed',
          error 
        };
      }

      if (data.user) {
        await checkUserStatus(data.user);
      }

      return { success: true, message: 'Login successful' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'An unexpected error occurred',
        error 
      };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      console.log('Starting signup process...', { email, userData });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        }
      });

      console.log('Supabase signup response:', { data, error });

      if (error) {
        console.error('Signup error:', error);
        return { 
          success: false, 
          message: error.message || 'Registration failed' 
        };
      }

      if (data.user) {
        console.log('User created successfully, creating doctor record...');
        
        // Insert doctor record
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert({
            id: data.user.id,
            name: userData.name,
            email: email,
            phone: userData.phone,
            address: userData.address,
            gst_number: userData.gstNumber,
            clinic_name: userData.clinicName || '',
            city: userData.city || '',
            state: userData.state || '',
            pincode: userData.pincode || '',
            license_number: userData.licenseNumber || '',
            specialization: userData.specialization || '',
            is_approved: false,
            rejection_reason: null
          });

        if (doctorError) {
          console.error('Error creating doctor record:', doctorError);
          return { 
            success: false, 
            message: 'Registration failed: Could not create doctor profile' 
          };
        }

        console.log('Doctor record created successfully');
        await checkUserStatus(data.user);
      }

      return { 
        success: true, 
        message: 'Registration successful! Please wait for admin approval.' 
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        message: error.message || 'An unexpected error occurred' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Legacy signUp method for backward compatibility
  const signUp = async (email: string, password: string, userData: any) => {
    const result = await signup(email, password, userData);
    return { error: result.success ? null : new Error(result.message) };
  };

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        toast.error('Error logging out');
      } else {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setIsApproved(false);
        setIsRejected(false);
        setRejectionReason(null);
        toast.success('Logged out successfully');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: any): Promise<boolean> => {
    try {
      if (!user) return false;

      const { error } = await supabase.auth.updateUser({
        data
      });

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
        return false;
      }

      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    isAdmin,
    isApproved,
    isRejected,
    rejectionReason,
    loading,
    login,
    signup,
    signUp,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
