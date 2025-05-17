
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define user roles
export type UserRole = 'admin' | 'doctor' | 'unapproved';

// Extend User type to include custom metadata properties
interface ExtendedUser extends User {
  name?: string;
  role?: UserRole;
}

// Define the AuthContext type
interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isApprovedDoctor: boolean;
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
  isDoctor: false,
  isApprovedDoctor: false,
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

  // Function to determine user role
  const determineUserRole = async (user: User): Promise<UserRole> => {
    // Admin check - using the admin email or role in metadata
    if (
      user.email === 'admin@upkar.com' || 
      user.user_metadata?.role === 'admin'
    ) {
      console.log("User determined to be admin:", user.email);
      return 'admin';
    }

    try {
      // Check if user is a doctor and if approved
      const { data: doctorData, error } = await supabase
        .from('doctors')
        .select('is_approved')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error checking doctor status:", error);
        return 'unapproved';
      }

      const role = doctorData.is_approved ? 'doctor' : 'unapproved';
      console.log("User determined to be:", role);
      return role;
    } catch (err) {
      console.error("Error determining user role:", err);
      return 'unapproved';
    }
  };

  useEffect(() => {
    console.log("AuthProvider: Setting up auth state listener");
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.email);
        
        if (newSession && newSession.user) {
          const extendedUser = newSession.user as ExtendedUser;
          
          // Add name from user metadata if available
          extendedUser.name = extendedUser.user_metadata?.name || '';
          
          // Determine user role
          extendedUser.role = await determineUserRole(extendedUser);
          console.log("User role set:", extendedUser.role);
          
          setSession(newSession);
          setUser(extendedUser);
        } else {
          setSession(null);
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    const checkCurrentSession = async () => {
      console.log("Checking for existing session");
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession && currentSession.user) {
        console.log("Existing session found:", currentSession.user.email);
        const extendedUser = currentSession.user as ExtendedUser;
        
        // Add name from user metadata if available
        extendedUser.name = extendedUser.user_metadata?.name || '';
        
        // Determine user role
        extendedUser.role = await determineUserRole(extendedUser);
        console.log("User role set for existing session:", extendedUser.role);
        
        setSession(currentSession);
        setUser(extendedUser);
      } else {
        console.log("No existing session found");
      }
      
      setLoading(false);
    };
    
    checkCurrentSession();

    return () => {
      console.log("Unsubscribing from auth state changes");
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    console.log("Attempting login for:", email);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("Login error:", error.message);
        toast.error("Login failed", {
          description: error.message
        });
      } else {
        console.log("Login successful");
      }
      return { error };
    } catch (error) {
      console.error("Unexpected login error:", error);
      toast.error("Login failed", {
        description: "An unexpected error occurred"
      });
      return { error };
    }
  };

  // Register function
  const register = async (email: string, password: string, userData: any) => {
    console.log("Attempting registration for:", email);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      if (error) {
        console.error("Registration error:", error.message);
        toast.error("Registration failed", {
          description: error.message
        });
      } else {
        console.log("Registration successful");
        toast.success("Registration successful", {
          description: "Please check your email for verification"
        });
      }
      return { error };
    } catch (error) {
      console.error("Unexpected registration error:", error);
      toast.error("Registration failed", {
        description: "An unexpected error occurred"
      });
      return { error };
    }
  };

  // Logout function
  const logout = async () => {
    console.log("Logging out user");
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDoctor: user?.role === 'doctor',
    isApprovedDoctor: user?.role === 'doctor',
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
