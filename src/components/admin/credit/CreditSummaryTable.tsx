
import { useState } from "react";
import { CreditSummary } from "@/services/creditService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, CreditCard, History, Mail } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CreditSummaryTableProps {
  credits: CreditSummary[];
  sortOrder: 'asc' | 'desc';
  toggleSortOrder: () => void;
  onRecordPayment: (doctor: CreditSummary) => void;
  onViewHistory: (doctor: CreditSummary) => void;
  onSendSummary: (doctorId: string, doctorName: string) => void;
  sendingEmail: boolean;
}

const CreditSummaryTable = ({
  credits,
  sortOrder,
  toggleSortOrder,
  onRecordPayment,
  onViewHistory,
  onSendSummary,
  sendingEmail
}: CreditSummaryTableProps) => {
  return (
    <Table>
      <TableCaption>Click on a doctor to view detailed credit history</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Doctor Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead onClick={toggleSortOrder} className="cursor-pointer">
            <div className="flex items-center gap-1">
              Credit Balance
              <ChevronDown 
                className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} 
              />
            </div>
          </TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {credits.length > 0 ? (
          credits.map((doctor) => (
            <TableRow key={doctor.doctor_id}>
              <TableCell className="font-medium">{doctor.doctor_name}</TableCell>
              <TableCell>{doctor.doctor_phone}</TableCell>
              <TableCell>
                <Badge 
                  className={`${
                    doctor.total_credit > 10000
                      ? "bg-red-100 text-red-800"
                      : doctor.total_credit > 5000
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  ₹{doctor.total_credit.toLocaleString()}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onRecordPayment(doctor)}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Record Payment
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onViewHistory(doctor)}
                    >
                      <History className="mr-2 h-4 w-4" />
                      View Credit History
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onSendSummary(doctor.doctor_id, doctor.doctor_name)}
                      disabled={sendingEmail}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send Credit Summary
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
              No doctors with credit balances.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default CreditSummaryTable;
