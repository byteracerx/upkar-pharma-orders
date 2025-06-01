
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ChevronLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import OrderDetailsView from "@/components/orders/OrderDetailsView";
import { getOrderDetails } from "@/services/order";

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id || !user?.id) return;
      
      try {
        setIsLoading(true);
        const details = await getOrderDetails(id);
        
        // Verify this order belongs to the logged in doctor
        if (details.order.doctor_id !== user.id) {
          toast.error("Unauthorized", {
            description: "You don't have permission to view this order"
          });
          navigate("/orders");
          return;
        }
        
        setOrderDetails(details);
      } catch (error: any) {
        console.error("Error fetching order details:", error);
        toast.error("Failed to load order details", {
          description: error.message || "Please try again later"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [id, user?.id, navigate]);
  
  const handleDownloadInvoice = () => {
    // This would be implemented with actual invoice generation logic
    toast.info("Invoice Download", {
      description: "This would download the invoice in a real app."
    });
  };

  return (
    <div className="container-custom py-8">
      <Button variant="ghost" onClick={() => navigate("/orders")} className="mb-6 flex items-center text-gray-600 hover:text-upkar-blue">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Orders
      </Button>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Order Details</h1>
        
        {orderDetails && (
          <Button onClick={handleDownloadInvoice} className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
        </div>
      ) : orderDetails ? (
        <OrderDetailsView 
          orderDetails={orderDetails}
        />
      ) : (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Order not found or you don't have permission to view it.</p>
        </Card>
      )}
    </div>
  );
};

export default OrderDetails;
