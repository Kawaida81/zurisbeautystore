'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import { History } from "lucide-react";
import type { InventoryItem, StockStatus } from "@/lib/types/inventory";

type StatusMapType = {
  [K in StockStatus]: {
    label: string;
    variant: "default" | "warning" | "destructive";
  };
};

const statusMap: StatusMapType = {
  in_stock: { label: "In Stock", variant: "default" },
  low_stock: { label: "Low Stock", variant: "warning" },
  out_of_stock: { label: "Out of Stock", variant: "destructive" },
};

export const columns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: "name",
    header: "Product Name",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("name")}</div>
        <div className="sm:hidden text-sm text-muted-foreground">
          Stock: {row.original.stock_quantity} | Point: {row.original.reorder_point}
        </div>
      </div>
    )
  },
  {
    accessorKey: "category_name",
    header: "Category",
    meta: {
      className: "hidden sm:table-cell"
    },
  },
  {
    accessorKey: "stock_quantity",
    header: "Current Stock",
    meta: {
      className: "hidden sm:table-cell"
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as StockStatus;
      const { label, variant } = statusMap[status];
      
      return (
        <Badge variant={variant}>
          {label}
        </Badge>
      );
    }
  },
  {
    accessorKey: "reorder_point",
    header: "Reorder Point",
    meta: {
      className: "hidden sm:table-cell"
    },
  },
  {
    accessorKey: "last_restock_date",
    header: "Last Restocked",
    meta: {
      className: "hidden sm:table-cell"
    },
    cell: ({ row }) => {
      const date = row.getValue("last_restock_date") as string;
      return date ? format(new Date(date), "MMM d, yyyy") : "N/A";
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Handle view history
          }}
        >
          <History className="h-4 w-4" />
        </Button>
      );
    },
  },
];
