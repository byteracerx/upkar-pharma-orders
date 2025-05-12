
import { useState } from "react";
import DoctorApprovalCard from "@/components/admin/DoctorApprovalCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Mock data for pending approvals
const mockPendingDoctors = [
  {
    id: "1",
    name: "Dr. Rajesh Kumar",
    email: "rajesh.kumar@example.com",
    phone: "9876543210",
    gstNumber: "27AAPFU0939F1ZV",
    registrationDate: "2023-05-12",
    status: "pending"
  },
  {
    id: "2",
    name: "Dr. Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "9876543211",
    gstNumber: "27AAPFU0939F2ZV",
    registrationDate: "2023-05-13",
    status: "pending"
  },
  {
    id: "3",
    name: "Dr. Amit Patel",
    email: "amit.patel@example.com",
    phone: "9876543212",
    gstNumber: "27AAPFU0939F3ZV",
    registrationDate: "2023-05-14",
    status: "pending"
  },
  {
    id: "4",
    name: "Dr. Neha Singh",
    email: "neha.singh@example.com",
    phone: "9876543213",
    gstNumber: "27AAPFU0939F4ZV",
    registrationDate: "2023-05-15",
    status: "pending"
  },
];

const mockApprovedDoctors = [
  {
    id: "5",
    name: "Dr. Vikram Singh",
    email: "vikram.singh@example.com",
    phone: "9876543214",
    gstNumber: "27AAPFU0939F5ZV",
    registrationDate: "2023-05-10",
    status: "approved"
  },
  {
    id: "6",
    name: "Dr. Ananya Desai",
    email: "ananya.desai@example.com",
    phone: "9876543215",
    gstNumber: "27AAPFU0939F6ZV",
    registrationDate: "2023-05-11",
    status: "approved"
  },
];

const mockRejectedDoctors = [
  {
    id: "7",
    name: "Dr. Suresh Joshi",
    email: "suresh.joshi@example.com",
    phone: "9876543216",
    gstNumber: "27AAPFU0939F7ZV",
    registrationDate: "2023-05-08",
    status: "rejected"
  },
];

const DoctorApprovals = () => {
  const [pendingDoctors, setPendingDoctors] = useState(mockPendingDoctors);
  const [approvedDoctors, setApprovedDoctors] = useState(mockApprovedDoctors);
  const [rejectedDoctors, setRejectedDoctors] = useState(mockRejectedDoctors);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search by name, email or phone..."
            className="pl-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
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
          {filteredPendingDoctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPendingDoctors.map(doctor => (
                <DoctorApprovalCard
                  key={doctor.id}
                  doctor={doctor}
                  onApprove={handleApproveDoctor}
                  onReject={handleRejectDoctor}
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No pending doctor approvals found.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="approved">
          {filteredApprovedDoctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApprovedDoctors.map(doctor => (
                <div key={doctor.id} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{doctor.name}</h3>
                      <p className="text-sm text-gray-500">{doctor.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Phone:</span> {doctor.phone}</p>
                    <p><span className="font-medium">GST Number:</span> {doctor.gstNumber}</p>
                    <p><span className="font-medium">Registered:</span> {doctor.registrationDate}</p>
                    <p className="text-green-600 font-medium">Approved</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No approved doctors found.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="rejected">
          {filteredRejectedDoctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRejectedDoctors.map(doctor => (
                <div key={doctor.id} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-100 p-2 rounded-full">
                      <Users className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{doctor.name}</h3>
                      <p className="text-sm text-gray-500">{doctor.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Phone:</span> {doctor.phone}</p>
                    <p><span className="font-medium">GST Number:</span> {doctor.gstNumber}</p>
                    <p><span className="font-medium">Registered:</span> {doctor.registrationDate}</p>
                    <p className="text-red-600 font-medium">Rejected</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No rejected doctors found.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorApprovals;
