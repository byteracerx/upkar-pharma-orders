
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ShoppingCart, DollarSign, Clock, TrendingUp } from "lucide-react";
import { RecentOrdersCard } from "@/components/admin/RecentOrdersCard";

interface DashboardStats {
  totalDoctors: number;
  pendingApprovals: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

const AdminHome = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalDoctors: 0,
    pendingApprovals: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch doctors count
      const { count: totalDoctors } = await supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true })
        .neq('gst_number', 'ADMIN00000000000');

      // Fetch pending approvals count
      const { count: pendingApprovals } = await supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false)
        .is('rejection_reason', null)
        .neq('gst_number', 'ADMIN00000000000');

      // Fetch orders count
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Fetch pending orders count
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch total revenue
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .in('status', ['delivered', 'processing']);

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Fetch monthly revenue (current month)
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: monthlyRevenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .in('status', ['delivered', 'processing'])
        .gte('created_at', firstDayOfMonth.toISOString());

      const monthlyRevenue = monthlyRevenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      setStats({
        totalDoctors: totalDoctors || 0,
        pendingApprovals: pendingApprovals || 0,
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalRevenue,
        monthlyRevenue,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your pharmacy business</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDoctors}</div>
            <p className="text-xs text-muted-foreground">
              Registered doctors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrdersCard />
        
        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <a 
                href="/admin/doctors" 
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">Review Doctor Applications</div>
                <div className="text-sm text-gray-600">
                  {stats.pendingApprovals} pending approvals
                </div>
              </a>
              
              <a 
                href="/admin/orders" 
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">Process Orders</div>
                <div className="text-sm text-gray-600">
                  {stats.pendingOrders} orders waiting
                </div>
              </a>
              
              <a 
                href="/admin/products" 
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">Manage Products</div>
                <div className="text-sm text-gray-600">
                  Add or update product catalog
                </div>
              </a>
              
              <a 
                href="/admin/credits" 
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">Credit Management</div>
                <div className="text-sm text-gray-600">
                  Review doctor credits and payments
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHome;
