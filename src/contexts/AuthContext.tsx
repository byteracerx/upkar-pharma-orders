
import React, { createContext, useState, useContext, useEffect } from "react";

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
  logout: () => void;
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

  useEffect(() => {
    // Check for stored user in localStorage
    const storedUser = localStorage.getItem("upkar_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Mock login for now - In a real application, this would be an API call
      if (email === "admin@upkar.com" && password === "admin123") {
        const adminUser = {
          id: "admin-123",
          name: "Admin User",
          email: "admin@upkar.com",
          role: "admin" as UserRole,
          isApproved: true
        };
        setUser(adminUser);
        localStorage.setItem("upkar_user", JSON.stringify(adminUser));
        return true;
      } 
      else if (email === "doctor@example.com" && password === "doctor123") {
        const doctorUser = {
          id: "doctor-123",
          name: "Dr. Sharma",
          email: "doctor@example.com",
          role: "doctor" as UserRole,
          isApproved: true
        };
        setUser(doctorUser);
        localStorage.setItem("upkar_user", JSON.stringify(doctorUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Mock registration for now - In a real application, this would be an API call
      console.log("Registering user:", userData);
      
      // Simulate successful registration
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("upkar_user");
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
        isAuthenticated,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
