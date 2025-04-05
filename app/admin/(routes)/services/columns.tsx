'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/app/admin/components/ui/badge";
import { Button } from "@/app/admin/components/ui/button";
import { Edit, Trash } from "lucide-react";

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description: string;
  is_active: boolean;
}

interface ColumnActions {
  onEdit?: (service: ServiceItem) => void;
  onDelete?: (service: ServiceItem) => void;
}

export const createColumns = ({ onEdit, onDelete }: ColumnActions): ColumnDef<ServiceItem>[] => [
  {
    accessorKey: "name",
    header: "Service Name",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("name")}</div>
        <div className="sm:hidden text-sm text-muted-foreground">
          {row.getValue("category")} | {row.getValue("duration")}mins | KES {row.getValue("price")}
        </div>
      </div>
    )
  },
  {
    accessorKey: "category",
    header: "Category",
    meta: {
      className: "hidden sm:table-cell",
    },
    cell: ({ row }) => {
      const category = row.getValue("category") as string;
      return (
        <Badge className="bg-slate-500 text-white">
          {category}
        </Badge>
      );
    }
  },
  {
    accessorKey: "duration",
    header: "Duration (mins)",
    meta: {
      className: "hidden sm:table-cell",
    },
    cell: ({ row }) => {
      const duration = row.getValue("duration") as number;
      return `${duration} mins`;
    }
  },
  {
    accessorKey: "price",
    header: "Price (KES)",
    meta: {
      className: "hidden sm:table-cell",
    },
    cell: ({ row }) => {
      const price = row.getValue("price") as number;
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
      }).format(price);
    }
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean;
      return (
        <Badge className={`${isActive ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      );
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const service = row.original;
      
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit?.(service)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete?.(service)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    }
  }
];
