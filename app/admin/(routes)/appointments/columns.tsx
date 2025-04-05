'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

export interface Appointment {
  id: string;
  customer: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
  };
  worker: {
    id: string;
    name: string;
  };
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
}

interface ColumnActions {
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointment: Appointment) => void;
}

export const createColumns = ({ onEdit, onDelete }: ColumnActions): ColumnDef<Appointment>[] => [
  {
    accessorKey: "customer.name",
    header: "Customer",
  },
  {
    accessorKey: "service.name",
    header: "Service",
  },
  {
    accessorKey: "worker.name",
    header: "Worker",
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: "time",
    header: "Time",
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => {
      const duration = row.getValue("duration") as number;
      return `${duration} min`;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
        'scheduled': 'default',
        'in-progress': 'secondary',
        'completed': 'default',
        'cancelled': 'destructive'
      };
      return (
        <Badge variant={variants[status] || 'default'}>
          {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const appointment = row.original;
      
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit?.(appointment)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete?.(appointment)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
