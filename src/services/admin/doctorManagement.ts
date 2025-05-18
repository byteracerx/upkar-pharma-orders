
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
    // Update doctor record
    const { data, error } = await supabase
      .from('doctors')
      .update({ 
        is_approved: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', doctorId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Get doctor details for notification
    const doctor = data;
    
    // Send notification to doctor about approval
    try {
      await supabase.functions.invoke('notify-doctor-approval', {
        body: {
          doctorId: doctor.id,
          doctorName: doctor.name,
          doctorEmail: doctor.email,
          doctorPhone: doctor.phone,
          approved: true
        }
      });
      
      console.log(`Approval notification sent to doctor: ${doctor.name}`);
    } catch (notifyError) {
      console.error('Error sending approval notification:', notifyError);
      // We don't fail the approval just because notification failed
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
    // Get doctor details before rejection (for notification)
    const { data: doctorData, error: fetchError } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', doctorId)
      .single();
      
    if (fetchError) {
      throw fetchError;
    }
    
    // Update the doctor record
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

    // Send notification to doctor about rejection
    try {
      await supabase.functions.invoke('notify-doctor-approval', {
        body: {
          doctorId: doctorData.id,
          doctorName: doctorData.name,
          doctorEmail: doctorData.email,
          doctorPhone: doctorData.phone,
          approved: false,
          reason: reason
        }
      });
      
      console.log(`Rejection notification sent to doctor: ${doctorData.name}`);
    } catch (notifyError) {
      console.error('Error sending rejection notification:', notifyError);
      // We don't fail the rejection just because notification failed
    }

    return true;
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    toast.error('Failed to reject doctor');
    return false;
  }
};
