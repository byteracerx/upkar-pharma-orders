
import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

type UserRole = "doctor" | "admin" | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isApproved: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkApprovalStatus: (email: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for auth session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Get user details from the database
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          await fetchUserProfile(session.user.id);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Fetch user profile data from the database
  const fetchUserProfile = async (userId: string) => {
    try {
      // First check if user is an admin (in a real app, you'd have a separate admins table)
      const isAdminEmail = await checkIfAdmin(userId);
      
      if (isAdminEmail) {
        const { data: adminData, error: adminError } = await supabase.auth.getUser(userId);
        
        if (adminError) throw adminError;
        
        const adminUser: User = {
          id: userId,
          name: "Admin",
          email: adminData.user.email || "",
          role: "admin",
          isApproved: true
        };
        
        setUser(adminUser);
        return;
      }
      
      // If not admin, check if user is a doctor
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (doctorError) {
        if (doctorError.code !== "PGRST116") { // Not found error
          throw doctorError;
        }
        setUser(null);
        return;
      }
      
      const doctorUser: User = {
        id: doctorData.id,
        name: doctorData.name,
        email: doctorData.email || "",
        role: "doctor",
        isApproved: doctorData.is_approved
      };
      
      setUser(doctorUser);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(null);
    }
  };
  
  // Check if user is an admin (in a real app, you'd check against an admins table)
  const checkIfAdmin = async (userId: string): Promise<boolean> => {
    try {
      const { data: userData, error } = await supabase.auth.getUser(userId);
      
      if (error) throw error;
      
      // For this example, we'll consider a specific email as admin
      // In a real app, you'd check against an admins table
      return userData.user.email === "admin@upkar.com";
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Check if the user is approved (for doctors)
      if (email !== "admin@upkar.com") {
        const isApproved = await checkApprovalStatus(email);
        if (!isApproved) {
          await logout();
          toast.error("Your account is pending approval. Please contact admin.");
          return false;
        }
      }
      
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error("User registration failed");
      }
      
      // Add doctor details to the doctors table
      const { error: profileError } = await supabase
        .from("doctors")
        .insert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          gst_number: userData.gstNumber,
          is_approved: false // Requires admin approval
        });
      
      if (profileError) throw profileError;
      
      // Notify admin about new registration (in a real app, you'd use a serverless function)
      // For now, we'll just log it
      console.log("New doctor registration:", userData.name);
      
      toast.success("Registration successful! Your account is pending approval.");
      return true;
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  const checkApprovalStatus = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("is_approved")
        .eq("email", email)
        .single();
      
      if (error) throw error;
      
      return data.is_approved;
    } catch (error) {
      console.error("Error checking approval status:", error);
      return false;
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        checkApprovalStatus,
        isAuthenticated,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
