
import { useState, useEffect } from "react";
import DoctorList from "@/components/admin/DoctorList";
import DoctorSearch from "@/components/admin/DoctorSearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  }, []);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      
      // Fetch pending doctors (not approved)
      const { data: pendingData, error: pendingError } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_approved', false);
        
      if (pendingError) throw pendingError;
      
      // Fetch approved doctors
      const { data: approvedData, error: approvedError } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_approved', true);
        
      if (approvedError) throw approvedError;
      
      // Format the data - using placeholder emails since we can't query auth.users directly
      const formattedPendingDoctors: Doctor[] = pendingData.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        email: `${doctor.name.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Placeholder email
        phone: doctor.phone,
        gstNumber: doctor.gst_number,
        registrationDate: new Date(doctor.created_at || Date.now()).toLocaleDateString(),
        status: 'pending'
      }));
      
      const formattedApprovedDoctors: Doctor[] = approvedData.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        email: `${doctor.name.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Placeholder email
        phone: doctor.phone,
        gstNumber: doctor.gst_number,
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
  
  const handleApproveDoctor = (id: string) => {
    const doctorToApprove = pendingDoctors.find(doctor => doctor.id === id);
    if (doctorToApprove) {
      setPendingDoctors(pendingDoctors.filter(doctor => doctor.id !== id));
      setApprovedDoctors([...approvedDoctors, { ...doctorToApprove, status: "approved" }]);
    }
  };
  
  const handleRejectDoctor = (id: string) => {
    const doctorToReject = pendingDoctors.find(doctor => doctor.id === id);
    if (doctorToReject) {
      setPendingDoctors(pendingDoctors.filter(doctor => doctor.id !== id));
      setRejectedDoctors([...rejectedDoctors, { ...doctorToReject, status: "rejected" }]);
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
