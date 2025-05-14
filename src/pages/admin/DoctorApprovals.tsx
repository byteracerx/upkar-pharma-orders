import { useState, useEffect } from "react";
import DoctorList from "@/components/admin/DoctorList";
import DoctorSearch from "@/components/admin/DoctorSearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchPendingDoctors, fetchApprovedDoctors, approveDoctor, rejectDoctor } from "@/services/adminService";
import { supabase } from "@/integrations/supabase/client";

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
  
  // Fetch doctors from Supabase
  useEffect(() => {
    fetchDoctors();
    
    // Check if there are any mock doctors in the database
    const checkForMockDoctors = async () => {
      try {
        const { data, error } = await supabase
          .from("doctors")
          .select("id, name, is_approved, created_at")
          .eq("name", "Mock Doctor")
          .maybeSingle();
          
        if (error) {
          console.error("Error checking for mock doctors:", error);
          return;
        }
        
        if (data) {
          console.warn("Found a mock doctor in the database:", data);
          
          // If the mock doctor has been in the database for more than 24 hours, remove it
          const createdAt = new Date(data.created_at);
          const now = new Date();
          const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceCreation > 24) {
            console.log("Mock doctor is older than 24 hours, removing it...");
            
            const { error: deleteError } = await supabase
              .from("doctors")
              .delete()
              .eq("id", data.id);
              
            if (deleteError) {
              console.error("Error removing mock doctor:", deleteError);
            } else {
              console.log("Mock doctor removed successfully");
              fetchDoctors(); // Refresh the data
            }
          }
        }
      } catch (error) {
        console.error("Error in checkForMockDoctors:", error);
      }
    };
    
    checkForMockDoctors();
    
    // Set up real-time subscription
    const doctorsChannel = supabase
      .channel('doctors-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'doctors' },
        (payload) => {
          console.log('Doctors table changed:', payload);
          fetchDoctors(); // Refresh data on any change
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(doctorsChannel);
    };
  }, []);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching doctors data...");
      
      // Fetch pending doctors with cache control
      const pendingData = await fetchPendingDoctors();
      console.log("Pending doctors data:", pendingData);
      
      // Fetch approved doctors with cache control
      const approvedData = await fetchApprovedDoctors();
      console.log("Approved doctors data:", approvedData);
      
      // Format the data
      const formattedPendingDoctors: Doctor[] = pendingData.map(doctor => ({
        id: doctor.id,
        name: doctor.name || "Unnamed Doctor",
        // Generate a placeholder email using the doctor's name or id
        email: `${doctor.name?.toLowerCase().replace(/\s+/g, '.') || doctor.id.substring(0, 8)}@example.com`,
        phone: doctor.phone || "N/A",
        gstNumber: doctor.gst_number || "N/A",
        registrationDate: new Date(doctor.created_at || Date.now()).toLocaleDateString(),
        status: 'pending'
      }));
      
      const formattedApprovedDoctors: Doctor[] = approvedData.map(doctor => ({
        id: doctor.id,
        name: doctor.name || "Unnamed Doctor",
        // Generate a placeholder email using the doctor's name or id
        email: `${doctor.name?.toLowerCase().replace(/\s+/g, '.') || doctor.id.substring(0, 8)}@example.com`,
        phone: doctor.phone || "N/A",
        gstNumber: doctor.gst_number || "N/A",
        registrationDate: new Date(doctor.created_at || Date.now()).toLocaleDateString(),
        status: 'approved'
      }));
      
      console.log("Formatted pending doctors:", formattedPendingDoctors);
      console.log("Formatted approved doctors:", formattedApprovedDoctors);
      
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
      
      console.log("Doctor to approve:", doctorToApprove);
      
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
        
        // Force a refresh of the data from the server
        setTimeout(() => {
          fetchDoctors();
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error approving doctor:", error);
      toast.error("Failed to approve doctor", {
        description: error.message || "An unknown error occurred"
      });
    }
  };
  
  const handleRejectDoctor = async (id: string) => {
    try {
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
    }
  };
  
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
          onClick={async () => {
            try {
              // Find and remove any mock doctors
              const { data, error } = await supabase
                .from("doctors")
                .select("id, name")
                .or("name.ilike.%mock%,name.ilike.%test%");
                
              if (error) {
                throw error;
              }
              
              if (data && data.length > 0) {
                console.log("Found mock doctors:", data);
                
                // Delete each mock doctor
                for (const doctor of data) {
                  const { error: deleteError } = await supabase
                    .from("doctors")
                    .delete()
                    .eq("id", doctor.id);
                    
                  if (deleteError) {
                    console.error(`Error deleting mock doctor ${doctor.id}:`, deleteError);
                  } else {
                    console.log(`Deleted mock doctor: ${doctor.name}`);
                  }
                }
                
                toast.success(`Removed ${data.length} mock doctor(s)`);
                fetchDoctors(); // Refresh the data
              } else {
                toast.info("No mock doctors found");
              }
            } catch (error: any) {
              console.error("Error removing mock doctors:", error);
              toast.error("Failed to remove mock doctors", {
                description: error.message
              });
            }
          }}
        >
          Remove Mock Doctors
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
