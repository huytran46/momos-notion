"use client"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import type { NotionSort } from "@/hooks/use-notion-datasource"
import { useFeaturedColumnDefs } from "./hooks/use-featured-column-defs"
import { useSortFeature } from "./hooks/use-sort-feature"

type DataTableProps<TData> = {
  data: TData[]
  columnDefs: ColumnDef<TData>[]
  sorts?: NotionSort[]
  defaultSorts?: NotionSort[]
  onSortsChange?: (sorts: NotionSort[]) => void
}

export function DataTable<TData>({
  data,
  columnDefs,
  // sort feature props
  sorts: sortsProp,
  defaultSorts: defaultSortsProp,
  onSortsChange: onSortsChangeProp,
}: DataTableProps<TData>) {
  const { sorts, handleSortToggle } = useSortFeature({
    sorts: sortsProp,
    defaultSorts: defaultSortsProp,
    onSortsChange: onSortsChangeProp,
  })

  const featuredColumnDefs = useFeaturedColumnDefs({
    columnDefs,
    sorts,
    onToggleSort: handleSortToggle,
  })

  const table = useReactTable({
    data,
    columns: featuredColumnDefs,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-1 border border-gray-300 bg-gray-100 text-left font-semibold"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="bg-white hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-1 border border-gray-300">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
