import type {
  ColumnDef,
  ColumnOrderState,
  ColumnSizingState,
  Header,
  HeaderGroup,
  OnChangeFn,
} from "@tanstack/react-table"

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useMemo } from "react"

export type DataTableProps<TData> = {
  data: TData[]
  columnDefs: ColumnDef<TData>[]
  columnOrder?: ColumnOrderState
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>
  columnSizing?: ColumnSizingState
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>
  components?: {
    headerRow?: React.ComponentType<{
      headerGroup: HeaderGroup<TData>
      children: React.ReactNode
    }>
    headerCell?: React.ComponentType<{
      header: Header<TData, unknown>
      children: React.ReactNode
    }>
  }
}

function DefaultHeaderRow<TData>({
  children,
}: {
  headerGroup: HeaderGroup<TData>
  children: React.ReactNode
}) {
  return <tr>{children}</tr>
}

function DefaultHeaderCell<TData>({
  header,
  children,
}: {
  header: Header<TData, unknown>
  children: React.ReactNode
}) {
  return (
    <th
      colSpan={header.colSpan}
      className="p-1 border border-gray-300 bg-gray-100 text-left font-semibold"
    >
      {children}
    </th>
  )
}

// Encode column ID to be safe for CSS variable names
// CSS custom properties can contain letters, digits, hyphens, and underscores
// We encode special characters and spaces to ensure valid CSS variable names
function encodeColumnIdForCSS(columnId: string): string {
  return columnId.replace(/[^a-zA-Z0-9_-]/g, (char) => {
    // Encode special characters using their char code
    return `_${char.charCodeAt(0).toString(36)}`
  })
}

export function DataTable<TData>({
  data,
  columnDefs,
  columnOrder,
  onColumnOrderChange,
  columnSizing,
  onColumnSizingChange,
  components,
}: DataTableProps<TData>) {
  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    data,
    columns: columnDefs,
    state: {
      columnOrder,
      columnSizing,
    },
    onColumnOrderChange,
    onColumnSizingChange,
    columnResizeMode: "onChange",
  })

  const HeaderRowComponent = components?.headerRow || DefaultHeaderRow
  const HeaderCellComponent = components?.headerCell || DefaultHeaderCell

  const columnSizingInfo = table.getState().columnSizingInfo
  const columnSizingState = table.getState().columnSizing

  /**
   * Instead of calling `column.getSize()` on every render for every header
   * and especially every data cell (very expensive),
   * we will calculate all column sizes at once at the root table level in a useMemo
   * and pass the column sizes down as CSS variables to the <table> element.
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: Following TanStack Table documentation pattern
  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders()
    const colSizes: { [key: string]: number } = {}
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]
      if (!header) continue
      const encodedColumnId = encodeColumnIdForCSS(header.column.id)
      colSizes[`--col-${encodedColumnId}-size`] = header.column.getSize()
    }
    return colSizes
  }, [columnSizingInfo, columnSizingState])

  return (
    <div className="w-full overflow-auto">
      <table
        className="w-full border-collapse text-sm table-fixed"
        style={columnSizeVars}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => {
            return (
              <HeaderRowComponent
                key={headerGroup.id}
                headerGroup={headerGroup}
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <HeaderCellComponent key={header.id} header={header}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </HeaderCellComponent>
                  )
                })}
              </HeaderRowComponent>
            )
          })}
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
