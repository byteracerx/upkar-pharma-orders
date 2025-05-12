
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
  FileText,
  Pill
} from "lucide-react";
import { Link } from "react-router-dom";

const AdminHome = () => {
  const stats = [
    {
      title: "Pending Approvals",
      value: "8",
      description: "New doctor registrations",
      icon: <Users className="h-5 w-5 text-upkar-blue" />,
      link: "/admin/doctors"
    },
    {
      title: "New Orders",
      value: "12",
      description: "Orders awaiting processing",
      icon: <ShoppingCart className="h-5 w-5 text-upkar-blue" />,
      link: "/admin/orders"
    },
    {
      title: "Total Products",
      value: "245",
      description: "In your catalog",
      icon: <Pill className="h-5 w-5 text-upkar-blue" />,
      link: "/admin/products"
    },
    {
      title: "Credit Balance",
      value: "₹45,250",
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
        {stats.map((stat, index) => (
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
                <div className="text-2xl font-bold">{stat.value}</div>
                <CardDescription>{stat.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest orders from the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                {[
                  {
                    id: "ORD-5672",
                    doctor: "Dr. Sharma",
                    amount: "₹1,250",
                    status: "Pending",
                  },
                  {
                    id: "ORD-5671",
                    doctor: "Dr. Patel",
                    amount: "₹3,480",
                    status: "Processing",
                  },
                  {
                    id: "ORD-5670",
                    doctor: "Dr. Kumar",
                    amount: "₹2,150",
                    status: "Completed",
                  },
                  {
                    id: "ORD-5669",
                    doctor: "Dr. Singh",
                    amount: "₹980",
                    status: "Completed",
                  },
                ].map((order, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3 text-sm">{order.id}</td>
                    <td className="py-3 text-sm">{order.doctor}</td>
                    <td className="py-3 text-sm">{order.amount}</td>
                    <td className="py-3">
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded-full ${
                          order.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>
              Latest invoices generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-2">Invoice</th>
                  <th className="pb-2">Doctor</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    id: "INV-2022",
                    doctor: "Dr. Sharma",
                    amount: "₹1,250",
                    status: "Paid",
                  },
                  {
                    id: "INV-2021",
                    doctor: "Dr. Patel",
                    amount: "₹3,480",
                    status: "Unpaid",
                  },
                  {
                    id: "INV-2020",
                    doctor: "Dr. Kumar",
                    amount: "₹2,150",
                    status: "Paid",
                  },
                  {
                    id: "INV-2019",
                    doctor: "Dr. Singh",
                    amount: "₹980",
                    status: "Paid",
                  },
                ].map((invoice, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3 text-sm">{invoice.id}</td>
                    <td className="py-3 text-sm">{invoice.doctor}</td>
                    <td className="py-3 text-sm">{invoice.amount}</td>
                    <td className="py-3">
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded-full ${
                          invoice.status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHome;
