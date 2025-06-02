
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPendingDoctors, approveDoctor, rejectDoctor } from '@/services/admin/doctorManagement';
import { Doctor } from '@/services/admin/types';
import DoctorApprovalCard from '@/components/admin/DoctorApprovalCard';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DoctorApprovals = () => {
  const { user, isAdmin } = useAuth();
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDoctorId, setProcessingDoctorId] = useState<string | null>(null);
  
  useEffect(() => {
    if (isAdmin) {
      fetchPendingDoctorsList();
    }
  }, [isAdmin]);
  
  const fetchPendingDoctorsList = async () => {
    console.log('Starting to fetch pending doctors list...');
    setLoading(true);
    try {
      const doctors = await fetchPendingDoctors();
      console.log('Received pending doctors in component:', doctors);
      setPendingDoctors(doctors);
      
      if (doctors.length === 0) {
        console.log('No pending doctors found');
      }
    } catch (error) {
      console.error('Error fetching pending doctors in component:', error);
      toast.error('Failed to load pending doctors');
    } finally {
      setLoading(false);
    }
  };
  
  const handleApprove = async (doctorId: string) => {
    console.log('Handling approval for doctor:', doctorId);
    setProcessingDoctorId(doctorId);
    
    try {
      const success = await approveDoctor(doctorId);
      if (success) {
        // Remove approved doctor from pending list
        setPendingDoctors(current => current.filter(d => d.id !== doctorId));
        console.log('Doctor approved and removed from pending list');
      }
    } catch (error) {
      console.error('Error in handleApprove:', error);
    } finally {
      setProcessingDoctorId(null);
    }
  };
  
  const handleReject = async (doctorId: string, reason: string = '') => {
    console.log('Handling rejection for doctor:', doctorId, 'Reason:', reason);
    setProcessingDoctorId(doctorId);
    
    try {
      const success = await rejectDoctor(doctorId, reason);
      if (success) {
        // Remove rejected doctor from pending list
        setPendingDoctors(current => current.filter(d => d.id !== doctorId));
        console.log('Doctor rejected and removed from pending list');
      }
    } catch (error) {
      console.error('Error in handleReject:', error);
    } finally {
      setProcessingDoctorId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center p-20">
        <p className="text-red-500">Access denied. Admin privileges required.</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
        <span className="ml-2">Loading pending approvals...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-upkar-blue">Doctor Approvals</h1>
          <p className="text-gray-600 mt-1">
            {pendingDoctors.length} pending approval{pendingDoctors.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          onClick={fetchPendingDoctorsList}
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {pendingDoctors.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-gray-50">
          <div className="max-w-md mx-auto">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500 mb-4">No pending doctor approvals at this time.</p>
            <p className="text-sm text-gray-400">
              New doctor registrations will appear here for approval.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingDoctors.map(doctor => (
            <DoctorApprovalCard 
              key={doctor.id}
              doctor={{
                id: doctor.id,
                name: doctor.name || 'Unknown Doctor',
                email: doctor.email || 'No email provided',
                phone: doctor.phone || 'No phone provided',
                address: doctor.address || 'No address provided',
                gstNumber: doctor.gst_number || 'No GST number provided',
                registrationDate: doctor.created_at ? new Date(doctor.created_at).toLocaleDateString() : 'Unknown date',
                clinic_name: doctor.clinic_name,
                city: doctor.city,
                state: doctor.state,
                pincode: doctor.pincode,
                license_number: doctor.license_number,
                specialization: doctor.specialization
              }}
              onApprove={() => handleApprove(doctor.id)}
              onReject={(reason) => handleReject(doctor.id, reason)}
              isProcessing={processingDoctorId === doctor.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorApprovals;
