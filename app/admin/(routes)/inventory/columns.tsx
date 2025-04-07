'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { History } from "lucide-react";
import type { InventoryItem, StockStatus } from "@/lib/types/inventory";

type StatusMapType = {
  [K in StockStatus]: {
    label: string;
    variant: "default" | "secondary" | "destructive";
  };
};

const statusMap: StatusMapType = {
  in_stock: { label: "In Stock", variant: "default" },
  low_stock: { label: "Low Stock", variant: "secondary" },
  out_of_stock: { label: "Out of Stock", variant: "destructive" },
};

export const columns: ColumnDef<InventoryItem>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Product Name",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("name")}</div>
        <div className="sm:hidden text-sm text-muted-foreground">
          Stock: {row.original.stock_quantity} | Point: {row.original.reorder_point || 'N/A'}
          <Badge
            variant={
              row.original.status === "out_of_stock"
                ? "destructive"
                : row.original.status === "low_stock"
                ? "secondary"
                : "default"
            }
            className="ml-2"
          >
            {statusMap[row.original.status as StockStatus].label}
          </Badge>
        </div>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "category_name",
    header: "Category",
    meta: {
      className: "hidden sm:table-cell"
    },
    enableSorting: true,
  },
  {
    accessorKey: "stock_quantity",
    header: "Stock",
    cell: ({ row }) => {
      const quantity = row.original.stock_quantity;
      const reorderPoint = row.original.reorder_point;
      return (
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span>{quantity}</span>
            {reorderPoint && (
              <span className="text-xs text-muted-foreground">
                Reorder at: {reorderPoint}
              </span>
            )}
          </div>
          <Badge
            variant={
              row.original.status === "out_of_stock"
                ? "destructive"
                : row.original.status === "low_stock"
                ? "secondary"
                : "default"
            }
            className="hidden sm:inline-flex"
          >
            {statusMap[row.original.status as StockStatus].label}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "reorder_point",
    header: "Reorder Point",
    meta: {
      className: "hidden sm:table-cell"
    },
    enableSorting: true,
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
    },
    enableSorting: true,
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
          title="View History"
        >
          <History className="h-4 w-4" />
        </Button>
      );
    },
    enableSorting: false,
  },
];
