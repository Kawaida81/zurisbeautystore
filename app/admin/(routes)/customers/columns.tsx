'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
  total_orders: number;
  total_spent: number;
}

interface ColumnActions {
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

export const createColumns = ({ onEdit, onDelete }: ColumnActions): ColumnDef<Customer>[] => [
  {
    accessorKey: "first_name",
    header: "Name",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.getValue("first_name")} {row.original.last_name}
        </div>
        <div className="sm:hidden text-sm text-muted-foreground">
          {row.original.phone} | {row.getValue("email")}
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
    accessorKey: "phone",
    header: "Phone",
    meta: {
      className: "hidden sm:table-cell"
    }
  },
  {
    accessorKey: "address",
    header: "Address",
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
    accessorKey: "total_orders",
    header: "Total Orders",
    meta: {
      className: "hidden sm:table-cell"
    }
  },
  {
    accessorKey: "total_spent",
    header: "Total Spent",
    meta: {
      className: "hidden sm:table-cell"
    },
    cell: ({ row }) => {
      const amount = row.getValue("total_spent") as number;
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
      }).format(amount);
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
