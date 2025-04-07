'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { InventoryItem } from '@/lib/types/inventory';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface StockHistoryEntry {
  id: string;
  product_id: string;
  quantity: number;
  type: 'add' | 'remove' | 'set';
  notes?: string;
  created_at: string;
  created_by: string;
}

interface StockHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  selectedProduct: InventoryItem | null;
}

export function StockHistoryDialog({
  open,
  onClose,
  selectedProduct
}: StockHistoryDialogProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['stock-history', selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct) return [];
      const response = await fetch(`/api/inventory/history/${selectedProduct.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stock history');
      }
      return response.json() as Promise<StockHistoryEntry[]>;
    },
    enabled: !!selectedProduct,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stock History - {selectedProduct?.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {history?.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between border-b pb-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={entry.type === 'remove' ? 'destructive' : 'default'}>
                        {entry.type === 'add' && '+'}
                        {entry.type === 'remove' && '-'}
                        {entry.quantity}
                      </Badge>
                      <span className="text-sm font-medium">
                        {entry.type === 'set' ? 'Set to' : entry.type === 'add' ? 'Added' : 'Removed'}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground">{entry.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      by {entry.created_by}
                    </div>
                  </div>
                </div>
              ))}
              {history?.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No history available
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
