'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/app/admin/components/ui/badge";
import { Button } from "@/app/admin/components/ui/button";
import { Edit, Trash } from "lucide-react";

export interface Worker {
  id: string;
  name: string;
  role: 'stylist' | 'assistant' | 'manager';
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  certifications: string[];
  start_date: string;
}

interface ColumnActions {
  onEdit?: (worker: Worker) => void;
  onDelete?: (worker: Worker) => void;
}

export const createColumns = ({ onEdit, onDelete }: ColumnActions): ColumnDef<Worker>[] => [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <Badge variant="outline">
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "start_date",
    header: "Start Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("start_date"));
      return date.toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const worker = row.original;
      
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit?.(worker)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete?.(worker)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
