
import { useState, useEffect } from "react";
import DoctorList from "@/components/admin/DoctorList";
import DoctorSearch from "@/components/admin/DoctorSearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchPendingDoctors, fetchApprovedDoctors, approveDoctor, rejectDoctor } from "@/services/adminService";
import { subscribeToDoctors } from "@/services/realtimeService";

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  gstNumber: string;
  registrationDate: string;
  status: "pending" | "approved" | "rejected";
}

const DoctorApprovals = () => {
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [approvedDoctors, setApprovedDoctors] = useState<Doctor[]>([]);
  const [rejectedDoctors, setRejectedDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [processingDoctors, setProcessingDoctors] = useState<Set<string>>(new Set());
  
  // Fetch doctors from Supabase
  useEffect(() => {
    fetchDoctors();
    
    // Set up real-time subscription for doctors table
    const unsubscribe = subscribeToDoctors((payload) => {
      // Only update if we're not currently processing this doctor
      const doctorId = payload.new?.id;
      if (!doctorId || !processingDoctors.has(doctorId)) {
        console.log("Doctors table changed, refreshing data");
        fetchDoctors();
      }
    });
    
    return () => {
      unsubscribe(); // Clean up subscription on unmount
    };
  }, [processingDoctors]);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      
      // Fetch pending doctors
      const pendingData = await fetchPendingDoctors();
      
      // Fetch approved doctors
      const approvedData = await fetchApprovedDoctors();
      
      // Format the data
      const formattedPendingDoctors: Doctor[] = pendingData.map(doctor => ({
        id: doctor.id,
        name: doctor.name || "Unnamed Doctor",
        email: `${doctor.name?.toLowerCase().replace(/\s+/g, '.') || doctor.id.substring(0, 8)}@example.com`,
        phone: doctor.phone || "N/A",
        gstNumber: doctor.gst_number || "N/A",
        registrationDate: new Date(doctor.created_at || Date.now()).toLocaleDateString(),
        status: 'pending'
      }));
      
      const formattedApprovedDoctors: Doctor[] = approvedData.map(doctor => ({
        id: doctor.id,
        name: doctor.name || "Unnamed Doctor",
        email: `${doctor.name?.toLowerCase().replace(/\s+/g, '.') || doctor.id.substring(0, 8)}@example.com`,
        phone: doctor.phone || "N/A",
        gstNumber: doctor.gst_number || "N/A",
        registrationDate: new Date(doctor.created_at || Date.now()).toLocaleDateString(),
        status: 'approved'
      }));
      
      setPendingDoctors(formattedPendingDoctors);
      setApprovedDoctors(formattedApprovedDoctors);
      
    } catch (error: any) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to load doctors", {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApproveDoctor = async (id: string) => {
    try {
      console.log(`Handling approval for doctor ID: ${id}`);
      
      // Find the doctor in the pending list before making the API call
      const doctorToApprove = pendingDoctors.find(doctor => doctor.id === id);
      
      if (!doctorToApprove) {
        console.error("Doctor not found in pending list:", id);
        toast.error("Failed to approve doctor", {
          description: "Doctor not found in pending list"
        });
        return;
      }
      
      // Add to processed set to prevent double processing from realtime events
      setProcessingDoctors(prev => new Set(prev).add(id));
      
      // Call the API to approve the doctor
      const success = await approveDoctor(id);
      
      if (success) {
        console.log("Doctor approved successfully, updating UI state");
        
        // Update the UI state
        setPendingDoctors(prevPending => prevPending.filter(doctor => doctor.id !== id));
        setApprovedDoctors(prevApproved => [...prevApproved, { ...doctorToApprove, status: "approved" }]);
        
        // Show success message
        toast.success("Doctor Approved", {
          description: `${doctorToApprove.name} has been approved successfully`
        });
      }
    } catch (error: any) {
      console.error("Error approving doctor:", error);
      toast.error("Failed to approve doctor", {
        description: error.message || "An unknown error occurred"
      });
    } finally {
      // Remove from processing set
      setProcessingDoctors(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    }
  };
  
  const handleRejectDoctor = async (id: string) => {
    try {
      // Add to processed set to prevent double processing
      setProcessingDoctors(prev => new Set(prev).add(id));
      
      const success = await rejectDoctor(id);
      
      if (success) {
        const doctorToReject = pendingDoctors.find(doctor => doctor.id === id);
        if (doctorToReject) {
          setPendingDoctors(pendingDoctors.filter(doctor => doctor.id !== id));
          setRejectedDoctors([...rejectedDoctors, { ...doctorToReject, status: "rejected" }]);
          
          toast.success("Doctor Rejected", {
            description: `${doctorToReject.name}'s application has been rejected`
          });
        }
      }
    } catch (error: any) {
      console.error("Error rejecting doctor:", error);
      toast.error("Failed to reject doctor", {
        description: error.message
      });
    } finally {
      // Remove from processing set
      setProcessingDoctors(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    }
  };
  
  // Filter doctors based on search query
  const filteredPendingDoctors = pendingDoctors.filter(
    doctor => 
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.phone.includes(searchQuery)
  );
  
  const filteredApprovedDoctors = approvedDoctors.filter(
    doctor => 
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.phone.includes(searchQuery)
  );
  
  const filteredRejectedDoctors = rejectedDoctors.filter(
    doctor => 
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.phone.includes(searchQuery)
  );
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Doctor Approvals</h1>
        
        <Button 
          variant="outline" 
          onClick={fetchDoctors}
        >
          Refresh Data
        </Button>
      </div>
      
      <div className="mb-6">
        <DoctorSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingDoctors.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingDoctors.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
            </div>
          ) : (
            <DoctorList 
              doctors={filteredPendingDoctors} 
              status="pending"
              onApprove={handleApproveDoctor}
              onReject={handleRejectDoctor}
            />
          )}
        </TabsContent>
        
        <TabsContent value="approved">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
            </div>
          ) : (
            <DoctorList 
              doctors={filteredApprovedDoctors} 
              status="approved"
            />
          )}
        </TabsContent>
        
        <TabsContent value="rejected">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
            </div>
          ) : (
            <DoctorList 
              doctors={filteredRejectedDoctors} 
              status="rejected"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorApprovals;
