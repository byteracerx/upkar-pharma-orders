
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPendingDoctors, fetchApprovedDoctors, fetchRejectedDoctors, approveDoctor, rejectDoctor } from '@/services/admin/doctorManagement';
import { Doctor } from '@/services/admin/types';
import DoctorList from '@/components/admin/DoctorList';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DoctorsPage = () => {
  const { user, isAdmin } = useAuth();
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [approvedDoctors, setApprovedDoctors] = useState<Doctor[]>([]);
  const [rejectedDoctors, setRejectedDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDoctorId, setProcessingDoctorId] = useState<string | null>(null);
  
  useEffect(() => {
    if (isAdmin) {
      fetchAllDoctors();
    }
  }, [isAdmin]);
  
  const fetchAllDoctors = async () => {
    console.log('Starting to fetch all doctors...');
    setLoading(true);
    try {
      const [pending, approved, rejected] = await Promise.all([
        fetchPendingDoctors(),
        fetchApprovedDoctors(),
        fetchRejectedDoctors()
      ]);
      
      console.log('Received doctors:', { 
        pending: pending.length, 
        approved: approved.length, 
        rejected: rejected.length 
      });
      console.log('Pending doctors data:', pending);
      console.log('Approved doctors data:', approved);
      console.log('Rejected doctors data:', rejected);
      
      setPendingDoctors(pending);
      setApprovedDoctors(approved);
      setRejectedDoctors(rejected);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
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
        // Move doctor from pending to approved
        const doctor = pendingDoctors.find(d => d.id === doctorId);
        if (doctor) {
          setPendingDoctors(current => current.filter(d => d.id !== doctorId));
          setApprovedDoctors(current => [...current, { ...doctor, is_approved: true }]);
        }
        toast.success('Doctor approved successfully!');
      }
    } catch (error) {
      console.error('Error in handleApprove:', error);
      toast.error('Failed to approve doctor');
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
        // Move doctor from pending to rejected
        const doctor = pendingDoctors.find(d => d.id === doctorId);
        if (doctor) {
          setPendingDoctors(current => current.filter(d => d.id !== doctorId));
          setRejectedDoctors(current => [...current, { ...doctor, is_approved: false, rejection_reason: reason }]);
        }
        toast.success('Doctor rejected successfully');
      }
    } catch (error) {
      console.error('Error in handleReject:', error);
      toast.error('Failed to reject doctor');
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
        <span className="ml-2">Loading doctors...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-upkar-blue">Doctor Management</h1>
          <p className="text-gray-600 mt-1">
            Manage doctor registrations and approvals
          </p>
          <div className="text-sm text-gray-500 mt-2">
            Debug: Pending: {pendingDoctors.length}, Approved: {approvedDoctors.length}, Rejected: {rejectedDoctors.length}
          </div>
        </div>
        <Button 
          onClick={fetchAllDoctors}
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingDoctors.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedDoctors.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedDoctors.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-6">
          <DoctorList
            doctors={pendingDoctors.map(doctor => ({
              id: doctor.id,
              name: doctor.name || 'Unknown Doctor',
              email: doctor.email || 'No email provided',
              phone: doctor.phone || 'No phone provided',
              gstNumber: doctor.gst_number || 'No GST number provided',
              registrationDate: doctor.created_at ? new Date(doctor.created_at).toLocaleDateString() : 'Unknown date',
              status: 'pending' as const,
              clinic_name: doctor.clinic_name,
              address: doctor.address,
              city: doctor.city,
              state: doctor.state,
              pincode: doctor.pincode,
              license_number: doctor.license_number,
              specialization: doctor.specialization
            }))}
            status="pending"
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </TabsContent>
        
        <TabsContent value="approved" className="mt-6">
          <DoctorList
            doctors={approvedDoctors.map(doctor => ({
              id: doctor.id,
              name: doctor.name || 'Unknown Doctor',
              email: doctor.email || 'No email provided',
              phone: doctor.phone || 'No phone provided',
              gstNumber: doctor.gst_number || 'No GST number provided',
              registrationDate: doctor.created_at ? new Date(doctor.created_at).toLocaleDateString() : 'Unknown date',
              status: 'approved' as const,
              clinic_name: doctor.clinic_name,
              address: doctor.address,
              city: doctor.city,
              state: doctor.state,
              pincode: doctor.pincode,
              license_number: doctor.license_number,
              specialization: doctor.specialization
            }))}
            status="approved"
          />
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-6">
          <DoctorList
            doctors={rejectedDoctors.map(doctor => ({
              id: doctor.id,
              name: doctor.name || 'Unknown Doctor',
              email: doctor.email || 'No email provided',
              phone: doctor.phone || 'No phone provided',
              gstNumber: doctor.gst_number || 'No GST number provided',
              registrationDate: doctor.created_at ? new Date(doctor.created_at).toLocaleDateString() : 'Unknown date',
              status: 'rejected' as const,
              clinic_name: doctor.clinic_name,
              address: doctor.address,
              city: doctor.city,
              state: doctor.state,
              pincode: doctor.pincode,
              license_number: doctor.license_number,
              specialization: doctor.specialization
            }))}
            status="rejected"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorsPage;
