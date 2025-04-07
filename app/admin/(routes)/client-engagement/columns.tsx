'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

export type MessageType = 'appointment_reminder' | 'follow_up' | 'promotion' | 'announcement';
export type MessageStatus = 'scheduled' | 'sent' | 'failed';

export interface Message {
  id: string;
  client_id: string;
  appointment_id: string | null;
  type: MessageType;
  subject: string;
  message: string;
  status: MessageStatus;
  scheduled_for: string;
  client: { id: string; full_name: string | null };
  appointment?: { id: string; appointment_date: string; time: string };
}

interface ColumnActions {
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
}

export const createColumns = ({ onEdit, onDelete }: ColumnActions): ColumnDef<Message>[] => [
  {
    accessorKey: "client.full_name",
    header: "Client",
    cell: ({ row }) => row.original.client?.full_name || 'Unknown',
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as MessageType;
      return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    },
  },
  {
    accessorKey: "subject",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Subject
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
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
      const status = row.getValue("status") as MessageStatus;
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
    cell: ({ row }) => format(new Date(row.original.scheduled_for), 'PPp'),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(row.original)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(row.original)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
