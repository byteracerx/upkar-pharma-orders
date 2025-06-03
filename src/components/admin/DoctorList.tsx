
import { useState } from "react";
import DoctorApprovalCard from "@/components/admin/DoctorApprovalCard";
import { Users } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  gstNumber: string;
  registrationDate: string;
  status: "pending" | "approved" | "rejected";
  clinic_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  license_number?: string;
  specialization?: string;
}

interface DoctorListProps {
  doctors: Doctor[];
  status: "pending" | "approved" | "rejected";
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason?: string) => void;
}

const DoctorList = ({ doctors, status, onApprove, onReject }: DoctorListProps) => {
  const [processingDoctorId, setProcessingDoctorId] = useState<string | null>(null);

  const handleApprove = async (doctorId: string) => {
    setProcessingDoctorId(doctorId);
    try {
      await onApprove?.(doctorId);
    } finally {
      setProcessingDoctorId(null);
    }
  };

  const handleReject = async (doctorId: string, reason?: string) => {
    setProcessingDoctorId(doctorId);
    try {
      await onReject?.(doctorId, reason);
    } finally {
      setProcessingDoctorId(null);
    }
  };

  if (doctors.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow">
        <p className="text-gray-500">No {status} doctor {status === "pending" ? "approvals" : "doctors"} found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {status === "pending" ? (
        doctors.map((doctor) => (
          <DoctorApprovalCard
            key={doctor.id}
            doctor={{
              id: doctor.id,
              name: doctor.name,
              email: doctor.email,
              phone: doctor.phone,
              gstNumber: doctor.gstNumber,
              registrationDate: doctor.registrationDate,
              address: doctor.address,
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
        ))
      ) : (
        doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`${status === "approved" ? "bg-green-100" : "bg-red-100"} p-2 rounded-full`}>
                <Users className={`h-5 w-5 ${status === "approved" ? "text-green-600" : "text-red-600"}`} />
              </div>
              <div>
                <h3 className="font-semibold">{doctor.name}</h3>
                <p className="text-sm text-gray-500">{doctor.email}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Phone:</span> {doctor.phone}</p>
              <p><span className="font-medium">GST Number:</span> {doctor.gstNumber}</p>
              {doctor.clinic_name && (
                <p><span className="font-medium">Clinic:</span> {doctor.clinic_name}</p>
              )}
              <p><span className="font-medium">Registered:</span> {doctor.registrationDate}</p>
              <p className={`font-medium ${status === "approved" ? "text-green-600" : "text-red-600"}`}>
                {status === "approved" ? "Approved" : "Rejected"}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default DoctorList;
