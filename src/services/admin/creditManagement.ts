
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Function to get doctor credits
export const getDoctorCredits = async (doctorId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_doctor_credit_summary', {
        p_doctor_id: doctorId
      });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting doctor credits:', error);
    toast.error('Failed to load credit information');
    return null;
  }
};

// Function to get all doctors with credit information
export const getAllDoctorsWithCredits = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_all_doctor_credits');

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting all doctors with credits:', error);
    toast.error('Failed to load doctor credits');
    return [];
  }
};
