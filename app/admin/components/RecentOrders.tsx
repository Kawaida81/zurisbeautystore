import { CheckCircle, Clock, XCircle } from "lucide-react";

export default function RecentOrders() {
  const orders = [
    { id: "#ORD-7352", customer: "Emma Johnson", date: "24 Mar 2024", amount: "$156.00", status: "Completed" },
    { id: "#ORD-7351", customer: "Michael Smith", date: "23 Mar 2024", amount: "$98.50", status: "Processing" },
    { id: "#ORD-7350", customer: "Sophia Williams", date: "23 Mar 2024", amount: "$124.00", status: "Completed" },
    { id: "#ORD-7349", customer: "James Brown", date: "22 Mar 2024", amount: "$89.99", status: "Cancelled" },
  ];

  // Function to determine which status icon to display
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "Processing":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "Cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  // Function to determine text color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-green-500";
      case "Processing":
        return "text-yellow-500";
      case "Cancelled":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Orders</h2>
        <button className="text-indigo-600 text-sm font-medium">View All</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="pb-3 text-left font-medium text-gray-500">Order ID</th>
              <th className="pb-3 text-left font-medium text-gray-500">Customer</th>
              <th className="pb-3 text-left font-medium text-gray-500">Date</th>
              <th className="pb-3 text-right font-medium text-gray-500">Amount</th>
              <th className="pb-3 text-right font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="py-3 font-medium">{order.id}</td>
                <td className="py-3">{order.customer}</td>
                <td className="py-3 text-gray-500">{order.date}</td>
                <td className="py-3 text-right font-medium">{order.amount}</td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end">
                    {getStatusIcon(order.status)}
                    <span className={`ml-1 ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 