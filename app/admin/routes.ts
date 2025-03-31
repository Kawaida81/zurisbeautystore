import { 
  Home, 
  ShoppingBag, 
  Users, 
  Package, 
  Settings, 
  BarChart, 
  MessageSquare
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface AdminRoute {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const adminRoutes: AdminRoute[] = [
  { name: "Dashboard", icon: Home, href: "/admin" },
  { name: "Orders", icon: ShoppingBag, href: "/admin/orders" },
  { name: "Products", icon: Package, href: "/admin/products" },
  { name: "Customers", icon: Users, href: "/admin/customers" },
  { name: "Analytics", icon: BarChart, href: "/admin/analytics" },
  { name: "Messages", icon: MessageSquare, href: "/admin/messages" },
  { name: "Settings", icon: Settings, href: "/admin/settings" },
]; 