
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { processReturn, OrderItem } from "@/services/orderService";
import { toast } from "sonner";

interface InitiateReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  doctorId: string;
  orderItems: OrderItem[];
  onReturnComplete?: () => void;
}

const schema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  items: z.array(z.string()).min(1, "Select at least one item to return"),
});

type FormValues = z.infer<typeof schema>;

const InitiateReturnDialog = ({
  open,
  onOpenChange,
  orderId,
  doctorId,
  orderItems,
  onReturnComplete,
}: InitiateReturnDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reason: "",
      items: [],
    },
  });
  
  // Handle item selection
  const handleItemSelect = (checked: boolean, itemId: string) => {
    if (checked) {
      const item = orderItems.find(i => i.id === itemId);
      if (item) {
        setSelectedItems([...selectedItems, item]);
      }
    } else {
      setSelectedItems(selectedItems.filter(i => i.id !== itemId));
    }
    
    // Update form values
    const currentItems = form.getValues().items;
    form.setValue(
      "items",
      checked 
        ? [...currentItems, itemId]
        : currentItems.filter(i => i !== itemId)
    );
  };
  
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Map selected items to the format required by the API
      const itemsForReturn = selectedItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        reason: "Return requested by customer"
      }));
      
      const success = await processReturn(
        orderId,
        doctorId,
        data.reason,
        itemsForReturn
      );
      
      if (success) {
        toast.success("Return Request Initiated", {
          description: "Your return request has been submitted successfully"
        });
        
        onOpenChange(false);
        if (onReturnComplete) onReturnComplete();
      }
    } catch (error: any) {
      console.error("Error initiating return:", error);
      toast.error("Failed to Initiate Return", {
        description: error.message || "Please try again later"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Initiate Return Request</DialogTitle>
          <DialogDescription>
            Select items you wish to return and provide a reason
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Return</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please explain why you're returning these items..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed explanation for your return request
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="items"
                render={() => (
                  <FormItem>
                    <FormLabel>Select Items to Return</FormLabel>
                    <div className="border rounded-md p-4 space-y-3">
                      {orderItems.map((item) => (
                        <div key={item.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={`item-${item.id}`}
                            onCheckedChange={(checked) => 
                              handleItemSelect(checked === true, item.id)
                            }
                          />
                          <div className="space-y-1">
                            <label
                              htmlFor={`item-${item.id}`}
                              className="font-medium text-sm cursor-pointer"
                            >
                              {item.product?.name || "Unknown Product"}
                            </label>
                            <p className="text-xs text-gray-500">
                              Quantity: {item.quantity} | Price: ₹{item.price_per_unit.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Return Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InitiateReturnDialog;
