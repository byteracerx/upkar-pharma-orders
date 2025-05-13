
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (newSession) {
          const extendedUser = newSession.user as ExtendedUser;
          // Add name from user metadata if available
          extendedUser.name = extendedUser.user_metadata?.name || '';
          // Check if user is admin (this would normally be a role check)
          extendedUser.isAdmin = extendedUser.email?.endsWith('@admin.com') || false;
        }
        setSession(newSession);
        setUser(newSession?.user as ExtendedUser ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (currentSession) {
        const extendedUser = currentSession.user as ExtendedUser;
        // Add name from user metadata if available
        extendedUser.name = extendedUser.user_metadata?.name || '';
        // Check if user is admin (this would normally be a role check)
        extendedUser.isAdmin = extendedUser.email?.endsWith('@admin.com') || false;
        setSession(currentSession);
        setUser(extendedUser);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Register function
  const register = async (email: string, password: string, userData: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    login,
    signIn: login, // Alias for login
    register,
    signUp: register, // Alias for register
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Create the useAuth hook
export const useAuth = () => useContext(AuthContext);
