import { 
  Home, 
  Users, 
  Package, 
  Settings, 
  MessageSquare,
  Calendar,
  Briefcase,
  Box,
  Tag,
  DollarSign
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface AdminRoute {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const adminRoutes: AdminRoute[] = [
  { name: "Dashboard", icon: Home, href: "/admin" },
  { name: "Products", icon: Package, href: "/admin/products" },
  { name: "Inventory", icon: Box, href: "/admin/inventory" },
  { name: "Services", icon: Tag, href: "/admin/services" },
  { name: "Appointments", icon: Calendar, href: "/admin/appointments" },
  { name: "Workers", icon: Briefcase, href: "/admin/workers" },
  { name: "Customers", icon: Users, href: "/admin/customers" },
  { name: "Client Engagement", icon: MessageSquare, href: "/admin/client-engagement" },
  { name: "Profit", icon: DollarSign, href: "/admin/profit" },
  { name: "Settings", icon: Settings, href: "/admin/settings" },
];