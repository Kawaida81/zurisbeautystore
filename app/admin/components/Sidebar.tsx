'use client'

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { adminRoutes } from "../routes";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="h-full w-[250px] bg-white shadow-md flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Zuri's Beauty</h1>
        <p className="text-sm text-gray-600">Admin Dashboard</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {adminRoutes.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-2 py-3 text-gray-700 hover:bg-gray-100 rounded-md group"
              onClick={onClose}
            >
              <item.icon className="h-5 w-5 mr-3 text-gray-500 group-hover:text-indigo-600" />
              <span className="group-hover:text-indigo-600">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t">
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center px-2 py-3 text-gray-700 hover:bg-gray-100 rounded-md w-full"
        >
          <LogOut className="h-5 w-5 mr-3 text-gray-500" />
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
} 