
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPendingDoctors, approveDoctor, rejectDoctor, Doctor } from '@/services/adminService';
import DoctorApprovalCard from '@/components/admin/DoctorApprovalCard';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DoctorApprovals = () => {
  const { user } = useAuth();
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDoctorId, setProcessingDoctorId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  useEffect(() => {
    fetchPendingDoctorsList();
  }, []);
  
  const fetchPendingDoctorsList = async () => {
    setLoading(true);
    const doctors = await fetchPendingDoctors();
    setPendingDoctors(doctors);
    setLoading(false);
  };
  
  const handleApprove = async (doctorId: string) => {
    if (!user?.id) {
      toast.error('You need to be logged in to approve doctors.');
      return;
    }
    
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
      <h1 className="text-2xl font-bold mb-6">Doctor Approvals</h1>
      
      {pendingDoctors.length === 0 ? (
        <div className="text-center p-10 border rounded-lg bg-slate-50">
          <p className="text-gray-500">No pending doctor approvals at this time.</p>
          <Button 
            onClick={fetchPendingDoctorsList}
            className="mt-4"
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
                registrationDate: doctor.created_at
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
