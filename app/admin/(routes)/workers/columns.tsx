'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/app/admin/components/ui/badge";
import { Button } from "@/app/admin/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

export interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at?: string | null;
  updated_at?: string | null;
}

interface WorkerColumnsProps {
  onEdit: (worker: Worker) => void;
  onDelete: (id: string) => void;
}

export function createColumns({ onEdit, onDelete }: WorkerColumnsProps): ColumnDef<Worker>[] {
  return [
    {
      accessorKey: "name",
      header: "Name"
    },
    {
      accessorKey: "email",
      header: "Email"
    },
    {
      accessorKey: "phone",
      header: "Phone"
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const worker = row.original;
        return (
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(worker)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(worker.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }
  ];
}
