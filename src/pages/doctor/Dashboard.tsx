
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  CreditCard,
  FileText,
} from "lucide-react";

const DoctorDashboard = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  const recentOrders = [
    {
      id: "ORD-1234",
      date: "2023-05-15",
      items: 5,
      total: "₹2,500",
      status: "Delivered"
    },
    {
      id: "ORD-1233",
      date: "2023-05-10",
      items: 3,
      total: "₹1,200",
      status: "Processing"
    },
    {
      id: "ORD-1232",
      date: "2023-05-05",
      items: 7,
      total: "₹3,450",
      status: "Delivered"
    }
  ];

  const creditHistory = [
    {
      id: "CR-678",
      date: "2023-05-01",
      description: "Payment received",
      amount: "₹5,000",
      type: "credit"
    },
    {
      id: "CR-677",
      date: "2023-04-28",
      description: "Order ORD-1230",
      amount: "₹1,800",
      type: "debit"
    },
    {
      id: "CR-676",
      date: "2023-04-25",
      description: "Order ORD-1229",
      amount: "₹2,100",
      type: "debit"
    }
  ];

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
            <p className="text-gray-600">Manage your orders and account details</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
            <Button asChild>
              <Link to="/cart">View Cart</Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Orders
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">
                Currently being processed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Credit Balance
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹12,560</div>
              <p className="text-xs text-muted-foreground">
                Outstanding balance
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Lifetime orders placed
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="credit">Credit History</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  View and track your recent orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-3">Order ID</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Items</th>
                        <th className="pb-3">Total</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-3">{order.id}</td>
                          <td className="py-3">{order.date}</td>
                          <td className="py-3">{order.items}</td>
                          <td className="py-3">{order.total}</td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                order.status === "Delivered"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {order.status === "Delivered" ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <Truck className="h-3 w-3 mr-1" />
                              )}
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="credit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Credit History</CardTitle>
                <CardDescription>
                  Track your credits and payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-3">ID</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Description</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditHistory.map((item, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-3">{item.id}</td>
                          <td className="py-3">{item.date}</td>
                          <td className="py-3">{item.description}</td>
                          <td className="py-3">
                            <span
                              className={
                                item.type === "credit"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {item.type === "credit" ? "+" : "-"} {item.amount}
                            </span>
                          </td>
                          <td className="py-3">
                            {item.type === "debit" && (
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4 mr-1" />
                                Invoice
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default DoctorDashboard;
