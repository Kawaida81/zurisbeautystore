'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/admin/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export interface Appointment {
  id: string;
  date: string;
  appointment_date: string;
  duration: number;
  client_id: string | null;
  created_at: string | null;
  notes: string | null;
  service: string;
  service_id: string | null;
  service_name: string | null;
  status: string;
  worker_id: string | null;
  customer?: any;
  worker?: any;
  time?: string;
}

interface AppointmentColumnsProps {
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
}

export function createColumns({ onEdit, onDelete }: AppointmentColumnsProps): ColumnDef<Appointment>[] {
  return [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("date") as string;
        return format(new Date(date), "PPP");
      }
    },
    {
      accessorKey: "time",
      header: "Time",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date") as string);
        return format(date, "p");
      }
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => row.original.customer?.name || "N/A"
    },
    {
      accessorKey: "service",
      header: "Service",
      cell: ({ row }) => {
        const service = row.getValue("service");
        return typeof service === 'object' && service !== null ? 
          (service as { name: string }).name : 
          service || "N/A";
      }
    },
    {
      accessorKey: "worker",
      header: "Worker",
      cell: ({ row }) => row.original.worker?.name || "Unassigned"
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={status === "completed" ? "default" : "secondary"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const appointment = row.original;
        return (
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(appointment)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(appointment)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }
  ];
}
