import { useState, useEffect } from "react";
import { fetchOrderDetails, OrderItem } from "@/services/orderService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InitiateReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onSubmit: (orderId: string, reason: string, items: any[]) => void;
}

const InitiateReturnDialog = ({
  open,
  onOpenChange,
  orderId,
  onSubmit
}: InitiateReturnDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  
  // Fetch order items when dialog opens
  useEffect(() => {
    if (open && orderId) {
      fetchOrderItems();
    }
  }, [open, orderId]);
  
  const fetchOrderItems = async () => {
    setLoading(true);
    try {
      const details = await fetchOrderDetails(orderId);
      setOrderItems(details.items);
      
      // Initialize selected items and quantities
      const initialSelected: Record<string, boolean> = {};
      const initialQuantities: Record<string, number> = {};
      
      details.items.forEach(item => {
        initialSelected[item.id] = false;
        initialQuantities[item.id] = item.quantity;
      });
      
      setSelectedItems(initialSelected);
      setQuantities(initialQuantities);
    } catch (error: any) {
      console.error("Error fetching order items:", error);
      toast.error("Failed to load order items", {
        description: error.message || "Please try again."
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectItem = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };
  
  const handleQuantityChange = (itemId: string, value: string) => {
    const item = orderItems.find(item => item.id === itemId);
    if (!item) return;
    
    const quantity = parseInt(value);
    if (isNaN(quantity) || quantity < 1) return;
    
    // Don't allow more than the original quantity
    const maxQuantity = item.quantity;
    const validQuantity = Math.min(quantity, maxQuantity);
    
    setQuantities(prev => ({
      ...prev,
      [itemId]: validQuantity
    }));
  };
  
  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the return");
      return;
    }
    
    const selectedItemIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
    if (selectedItemIds.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }
    
    setSubmitting(true);
    
    // Prepare return items
    const returnItems = selectedItemIds.map(itemId => {
      const item = orderItems.find(item => item.id === itemId);
      if (!item) return null;
      
      const quantity = quantities[itemId];
      const price_per_unit = item.price_per_unit;
      const total_price = price_per_unit * quantity;
      
      return {
        product_id: item.product_id,
        quantity,
        price_per_unit,
        total_price,
        reason: "Item return"
      };
    }).filter(Boolean);
    
    onSubmit(orderId, reason, returnItems);
    setSubmitting(false);
  };
  
  // Calculate total return amount
  const calculateTotalReturn = () => {
    return Object.keys(selectedItems)
      .filter(id => selectedItems[id])
      .reduce((total, itemId) => {
        const item = orderItems.find(item => item.id === itemId);
        if (!item) return total;
        
        const quantity = quantities[itemId];
        return total + (item.price_per_unit * quantity);
      }, 0);
  };
  
  const totalReturnAmount = calculateTotalReturn();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Return Items</DialogTitle>
          <DialogDescription>
            Select the items you want to return and provide a reason
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="return-reason">Reason for Return</Label>
                <Textarea
                  id="return-reason"
                  placeholder="Please explain why you're returning these items"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Select Items to Return</Label>
                <div className="rounded-md border mt-1">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Select</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedItems[item.id] || false}
                              onCheckedChange={(checked) => 
                                handleSelectItem(item.id, checked === true)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.product?.name || 'Unknown Product'}
                          </TableCell>
                          <TableCell>{formatCurrency(item.price_per_unit)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              max={item.quantity}
                              value={quantities[item.id] || 1}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              disabled={!selectedItems[item.id]}
                              className="w-20"
                            />
                            <span className="text-xs text-gray-500 ml-2">
                              (Max: {item.quantity})
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {selectedItems[item.id]
                              ? formatCurrency(item.price_per_unit * (quantities[item.id] || 0))
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="font-medium">Total Return Amount:</span>
                <span className="font-bold text-lg">
                  {formatCurrency(totalReturnAmount)}
                </span>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  submitting || 
                  !reason.trim() || 
                  Object.keys(selectedItems).filter(id => selectedItems[id]).length === 0
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit Return Request"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InitiateReturnDialog;