'use client';

import { useState, useEffect } from 'react';
import type { ProductFilters } from '@/lib/types/inventory';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { Card } from "../../components/ui/card";
import { Heading } from "../../components/ui/heading";
import { Separator } from "../../components/ui/separator";
import { DataTable } from "../../components/ui/data-table";
import { columns } from "./columns";
import { Button } from "../../components/ui/button";
import { Dialog } from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { getInventoryItems, getCategories, getLowStockAlerts, updateStock } from "@/lib/queries/inventory";
import { LoadingState } from '../../components/loading-spinner';
import { toast } from 'react-hot-toast';
import { Download, Filter, AlertTriangle, Plus, History } from 'lucide-react';
import type { InventoryItem, ProductCategory, StockUpdate, StockStatus, LowStockAlert } from '@/lib/types/inventory';
import { StockAdjustmentDialog } from './stock-adjustment-dialog';
import { StockHistoryDialog } from './stock-history-dialog';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<StockStatus | ''>('');
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: inventoryData, isLoading: isInventoryLoading } = useQuery({
    queryKey: ['inventory', currentPage, selectedCategory, selectedStatus],
    queryFn: async () => {
      const filters: ProductFilters = {
        page: currentPage,
        pageSize: 10,
        category_id: selectedCategory || undefined,
        status: selectedStatus || undefined
      };
      
      return getInventoryItems(filters);
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await getCategories();
      return response.data;
    },
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await getLowStockAlerts();
      return response.data;
    },
  });





  const handleStockAdjustment = async (adjustment: StockUpdate) => {
    try {
      const { error } = await updateStock(adjustment);
      if (error) throw error;
      toast.success('Stock updated successfully');
      // Invalidate queries to refetch data
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      await queryClient.invalidateQueries({ queryKey: ['alerts'] });
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  const handleExportCSV = () => {
    if (!inventoryData?.data?.items) return;

    const csvContent = inventoryData.data.items.map((item: InventoryItem) => (
      `${item.name},${item.category_name},${item.stock_quantity},${item.status},${item.reorder_point}`
    )).join('\n');

    const header = 'Product Name,Category,Stock Quantity,Status,Reorder Point\n';
    const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Heading
            title="Inventory Management"
            description="Manage your product inventory and stock levels"
            className="text-2xl sm:text-3xl"
          />
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {inventoryData?.data?.items?.length || 0} Products
            </Badge>
            <Button
              onClick={() => setShowAdjustDialog(true)}
              variant="default"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adjust Stock
            </Button>
            <Button
              onClick={() => setShowHistoryDialog(true)}
              variant="outline"
              size="sm"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button
              onClick={handleExportCSV}
              disabled={isInventoryLoading}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {alertsData && alertsData.length > 0 && (
          <Card className="p-4 border-yellow-500">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              <span>You have {alertsData.length} items that need attention</span>
            </div>
            <div className="mt-2 space-y-1">
              {alertsData.map((alert: LowStockAlert) => (
                <div key={alert.id} className="text-sm flex items-center justify-between">
                  <span>{alert.name}</span>
                  <Badge
                    variant={alert.status === 'out_of_stock' ? 'destructive' : 'warning'}
                  >
                    {alert.stock_quantity} in stock
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue defaultValue="" placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categoriesData?.map((category: ProductCategory) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select
              value={selectedStatus}
              onValueChange={(value: string) => {
                if (value === '' || ['in_stock', 'low_stock', 'out_of_stock'].includes(value)) {
                  setSelectedStatus(value as StockStatus | '');
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue defaultValue="" placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="p-6">
            {isInventoryLoading ? (
              <LoadingState />
            ) : (
              <DataTable
                columns={columns}
                data={inventoryData?.data?.items || []}
                searchKey="name"
                pagination
                pageCount={inventoryData?.data?.pageCount || 1}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </Card>
      </div>

      <StockAdjustmentDialog
        open={showAdjustDialog}
        onClose={() => setShowAdjustDialog(false)}
        onSubmit={handleStockAdjustment}
        products={inventoryData?.data?.items || []}
      />

      <StockHistoryDialog
        open={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        selectedProduct={selectedProduct}
      />
    </div>
  );
}
