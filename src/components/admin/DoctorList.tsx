
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
}

interface DoctorListProps {
  doctors: Doctor[];
  status: "pending" | "approved" | "rejected";
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const DoctorList = ({ doctors, status, onApprove, onReject }: DoctorListProps) => {
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
            doctor={doctor}
            onApprove={onApprove}
            onReject={onReject}
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
