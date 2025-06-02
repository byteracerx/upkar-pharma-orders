
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPendingDoctors, approveDoctor, rejectDoctor } from '@/services/admin/doctorManagement';
import { Doctor } from '@/services/admin/types';
import DoctorApprovalCard from '@/components/admin/DoctorApprovalCard';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DoctorApprovals = () => {
  const { user } = useAuth();
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDoctorId, setProcessingDoctorId] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('DoctorApprovals component mounted');
    fetchPendingDoctorsList();
  }, []);
  
  const fetchPendingDoctorsList = async () => {
    console.log('Fetching pending doctors list...');
    setLoading(true);
    try {
      const doctors = await fetchPendingDoctors();
      console.log('Received pending doctors:', doctors);
      setPendingDoctors(doctors);
    } catch (error) {
      console.error('Error fetching pending doctors:', error);
      toast.error('Failed to load pending doctors');
    } finally {
      setLoading(false);
    }
  };
  
  const handleApprove = async (doctorId: string) => {
    if (!user?.id) {
      toast.error('You need to be logged in to approve doctors.');
      return;
    }
    
    console.log('Handling approval for doctor:', doctorId);
    setProcessingDoctorId(doctorId);
    
    try {
      const success = await approveDoctor(doctorId, user.id);
      if (success) {
        // Remove approved doctor from list
        setPendingDoctors(current => current.filter(d => d.id !== doctorId));
        toast.success('Doctor approved successfully!');
      }
    } catch (error) {
      console.error('Error approving doctor:', error);
      toast.error('Failed to approve doctor.');
    } finally {
      setProcessingDoctorId(null);
    }
  };
  
  const handleReject = async (doctorId: string, reason: string = '') => {
    if (!user?.id) {
      toast.error('You need to be logged in to reject doctors.');
      return;
    }
    
    console.log('Handling rejection for doctor:', doctorId, 'Reason:', reason);
    setProcessingDoctorId(doctorId);
    
    try {
      const success = await rejectDoctor(doctorId, user.id, reason || 'No reason provided');
      if (success) {
        // Remove rejected doctor from list
        setPendingDoctors(current => current.filter(d => d.id !== doctorId));
        toast.success('Doctor rejected.');
      }
    } catch (error) {
      console.error('Error rejecting doctor:', error);
      toast.error('Failed to reject doctor.');
    } finally {
      setProcessingDoctorId(null);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Doctor Approvals</h1>
        <Button 
          onClick={fetchPendingDoctorsList}
          variant="outline"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh'
          )}
        </Button>
      </div>
      
      {pendingDoctors.length === 0 ? (
        <div className="text-center p-10 border rounded-lg bg-slate-50">
          <p className="text-gray-500 mb-4">No pending doctor approvals at this time.</p>
          <p className="text-sm text-gray-400">
            New doctor registrations will appear here for approval.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingDoctors.map(doctor => (
            <DoctorApprovalCard 
              key={doctor.id}
              doctor={{
                id: doctor.id,
                name: doctor.name,
                email: doctor.email || '',
                phone: doctor.phone,
                address: doctor.address,
                gstNumber: doctor.gst_number,
                registrationDate: new Date(doctor.created_at || '').toLocaleDateString()
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
