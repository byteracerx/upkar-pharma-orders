
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
  Pill,
  UserCheck,
  UserX,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminStats {
  totalDoctors: number;
  pendingDoctors: number;
  approvedDoctors: number;
  rejectedDoctors: number;
  totalProducts: number;
  totalOrders: number;
  totalCredits: number;
  recentOrders: Array<{
    id: string;
    doctor: string;
    amount: string;
    status: string;
  }>;
}

const AdminHome = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalDoctors: 0,
    pendingDoctors: 0,
    approvedDoctors: 0,
    rejectedDoctors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalCredits: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      console.log('Fetching admin stats...');
      setLoading(true);
      
      // Get all doctors (excluding admins)
      const { data: allDoctors, error: allDoctorsError } = await supabase
        .from('doctors')
        .select('*')
        .neq('gst_number', 'ADMIN00000000000');
        
      if (allDoctorsError) {
        console.error('Error fetching all doctors:', allDoctorsError);
      }
      
      // Get pending doctors count - doctors who are not approved and not rejected
      const { data: pendingDoctors, error: pendingError } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_approved', false)
        .is('rejection_reason', null)
        .neq('gst_number', 'ADMIN00000000000');
        
      if (pendingError) {
        console.error('Error fetching pending doctors:', pendingError);
      }
      
      // Get approved doctors
      const { data: approvedDoctors, error: approvedError } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_approved', true)
        .neq('gst_number', 'ADMIN00000000000');
        
      if (approvedError) {
        console.error('Error fetching approved doctors:', approvedError);
      }
      
      // Get rejected doctors
      const { data: rejectedDoctors, error: rejectedError } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_approved', false)
        .not('rejection_reason', 'is', null)
        .neq('gst_number', 'ADMIN00000000000');
        
      if (rejectedError) {
        console.error('Error fetching rejected doctors:', rejectedError);
      }
      
      // Get total products count
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id');
        
      if (productsError) {
        console.error('Error fetching products:', productsError);
      }
      
      // Get total orders count
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount');
        
      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      }
      
      // Get total outstanding credit for non-admin doctors
      let totalCredit = 0;
      if (approvedDoctors && approvedDoctors.length > 0) {
        const doctorIds = approvedDoctors.map(d => d.id);
        const { data: creditData, error: creditError } = await supabase
          .from('credit_transactions')
          .select('amount, type')
          .in('doctor_id', doctorIds);
          
        if (!creditError && creditData) {
          totalCredit = creditData.reduce((sum, transaction) => {
            return transaction.type === 'credit' 
              ? sum + transaction.amount 
              : sum - transaction.amount;
          }, 0);
        }
      }
      
      // Get recent orders with doctor names
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
        totalDoctors: allDoctors?.length || 0,
        pendingDoctors: pendingDoctors?.length || 0,
        approvedDoctors: approvedDoctors?.length || 0,
        rejectedDoctors: rejectedDoctors?.length || 0,
        totalProducts: products?.length || 0,
        totalOrders: orders?.length || 0,
        totalCredits: totalCredit,
        recentOrders: formattedRecentOrders
      });
      
      setStats({
        totalDoctors: allDoctors?.length || 0,
        pendingDoctors: pendingDoctors?.length || 0,
        approvedDoctors: approvedDoctors?.length || 0,
        rejectedDoctors: rejectedDoctors?.length || 0,
        totalProducts: products?.length || 0,
        totalOrders: orders?.length || 0,
        totalCredits: totalCredit,
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
      title: "Total Doctors",
      value: loading ? "..." : stats.totalDoctors.toString(),
      description: "All registered doctors",
      icon: <Users className="h-5 w-5 text-upkar-blue" />,
      link: "/admin/doctors"
    },
    {
      title: "Pending Approvals",
      value: loading ? "..." : stats.pendingDoctors.toString(),
      description: "New doctor registrations",
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      link: "/admin/doctors"
    },
    {
      title: "Approved Doctors",
      value: loading ? "..." : stats.approvedDoctors.toString(),
      description: "Active doctors",
      icon: <UserCheck className="h-5 w-5 text-green-500" />,
      link: "/admin/doctors"
    },
    {
      title: "Rejected Applications",
      value: loading ? "..." : stats.rejectedDoctors.toString(),
      description: "Rejected applications",
      icon: <UserX className="h-5 w-5 text-red-500" />,
      link: "/admin/doctors"
    },
    {
      title: "Total Products",
      value: loading ? "..." : stats.totalProducts.toString(),
      description: "In your catalog",
      icon: <Pill className="h-5 w-5 text-upkar-blue" />,
      link: "/admin/products"
    },
    {
      title: "Total Orders",
      value: loading ? "..." : stats.totalOrders.toString(),
      description: "Orders processed",
      icon: <ShoppingCart className="h-5 w-5 text-upkar-blue" />,
      link: "/admin/orders"
    },
    {
      title: "Credit Balance",
      value: loading ? "..." : `₹${stats.totalCredits.toFixed(2)}`,
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

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
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
    </div>
  );
};

export default AdminHome;
