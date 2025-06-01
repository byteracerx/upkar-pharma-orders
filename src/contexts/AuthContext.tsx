
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { User, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const extendedUser = {
          ...session.user,
          name: session.user.user_metadata?.name || null,
          phone: session.user.user_metadata?.phone || null,
          address: session.user.user_metadata?.address || null,
          gstNumber: session.user.user_metadata?.gstNumber || null,
        } as User;
        setUser(extendedUser);
      } else {
        setUser(null);
      }
      checkUserStatus(session?.user?.id, session?.user?.email);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          const extendedUser = {
            ...session.user,
            name: session.user.user_metadata?.name || null,
            phone: session.user.user_metadata?.phone || null,
            address: session.user.user_metadata?.address || null,
            gstNumber: session.user.user_metadata?.gstNumber || null,
          } as User;
          setUser(extendedUser);
          checkUserStatus(session.user.id, session.user.email);
        } else {
          setUser(null);
          setIsAdmin(false);
          setIsApproved(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check if user is admin and if doctor is approved
  const checkUserStatus = async (userId?: string, email?: string) => {
    if (!userId || !email) {
      setLoading(false);
      return;
    }

    try {
      // Check if user is admin based on email
      const isUserAdmin = email === 'admin1@upkar.com';
      setIsAdmin(isUserAdmin);

      if (!isUserAdmin) {
        // Check if doctor is approved
        const { data, error } = await supabase
          .from('doctors')
          .select('is_approved')
          .eq('id', userId)
          .single();

        if (error) {
          console.error("Error checking doctor approval status:", error);
          setIsApproved(false);
        } else {
          setIsApproved(data?.is_approved || false);
        }
      } else {
        // Admins are always "approved"
        setIsApproved(true);
      }
    } catch (error) {
      console.error("Error checking user status:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if the user is admin
      if (email === 'admin1@upkar.com') {
        return { success: true, message: "Admin login successful", error: null };
      }

      // Check if doctor is approved for non-admin users
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('is_approved')
        .eq('id', data.user?.id)
        .single();

      if (doctorError) {
        console.error("Error fetching doctor approval status:", doctorError);
        throw new Error("Could not verify your account status.");
      }

      // If doctor is not approved, sign them out
      if (!doctorData.is_approved) {
        await supabase.auth.signOut();
        return { 
          success: false, 
          message: "Your account is pending approval by an administrator. You'll be notified once approved." 
        };
      }

      return { success: true, message: "Login successful", error: null };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, message: error.message || "Failed to login", error };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      // Prevent admin email from being used in regular signup
      if (email === 'admin1@upkar.com') {
        throw new Error("This email is reserved for administrative use.");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) throw error;

      // Automatically create a doctor record with pending approval
      const { error: doctorError } = await supabase
        .from('doctors')
        .insert({
          id: data.user?.id,
          name: userData.name,
          phone: userData.phone,
          address: userData.address,
          gst_number: userData.gstNumber,
          email: email,
          is_approved: false,
          clinic_name: userData.clinicName || '',
          city: userData.city || '',
          state: userData.state || '',
          pincode: userData.pincode || '',
          license_number: userData.licenseNumber || '',
          specialization: userData.specialization || ''
        });

      if (doctorError) {
        console.error("Error creating doctor record:", doctorError);
        await supabase.auth.signOut();
        throw new Error("Failed to create your doctor profile. Please contact support.");
      }

      return { error: null };
    } catch (error: any) {
      console.error("Signup error:", error);
      return { error };
    }
  };

  const signup = async (email: string, password: string, userData: any) => {
    try {
      const { error } = await signUp(email, password, userData);
      
      if (error) {
        return { 
          success: false, 
          message: error.message || "Failed to register" 
        };
      }
      
      return { 
        success: true, 
        message: "Registration successful! Your account is pending approval by an administrator." 
      };
    } catch (error: any) {
      console.error("Signup error:", error);
      return { success: false, message: error.message || "Failed to register" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const updateUserProfile = async (data: any) => {
    try {
      // Update auth metadata
      const { error } = await supabase.auth.updateUser({
        data: data
      });

      if (error) throw error;

      // If user is a doctor, update doctor record
      if (!isAdmin && user) {
        const { error: doctorError } = await supabase
          .from('doctors')
          .update({
            name: data.name,
            phone: data.phone,
            address: data.address,
            gst_number: data.gstNumber,
            clinic_name: data.clinicName || '',
            city: data.city || '',
            state: data.state || '',
            pincode: data.pincode || '',
            license_number: data.licenseNumber || '',
            specialization: data.specialization || '',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (doctorError) throw doctorError;
      }

      return true;
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    isAdmin,
    isApproved,
    loading,
    login,
    signup,
    signUp,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
