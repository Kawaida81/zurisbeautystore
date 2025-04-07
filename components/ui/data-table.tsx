'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  RowSelectionState,
  Row,
  Header,
  HeaderGroup,
  Cell,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Input } from "./input";
import { Button } from "./button";
import { useState, useEffect } from "react";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey: string;
  searchValue?: string;
  pagination?: boolean;
  pageCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onRowSelectionChange?: (selectedRows: RowSelectionState) => void;
  onSortingChange?: (sorting: SortingState) => void;
  sorting?: SortingState;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchValue = "",
  pagination = false,
  pageCount = 1,
  currentPage = 1,
  onPageChange,
  onRowSelectionChange,
  onSortingChange,
  sorting,
}: DataTableProps<TData, TValue>) {
  const [filtering, setFiltering] = useState(searchValue);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [localSorting, setLocalSorting] = useState<SortingState>([]);

  useEffect(() => {
    setFiltering(searchValue);
  }, [searchValue]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: (updater) => {
      const newState =
        typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(newState);
      onRowSelectionChange?.(newState);
    },
    onSortingChange: (updater) => {
      const newState =
        typeof updater === "function" ? updater(sorting || localSorting) : updater;
      if (onSortingChange) {
        onSortingChange(newState);
      } else {
        setLocalSorting(newState);
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting: sorting || localSorting,
      columnVisibility,
      rowSelection,
      globalFilter: filtering,
    },
    enableRowSelection: true,
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(filterValue.toLowerCase());
    },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        {!searchValue && (
          <Input
            placeholder="Search"
            value={filtering}
            onChange={(event) => setFiltering(event.target.value)}
            className="max-w-sm"
          />
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {pageCount}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= pageCount}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
