import type {
  ColumnDef,
  ColumnOrderState,
  Header,
  HeaderGroup,
  OnChangeFn,
} from "@tanstack/react-table"

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

export type DataTableProps<TData> = {
  data: TData[]
  columnDefs: ColumnDef<TData>[]
  columnOrder?: ColumnOrderState
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>
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

export function DataTable<TData>({
  data,
  columnDefs,
  columnOrder,
  onColumnOrderChange,
  components,
}: DataTableProps<TData>) {
  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    data,
    columns: columnDefs,
    state: {
      columnOrder,
    },
    onColumnOrderChange,
  })

  return (
    <div className="w-full overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => {
            const HeaderRowComponent = components?.headerRow || DefaultHeaderRow
            const HeaderCellComponent =
              components?.headerCell || DefaultHeaderCell

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
