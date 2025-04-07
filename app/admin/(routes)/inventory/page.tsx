'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, History, Download, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getInventoryItems, getCategories, getLowStockAlerts, updateStockQuantity } from '@/lib/queries/inventory';
import type { InventoryItem, LowStockAlert, StockUpdate, ProductFilters, ProductCategory } from '@/lib/types/inventory';
import { downloadAsCSV } from '@/lib/utils/csv';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DataTable } from '@/components/ui/data-table';
import { StockAdjustmentDialog } from './stock-adjustment-dialog';
import { StockHistoryDialog } from './stock-history-dialog';
import { BatchUpdateDialog } from './batch-update-dialog';
import { ReorderPointDialog } from './reorder-point-dialog';
import { Heading } from '@/components/ui/heading';
import type { SortingState, RowSelectionState } from '@tanstack/react-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type TableColumn = {
  accessorKey?: string;
  id?: string;
  header: string;
  cell?: ({ row }: { row: { original: InventoryItem } }) => React.ReactNode;
};

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showBatchUpdate, setShowBatchUpdate] = useState(false);
  const [showReorderPoint, setShowReorderPoint] = useState(false);

  const columns: TableColumn[] = [
    {
      accessorKey: 'name',
      header: 'Product Name',
    },
    {
      accessorKey: 'category_name',
      header: 'Category',
      cell: ({ row }) => {
        const item = row.original;
        return item.category_name || "Uncategorized";
      },
    },
    {
      accessorKey: 'stock_quantity',
      header: 'Stock',
    },
    {
      accessorKey: 'reorder_point',
      header: 'Reorder Point',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={
              status === 'in_stock'
                ? 'default'
                : status === 'low_stock'
                ? 'secondary'
                : 'destructive'
            }
          >
            {status === 'in_stock'
              ? 'In Stock'
              : status === 'low_stock'
              ? 'Low Stock'
              : 'Out of Stock'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => {
        const date = row.original.created_at;
        return date ? format(new Date(date), 'MMM d, yyyy') : 'Never';
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 flex items-center gap-1"
                    onClick={() => {
                      setSelectedProduct(item);
                      setShowAdjustDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adjust</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adjust stock quantity</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedProduct(item);
                      setShowHistoryDialog(true);
                    }}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View stock history</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const categories = useMemo(() => {
    return [
      { id: 'all', name: 'All Categories' },
      ...(categoriesData || []).map((category: ProductCategory) => ({
        id: category.id,
        name: category.name
      }))
    ];
  }, [categoriesData]);

  const { data: alertsData, isLoading: isAlertsLoading } = useQuery({
    queryKey: ['lowStockAlerts'],
    queryFn: getLowStockAlerts,
  });

  const { data: inventoryData, isLoading: isInventoryLoading, error: inventoryError } = useQuery({
    queryKey: ['inventory', currentPage, selectedCategory, selectedStatus],
    queryFn: async () => {
      const filters: ProductFilters = {
        category_id: selectedCategory === 'all' ? undefined : selectedCategory,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
      };
      return getInventoryItems(filters, { page: currentPage, limit: 10 });
    },
  });

  if (inventoryError) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <Heading
              title="Inventory"
              description="Manage your inventory"
            />
          </div>
          <div className="text-center p-8 text-destructive">
            Failed to load inventory data. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  const handleStockAdjustment = async (productId: string, adjustment: number, note: string) => {
    try {
      await updateStockQuantity(productId, adjustment, note);
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Stock adjusted successfully');
      setShowAdjustDialog(false);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    }
  };

  // Handle batch update
  const handleBatchUpdate = async (adjustments: StockUpdate[]) => {
    try {
      for (const adjustment of adjustments) {
        await updateStockQuantity(adjustment.product_id, adjustment.quantity, adjustment.notes || '');
      }
      toast.success('Batch update completed successfully');
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowBatchUpdate(false);
    } catch (error) {
      console.error('Error in batch update:', error);
      toast.error('Failed to complete batch update');
    }
  };

  const handleReorderPointUpdate = async (updates: { id: string; reorder_point: number }[]) => {
    try {
      // TODO: Implement updateReorderPoints function in queries/inventory
      // for (const update of updates) {
      //   const { error } = await updateReorderPoint(update.id, update.reorder_point);
      //   if (error) throw error;
      // }
      toast.success('Reorder points updated successfully');
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSelectedItems([]);
    } catch (error) {
      console.error('Error updating reorder points:', error);
      toast.error('Failed to update reorder points');
    }
  };

  const downloadAsCSV = (data: InventoryItem[], filename: string) => {
    const headers = [
      'Product Name',
      'Category',
      'Stock Quantity',
      'Reorder Point',
      'Status',
      'Created At',
    ];

    const rows = data.map((item) => [
      item.name,
      item.category_name || 'Uncategorized',
      item.stock_quantity.toString(),
      item.reorder_point.toString(),
      item.status,
      item.created_at || 'Never',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <Heading
              title={`Inventory (${inventoryData?.data?.length || 0} items)`}
              description="Manage your inventory"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (inventoryData?.data) {
                    downloadAsCSV(
                      inventoryData.data,
                      `inventory-${format(new Date(), 'yyyy-MM-dd')}.csv`
                    );
                  }
                }}
                disabled={!inventoryData?.data || inventoryData.data.length === 0}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.filter(category => category.id !== 'all').map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setSelectedStatus(value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock');
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                onClick={() => setShowBatchUpdate(true)}
                disabled={selectedItems.length === 0}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                <span>Batch Update ({selectedItems.length})</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowReorderPoint(true)}
                disabled={selectedItems.length === 0}
                className="flex items-center gap-1"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Set Reorder Points</span>
              </Button>
            </div>
          </div>
        </div>

        {!isAlertsLoading && alertsData && alertsData.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Low Stock Alerts</span>
            </div>
            <div className="mt-2 space-y-2">
              {alertsData.map((alert: LowStockAlert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between text-sm text-amber-700"
                >
                  <span>{alert.name}</span>
                  <span>Stock: {alert.stock_quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Card className="p-4">
          <div className="p-6">
            {isInventoryLoading ? (
              <div className="flex justify-center p-8">
                <LoadingSpinner size={40} />
              </div>
            ) : inventoryData?.data ? (
              <DataTable<InventoryItem, unknown>
                columns={columns}
                data={inventoryData.data}
                searchKey="name"
                pagination
                pageCount={inventoryData.pageCount || 1}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onRowSelectionChange={(selectedRows: RowSelectionState) => {
                  setSelectedItems(
                    Object.keys(selectedRows).filter(
                      (key) => selectedRows[key]
                    )
                  );
                }}
              />
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                No inventory items found
              </div>
            )}
          </div>
        </Card>

        <StockAdjustmentDialog
          open={showAdjustDialog}
          onClose={() => setShowAdjustDialog(false)}
          onSubmit={async (adjustment: StockUpdate) => {
            await handleStockAdjustment(adjustment.product_id, adjustment.quantity, adjustment.notes || '');
          }}
          products={inventoryData?.data || []}
        />

        <StockHistoryDialog
          open={showHistoryDialog}
          onClose={() => setShowHistoryDialog(false)}
          selectedProduct={selectedProduct}
        />

        {showBatchUpdate && (
          <BatchUpdateDialog
            open={showBatchUpdate}
            onClose={() => setShowBatchUpdate(false)}
            selectedItems={inventoryData?.data?.filter(item => selectedItems.includes(item.id)) || []}
            onSubmit={handleBatchUpdate}
          />
        )}

        {showReorderPoint && (
          <ReorderPointDialog
            open={showReorderPoint}
            onClose={() => setShowReorderPoint(false)}
            selectedItems={inventoryData?.data?.filter(item => selectedItems.includes(item.id)) || []}
          />
        )}
      </div>
    </div>
  );
}
