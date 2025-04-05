'use client';

import { useState, useEffect } from 'react';
import { Card } from "../../components/ui/card";
import { Heading } from "../../components/ui/heading";
import { Separator } from "../../components/ui/separator";
import { DataTable } from "../../components/ui/data-table";
import { columns, InventoryItem } from "./columns";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from '@/app/admin/components/loading-spinner';
import { toast } from 'react-hot-toast';

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          quantity,
          status,
          reorder_point,
          last_restock_date
        `);

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory data. Please try again.');
    } finally {
      setLoading(false);
    }
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
        </div>
        <Separator />
        <Card className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <LoadingSpinner size={40} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={inventory}
                searchKey="name"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
