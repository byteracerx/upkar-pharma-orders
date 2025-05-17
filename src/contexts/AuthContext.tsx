
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Extend User type to include custom metadata properties
interface ExtendedUser extends User {
  name?: string;
  isAdmin?: boolean;
}

// Define the AuthContext type
interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;  // Alias for login
  register: (email: string, password: string, userData: any) => Promise<{ error: any | null; }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any | null; }>;  // Alias for register
  logout: () => Promise<void>;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  login: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  register: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  logout: async () => {},
});

// Create the AuthProvider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.info("AuthProvider: Setting up auth state listener");

    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.info("Auth state changed:", event, newSession?.user?.email);

        if (newSession) {
          const extendedUser = newSession.user as ExtendedUser;

          // Add name from user metadata if available
          extendedUser.name = extendedUser.user_metadata?.name || '';

          // Check if user is admin - using the admin email or role in metadata
          extendedUser.isAdmin =
            extendedUser.email === 'admin@upkar.com' ||
            extendedUser.user_metadata?.role === 'admin' ||
            false;

          setSession(newSession);
          setUser(extendedUser);
        } else {
          setSession(null);
          setUser(null);
        }
      }
    );

    // Check for existing session
    const checkSession = async () => {
      console.info("Checking for existing session");

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession) {
          console.info("Found existing session for:", currentSession.user.email);

          const extendedUser = currentSession.user as ExtendedUser;
          // Add name from user metadata if available
          extendedUser.name = extendedUser.user_metadata?.name || '';
          // Check if user is admin - using the admin email or role in metadata
          extendedUser.isAdmin =
            extendedUser.email === 'admin@upkar.com' ||
            extendedUser.user_metadata?.role === 'admin' ||
            false;

          setSession(currentSession);
          setUser(extendedUser);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error("Login error:", error);
        toast.error("Login Failed", {
          description: error.message || "Please check your credentials and try again"
        });
      }

      return { error };
    } catch (error) {
      console.error("Unexpected login error:", error);
      toast.error("An unexpected error occurred", {
        description: "Please try again later"
      });
      return { error };
    }
  };

  // Register function
  const register = async (email: string, password: string, userData: any) => {
    try {
      console.log("Registering user with data:", { email, userData });

      // First, sign up the user in auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        console.error("Registration error:", error);
        toast.error("Registration Failed", {
          description: error.message || "Please check your information and try again"
        });
        return { error };
      }

      // Get the new user's ID
      const userId = data?.user?.id;

      if (userId) {
        console.log("User registered successfully with ID:", userId);

        // Try to use the ensure_doctor_exists function first
        try {
          console.log("Ensuring doctor record exists using RPC function");

          // Call the RPC function to ensure doctor exists
          const { data: ensureDoctorData, error: ensureDoctorError } = await supabase.rpc(
            'ensure_doctor_exists',
            {
              p_user_id: userId,
              p_name: userData.name || null,
              p_phone: userData.phone || null,
              p_address: userData.address || null,
              p_gst_number: userData.gstNumber || null,
              p_email: email || null,
              p_is_approved: false // New doctors need approval
            }
          );

          if (ensureDoctorError) {
            console.warn("RPC function failed, falling back to direct query:", ensureDoctorError);
            throw ensureDoctorError; // This will trigger the fallback approach
          }

          console.log("Doctor record ensured via RPC:", ensureDoctorData);
        } catch (rpcError) {
          // Fallback: Create doctor record directly
          try {
            console.log("Using fallback approach to create doctor record");

            // Ensure a doctor record exists for this user
            const { error: doctorError } = await supabase
              .from('doctors')
              .upsert({
                id: userId,
                name: userData.name || '',
                phone: userData.phone || '',
                address: userData.address || '',
                gst_number: userData.gstNumber || '',
                is_approved: false,
                email: email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { onConflict: 'id' });

            if (doctorError) {
              console.error("Error creating doctor record:", doctorError);
              // We don't fail the registration if doctor record creation fails
            } else {
              console.log("Doctor record created successfully");
            }
          } catch (doctorError) {
            console.error("Unexpected error creating doctor record:", doctorError);
            // We don't fail the registration if doctor record creation fails
          }
        }
      }

      return { error: null };
    } catch (error) {
      console.error("Unexpected registration error:", error);
      toast.error("An unexpected error occurred", {
        description: "Please try again later"
      });
      return { error };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    loading,
    login,
    signIn: login, // Alias for login
    register,
    signUp: register, // Alias for register
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Create the useAuth hook
export const useAuth = () => useContext(AuthContext);
