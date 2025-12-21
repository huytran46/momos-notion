import type { ColumnDef } from "@tanstack/react-table"

export type DataTableProps<TData> = {
  data: TData[]
  columnDefs: ColumnDef<TData>[]
  //   sorts?: NotionSort[]
  //   defaultSorts?: NotionSort[]
  //   onSortsChange?: (sorts: NotionSort[]) => void
}
