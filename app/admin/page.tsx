import { Metadata } from "next";
import { DashboardHeader, StatCard } from "./components";

export const metadata: Metadata = {
  title: "Admin Dashboard | Zuri's Beauty Store",
  description: "Admin dashboard for Zuri's Beauty Store",
};

export default function AdminDashboardPage() {
  return (
    <div className="p-6">
      <DashboardHeader />
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
        <StatCard title="Total Orders" value="256" change="+12.5%" />
        <StatCard title="Total Sales" value="$12,543" change="+8.2%" />
        <StatCard title="Total Products" value="85" change="+5.1%" />
        <StatCard title="Total Customers" value="432" change="+15.3%" />
        <StatCard title="Average Order" value="$48.94" change="+3.7%" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Sales Overview</h2>
          {/* Chart component will go here */}
          <div className="h-72 bg-gray-100 rounded-md"></div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Statistics</h2>
          {/* Chart component will go here */}
          <div className="h-72 bg-gray-100 rounded-md"></div>
        </div>
      </div>
      

    </div>
  );
} 