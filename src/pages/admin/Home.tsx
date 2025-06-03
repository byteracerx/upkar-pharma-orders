
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Users,
  ShoppingCart,
  CreditCard,
  Pill
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RealtimeOrderTracker from "@/components/admin/RealtimeOrderTracker";

interface AdminStats {
  pendingDoctors: number;
  pendingOrders: number;
  totalProducts: number;
  totalCredit: number;
  recentOrders: Array<{
    id: string;
    doctor: string;
    amount: string;
    status: string;
  }>;
}

const AdminHome = () => {
  const [stats, setStats] = useState<AdminStats>({
    pendingDoctors: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalCredit: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
    
    // Set up real-time subscriptions
    const ordersChannel = supabase
      .channel('admin-orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchAdminStats()
      )
      .subscribe();
      
    const doctorsChannel = supabase
      .channel('admin-doctors-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'doctors' },
        () => fetchAdminStats()
      )
      .subscribe();
      
    const productsChannel = supabase
      .channel('admin-products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchAdminStats()
      )
      .subscribe();
      
    const creditsChannel = supabase
      .channel('admin-credits-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'credit_transactions' },
        () => fetchAdminStats()
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(doctorsChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(creditsChannel);
    };
  }, []);

  const fetchAdminStats = async () => {
    try {
      console.log('Fetching admin stats...');
      setLoading(true);
      
      // Get pending doctors count - doctors who are not approved and not rejected
      const { count: pendingDoctors, error: doctorsError } = await supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false)
        .is('rejection_reason', null);
        
      if (doctorsError) {
        console.error('Error fetching pending doctors:', doctorsError);
      } else {
        console.log('Pending doctors count:', pendingDoctors);
      }
      
      // Get pending orders count
      const { count: pendingOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
        
      if (ordersError) {
        console.error('Error fetching pending orders:', ordersError);
      } else {
        console.log('Pending orders count:', pendingOrders);
      }
      
      // Get total products count
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
        
      if (productsError) {
        console.error('Error fetching products:', productsError);
      } else {
        console.log('Total products count:', totalProducts);
      }
      
      // Get total outstanding credit
      let totalCredit = 0;
      try {
        const { data: creditData } = await supabase.rpc('get_all_doctor_credits');
        
        if (creditData && Array.isArray(creditData)) {
          totalCredit = creditData.reduce((sum, item) => sum + Number(item.total_credit), 0);
        }
        console.log('Total credit:', totalCredit);
      } catch (creditError) {
        console.error("Error fetching credits:", creditError);
        // Continue with totalCredit as 0
      }
      
      // Get recent orders
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from('orders')
        .select(`
          id, 
          total_amount,
          status,
          invoice_number,
          doctor:doctor_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(4);
        
      if (recentOrdersError) {
        console.error('Error fetching recent orders:', recentOrdersError);
      }
      
      const formattedRecentOrders = recentOrdersData?.map(order => ({
        id: order.invoice_number || `ORD-${order.id.substring(0, 4)}`,
        doctor: order.doctor?.name || "Unknown",
        amount: `₹${order.total_amount.toFixed(2)}`,
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1)
      })) || [];
      
      console.log('Final stats:', {
        pendingDoctors: pendingDoctors || 0,
        pendingOrders: pendingOrders || 0,
        totalProducts: totalProducts || 0,
        totalCredit: totalCredit,
        recentOrders: formattedRecentOrders
      });
      
      setStats({
        pendingDoctors: pendingDoctors || 0,
        pendingOrders: pendingOrders || 0,
        totalProducts: totalProducts || 0,
        totalCredit: totalCredit,
        recentOrders: formattedRecentOrders
      });
      
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const statsItems = [
    {
      title: "Pending Approvals",
      value: loading ? "..." : stats.pendingDoctors.toString(),
      description: "New doctor registrations",
      icon: <Users className="h-5 w-5 text-upkar-blue" />,
      link: "/admin/doctors"
    },
    {
      title: "New Orders",
      value: loading ? "..." : stats.pendingOrders.toString(),
      description: "Orders awaiting processing",
      icon: <ShoppingCart className="h-5 w-5 text-upkar-blue" />,
      link: "/admin/orders"
    },
    {
      title: "Total Products",
      value: loading ? "..." : stats.totalProducts.toString(),
      description: "In your catalog",
      icon: <Pill className="h-5 w-5 text-upkar-blue" />,
      link: "/admin/products"
    },
    {
      title: "Credit Balance",
      value: loading ? "..." : `₹${stats.totalCredit.toFixed(2)}`,
      description: "Outstanding credits",
      icon: <CreditCard className="h-5 w-5 text-upkar-blue" />,
      link: "/admin/credits"
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsItems.map((stat, index) => (
          <Link to={stat.link} key={index} className="block hover:no-underline">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className="bg-upkar-light-blue/10 p-2 rounded-full">
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${loading ? "animate-pulse" : ""}`}>
                  {stat.value}
                </div>
                <CardDescription>{stat.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Latest orders from the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="w-full h-32 flex items-center justify-center">
                  <div className="animate-pulse text-upkar-blue">Loading...</div>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500">
                      <th className="pb-2">Order ID</th>
                      <th className="pb-2">Doctor</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.length > 0 ? (
                      stats.recentOrders.map((order, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 text-sm">{order.id}</td>
                          <td className="py-3 text-sm">{order.doctor}</td>
                          <td className="py-3 text-sm">{order.amount}</td>
                          <td className="py-3">
                            <span
                              className={`inline-block text-xs px-2 py-1 rounded-full ${
                                order.status === "Delivered"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "Processing"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "Pending"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          No recent orders available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <RealtimeOrderTracker />
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
