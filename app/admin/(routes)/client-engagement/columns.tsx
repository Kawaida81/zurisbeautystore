'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

export interface Message {
  id: string;
  customer: {
    id: string;
    full_name: string;
  };
  appointment?: {
    id: string;
    date: string;
    time: string;
  } | null;
  type: 'appointment_reminder' | 'follow_up' | 'promotion' | 'announcement';
  subject: string;
  message: string;
  status: 'scheduled' | 'sent' | 'failed';
  scheduled_for: string;
  created_at: string;
}

interface ColumnActions {
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}

export const createColumns = ({ onEdit, onDelete }: ColumnActions): ColumnDef<Message>[] => [
  {
    accessorKey: "customer.full_name",
    header: "Customer",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
        'appointment_reminder': 'default',
        'follow_up': 'secondary',
        'promotion': 'outline',
        'announcement': 'secondary'
      };
      return (
        <Badge variant={variants[type]}>
          {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </Badge>
      );
    },
  },
  {
    accessorKey: "subject",
    header: "Subject",
  },
  {
    accessorKey: "message",
    header: "Message",
    cell: ({ row }) => {
      const message = row.getValue("message") as string;
      return message.length > 50 ? `${message.substring(0, 50)}...` : message;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
        'scheduled': 'outline',
        'sent': 'default',
        'failed': 'destructive'
      };
      return (
        <Badge variant={variants[status]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "scheduled_for",
    header: "Scheduled For",
    cell: ({ row }) => {
      const date = new Date(row.getValue("scheduled_for"));
      return date.toLocaleString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const message = row.original;
      
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit?.(message)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete?.(message)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
