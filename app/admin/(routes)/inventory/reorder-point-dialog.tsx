'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InventoryItem } from '@/lib/types/inventory';

const formSchema = z.object({
  reorderPoints: z.record(z.string(), z.coerce.number().min(0).nullable()),
});

interface ReorderPointDialogProps {
  open: boolean;
  onClose: () => void;
  selectedItems: InventoryItem[];
}

export function ReorderPointDialog({
  open,
  onClose,
  selectedItems
}: ReorderPointDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reorderPoints: selectedItems.reduce((acc, item) => ({
        ...acc,
        [item.id]: item.reorder_point || null
      }), {}),
    },
  });

  const { mutateAsync: updateReorderPoints } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const updates = Object.entries(values.reorderPoints)
        .filter(([_, value]) => value !== null)
        .map(([id, value]) => ({
          id,
          reorder_point: value as number
        }));

      const response = await fetch('/api/inventory/update-reorder-point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update reorder points');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Reorder points updated successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await updateReorderPoints(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Reorder Points</DialogTitle>
          <DialogDescription>
            Set reorder points for {selectedItems.length} selected items.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-4">
                {selectedItems.map(item => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name={`reorderPoints.${item.id}`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <FormLabel htmlFor={item.id}>{item.name}</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Current stock: {item.stock_quantity}
                            </div>
                          </div>
                          <div className="w-32">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Reorder at"
                                {...field}
                                value={field.value || ''}
                                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                              />
                            </FormControl>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Reorder Points'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
