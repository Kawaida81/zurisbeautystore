'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  created_at: string;
  loyalty_points: number;
  appointments: {
    count: number;
  } | null;
  total_spent: {
    sum: number;
  } | null;
}

interface ColumnActions {
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

export const createColumns = ({ onEdit, onDelete }: ColumnActions): ColumnDef<Customer>[] => [
  {
    accessorKey: "full_name",
    header: "Name",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("full_name")}</div>
        <div className="sm:hidden text-sm text-muted-foreground">
          {row.getValue("phone_number")} | {row.getValue("email")}
        </div>
      </div>
    )
  },
  {
    accessorKey: "email",
    header: "Email",
    meta: {
      className: "hidden sm:table-cell"
    }
  },
  {
    accessorKey: "phone_number",
    header: "Phone",
    meta: {
      className: "hidden sm:table-cell"
    }
  },
  {
    accessorKey: "created_at",
    header: "Joined",
    meta: {
      className: "hidden sm:table-cell"
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: "appointments.count",
    header: "Total Appointments",
    meta: {
      className: "hidden sm:table-cell"
    },
    cell: ({ row }) => {
      const appointments = row.original.appointments;
      return appointments?.count || 0;
    },
  },
  {
    accessorKey: "total_spent.sum",
    header: "Total Spent",
    meta: {
      className: "hidden sm:table-cell"
    },
    cell: ({ row }) => {
      const totalSpent = row.original.total_spent;
      return totalSpent ? `$${totalSpent.sum.toFixed(2)}` : '$0.00';
    },
  },
  {
    accessorKey: "loyalty_points",
    header: "Loyalty Points",
    cell: ({ row }) => {
      const points = row.getValue("loyalty_points") as number;
      const level = points >= 1000 ? 'Gold' : points >= 500 ? 'Silver' : 'Bronze';
      const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
        'Gold': 'secondary',
        'Silver': 'outline',
        'Bronze': 'default'
      };
      return (
        <div className="flex items-center gap-2">
          <Badge variant={variants[level]}>
            {level}
          </Badge>
          <span>{points} pts</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original;
      
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit?.(customer)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete?.(customer)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
