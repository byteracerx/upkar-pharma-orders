
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Doctor } from './types';

// Function to fetch all doctors
export const fetchDoctors = async (): Promise<Doctor[]> => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data as Doctor[];
  } catch (error) {
    console.error('Error fetching doctors:', error);
    toast.error('Failed to load doctors');
    return [];
  }
};

// Function to fetch pending doctors
export const fetchPendingDoctors = async (): Promise<Doctor[]> => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data as Doctor[];
  } catch (error) {
    console.error('Error fetching pending doctors:', error);
    toast.error('Failed to load pending doctors');
    return [];
  }
};

// Function to approve a doctor
export const approveDoctor = async (doctorId: string, adminId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('doctors')
      .update({ 
        is_approved: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', doctorId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error approving doctor:', error);
    toast.error('Failed to approve doctor');
    return false;
  }
};

// Function to reject a doctor
export const rejectDoctor = async (doctorId: string, adminId: string, reason: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('doctors')
      .update({ 
        is_approved: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', doctorId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    toast.error('Failed to reject doctor');
    return false;
  }
};
