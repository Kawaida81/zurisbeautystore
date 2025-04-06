'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';
import type { InventoryItem, StockAdjustment } from '@/lib/types/inventory';
import { getStockHistory } from '@/lib/queries/inventory';
import { LoadingSpinner } from '../../components/loading-spinner';

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
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<StockAdjustment[]>([]);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (open && selectedProduct) {
      fetchHistory();
    }
  }, [open, selectedProduct, dateRange]);

  const fetchHistory = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const { data, error } = await getStockHistory(
        selectedProduct.id,
        startDate,
        endDate
      );

      if (error) throw error;
      setHistory(data);
    } catch (error) {
      console.error('Error fetching stock history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stock History</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            {selectedProduct ? selectedProduct.name : 'Select a product'}
          </div>
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner size={40} />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No stock adjustments found for this period
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-4 rounded-lg border"
              >
                <div className="space-y-1">
                  <div className="font-medium">
                    {item.adjustment_type === 'add' ? 'Added' : 
                     item.adjustment_type === 'remove' ? 'Removed' : 
                     'Set to'} {item.adjustment_quantity} units
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Previous: {item.previous_quantity} → New: {item.new_quantity}
                  </div>
                  {item.notes && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
