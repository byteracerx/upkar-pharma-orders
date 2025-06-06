
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Doctor } from './types';

// Function to fetch all doctors (excluding admins)
export const fetchDoctors = async (): Promise<Doctor[]> => {
  try {
    console.log('Fetching all doctors...');
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .neq('gst_number', 'ADMIN00000000000') // Exclude admin users
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }

    console.log('Fetched doctors:', data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchDoctors:', error);
    toast.error('Failed to load doctors');
    return [];
  }
};

// Function to fetch pending doctors (not approved and not rejected, excluding admins)
export const fetchPendingDoctors = async (): Promise<Doctor[]> => {
  try {
    console.log('Fetching pending doctors...');
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('is_approved', false)
      .is('rejection_reason', null)
      .neq('gst_number', 'ADMIN00000000000') // Exclude admin users
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending doctors:', error);
      throw error;
    }

    console.log('Fetched pending doctors:', data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchPendingDoctors:', error);
    toast.error('Failed to load pending doctors');
    return [];
  }
};

// Function to fetch approved doctors (excluding admins)
export const fetchApprovedDoctors = async (): Promise<Doctor[]> => {
  try {
    console.log('Fetching approved doctors...');
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('is_approved', true)
      .neq('gst_number', 'ADMIN00000000000') // Exclude admin users
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching approved doctors:', error);
      throw error;
    }

    console.log('Fetched approved doctors:', data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchApprovedDoctors:', error);
    toast.error('Failed to load approved doctors');
    return [];
  }
};

// Function to fetch rejected doctors (excluding admins)
export const fetchRejectedDoctors = async (): Promise<Doctor[]> => {
  try {
    console.log('Fetching rejected doctors...');
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('is_approved', false)
      .not('rejection_reason', 'is', null)
      .neq('gst_number', 'ADMIN00000000000') // Exclude admin users
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rejected doctors:', error);
      throw error;
    }

    console.log('Fetched rejected doctors:', data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchRejectedDoctors:', error);
    toast.error('Failed to load rejected doctors');
    return [];
  }
};

// Function to approve a doctor
export const approveDoctor = async (doctorId: string): Promise<boolean> => {
  try {
    console.log('Approving doctor:', doctorId);
    
    const { data, error } = await supabase
      .from('doctors')
      .update({ 
        is_approved: true, 
        rejection_reason: null, // Clear any previous rejection reason
        updated_at: new Date().toISOString() 
      })
      .eq('id', doctorId)
      .select()
      .single();

    if (error) {
      console.error('Error approving doctor:', error);
      throw error;
    }

    console.log('Doctor approved successfully:', data);
    toast.success('Doctor approved successfully!');

    // Send notification if needed
    try {
      await supabase.functions.invoke('notify-doctor-approval', {
        body: {
          doctorId: data.id,
          doctorName: data.name,
          doctorEmail: data.email,
          doctorPhone: data.phone,
          approved: true
        }
      });
      console.log(`Approval notification sent to doctor: ${data.name}`);
    } catch (notifyError) {
      console.error('Error sending approval notification:', notifyError);
    }

    return true;
  } catch (error) {
    console.error('Error approving doctor:', error);
    toast.error('Failed to approve doctor');
    return false;
  }
};

// Function to reject a doctor
export const rejectDoctor = async (doctorId: string, reason: string = ''): Promise<boolean> => {
  try {
    console.log('Rejecting doctor:', doctorId, 'Reason:', reason);
    
    // Get doctor details before rejection
    const { data: doctorData, error: fetchError } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', doctorId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching doctor for rejection:', fetchError);
      throw fetchError;
    }
    
    // Update doctor record with rejection
    const { error } = await supabase
      .from('doctors')
      .update({ 
        is_approved: false, 
        rejection_reason: reason || "Your application did not meet our requirements.",
        updated_at: new Date().toISOString() 
      })
      .eq('id', doctorId);

    if (error) {
      console.error('Error updating doctor record for rejection:', error);
      throw error;
    }

    console.log('Doctor rejected successfully');
    toast.success('Doctor rejected.');

    // Send notification
    try {
      await supabase.functions.invoke('notify-doctor-approval', {
        body: {
          doctorId: doctorData.id,
          doctorName: doctorData.name,
          doctorEmail: doctorData.email,
          doctorPhone: doctorData.phone,
          approved: false,
          reason: reason || "Your application did not meet our requirements."
        }
      });
      console.log(`Rejection notification sent to doctor: ${doctorData.name}`);
    } catch (notifyError) {
      console.error('Error sending rejection notification:', notifyError);
    }

    return true;
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    toast.error('Failed to reject doctor');
    return false;
  }
};
