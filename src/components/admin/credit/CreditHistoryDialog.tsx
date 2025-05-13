
import { useState } from "react";
import { CreditSummary, CreditTransaction } from "@/services/creditService";
import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreditHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: CreditSummary | null;
  transactions: CreditTransaction[];
  isLoading: boolean;
  sendingEmail: boolean;
  onSendSummary: (doctorId: string, doctorName: string) => void;
  onClose: () => void;
}

const CreditHistoryDialog = ({
  open,
  onOpenChange,
  doctor,
  transactions,
  isLoading,
  sendingEmail,
  onSendSummary,
  onClose,
}: CreditHistoryDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Credit History</DialogTitle>
          <DialogDescription>
            {doctor && (
              <div className="mt-2">
                <p><strong>Doctor:</strong> {doctor.doctor_name}</p>
                <p><strong>Current Balance:</strong> ₹{doctor.total_credit.toLocaleString()}</p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
          </div>
        ) : (
          <div className="py-4">
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">All Transactions</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                {transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <Badge
                              className={transaction.type === 'credit' 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"}
                            >
                              {transaction.type === 'credit' ? 'Payment' : 'Purchase'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={transaction.type === 'credit' ? "text-green-600" : "text-red-600"}>
                              {transaction.type === 'credit' ? '-' : '+'} ₹{transaction.amount.toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No transaction history found.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="summary" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Total Orders */}
                      <div className="flex justify-between items-center pb-4 border-b">
                        <span className="font-medium">Total Orders</span>
                        <span>
                          {transactions.filter(t => t.type === 'debit').length}
                        </span>
                      </div>
                      
                      {/* Total Purchases */}
                      <div className="flex justify-between items-center pb-4 border-b">
                        <span className="font-medium">Total Purchases</span>
                        <span className="text-red-600">
                          ₹{transactions
                            .filter(t => t.type === 'debit')
                            .reduce((sum, t) => sum + t.amount, 0)
                            .toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Total Payments */}
                      <div className="flex justify-between items-center pb-4 border-b">
                        <span className="font-medium">Total Payments</span>
                        <span className="text-green-600">
                          ₹{transactions
                            .filter(t => t.type === 'credit')
                            .reduce((sum, t) => sum + t.amount, 0)
                            .toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Current Balance */}
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-bold">Current Balance</span>
                        <span className="font-bold text-upkar-blue">
                          ₹{doctor?.total_credit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <DialogFooter>
          <Button
            onClick={() => {
              if (doctor) {
                onSendSummary(doctor.doctor_id, doctor.doctor_name);
              }
            }}
            variant="outline"
            className="mr-auto"
            disabled={sendingEmail}
          >
            {sendingEmail ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Email Summary
              </>
            )}
          </Button>
          
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreditHistoryDialog;
