'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../components/ui/badge";
import { format } from "date-fns";

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  reorder_point: number;
  last_restock_date: string;
}

type StatusMapType = {
  [K in InventoryItem['status']]: {
    label: string;
    color: string;
  };
};

const statusMap: StatusMapType = {
  in_stock: { label: "In Stock", color: "bg-green-500" },
  low_stock: { label: "Low Stock", color: "bg-yellow-500" },
  out_of_stock: { label: "Out of Stock", color: "bg-red-500" },
};

export const columns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: "name",
    header: "Product Name",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("name")}</div>
        <div className="sm:hidden text-sm text-muted-foreground">
          Stock: {row.getValue("quantity")} | Point: {row.getValue("reorder_point")}
        </div>
      </div>
    )
  },
  {
    accessorKey: "quantity",
    header: "Current Stock",
    meta: {
      className: "hidden sm:table-cell"
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as InventoryItem['status'];
      const { label, color } = statusMap[status];
      
      return (
        <Badge className={`${color} text-white`}>
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
];
