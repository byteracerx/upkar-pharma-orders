
import { User as SupabaseUser } from "@supabase/supabase-js";

// Extended User interface to include additional properties from user metadata
export interface User extends SupabaseUser {
  name?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  isAdmin?: boolean;
  // Add any other properties from user metadata
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gst_number: string;
  is_approved: boolean;
  clinic_name?: string;
  city?: string;
  state?: string;
  pincode?: string;
  license_number?: string;
  specialization?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  user: User | null;
  session: any; // Use more specific type if available
  isAuthenticated: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; error?: any }>;
  signup: (email: string, password: string, userData: any) => Promise<{ success: boolean; message: string }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error?: any }>;
  logout: () => Promise<void>;
  updateUserProfile: (data: any) => Promise<boolean>;
}
