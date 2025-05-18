
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Order } from "@/services/orderService";

const formSchema = z.object({
  trackingNumber: z.string().min(3, "Tracking number is required"),
  shippingCarrier: z.string().min(2, "Shipping carrier is required"),
  estimatedDeliveryDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      "Please enter a valid date"
    ),
});

export type ShippingInfo = z.infer<typeof formSchema>;

export interface UpdateShippingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order;
  onSubmit: (shippingInfo: ShippingInfo) => Promise<void>;
}

export default function UpdateShippingDialog({
  open,
  onOpenChange,
  order,
  onSubmit,
}: UpdateShippingDialogProps) {
  const form = useForm<ShippingInfo>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trackingNumber: order?.tracking_number || "",
      shippingCarrier: order?.shipping_carrier || "",
      estimatedDeliveryDate: order?.estimated_delivery_date
        ? new Date(order.estimated_delivery_date).toISOString().split("T")[0]
        : "",
    },
  });

  const handleSubmit = async (values: ShippingInfo) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Update Shipping Information
          </DialogTitle>
          <DialogDescription>
            Add or update tracking details for order #
            {order?.id.substring(0, 8) || ""}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="trackingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking Number</FormLabel>
                  <FormControl>
                    <Input placeholder="123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shippingCarrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Carrier</FormLabel>
                  <FormControl>
                    <Input placeholder="FedEx, DTDC, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedDeliveryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Delivery Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    When the order is expected to be delivered
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {order?.tracking_number ? "Update" : "Add"} Tracking
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
