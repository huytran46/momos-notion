"use client"

import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { notionDatasourceQueryOpts } from "@/hooks/use-notion-datasource"
import { NotionDatasourceForm } from "./notion-datasource-form"

export function NotionDatasourceViewer({
  defaultDatasourceId = "",
}: {
  defaultDatasourceId?: string
}) {
  const [datasourceId, setDatasourceId] = useState(defaultDatasourceId)

  const { data, error } = useQuery(notionDatasourceQueryOpts(datasourceId))

  const [tableColumns, setTableColumns] = useState<
    ColumnDef<Record<string, unknown>>[]
  >([])

  const [tableData, setTableData] = useState<Record<string, unknown>[]>([])

  const { columnDefs, data: tableRawData } = data ?? {
    columnDefs: [],
    data: [],
  }

  return (
    <>
      <NotionDatasourceForm
        defaultDatasourceId={datasourceId}
        onSubmit={(formData) =>
          setDatasourceId(formData.get("datasourceId") as string)
        }
      />

      {/* Error Messages */}
      {error && (
        <div className="mb-4 text-red-600 text-sm">Something went wrong</div>
      )}

      {/* Table */}
      {columnDefs.length > 0 && tableRawData.length > 0 ? (
        <DataTable columnDefs={columnDefs} data={tableRawData} />
      ) : datasourceId && !error ? (
        <div className="text-hn-text-secondary text-sm">
          No data found in this datasource.
        </div>
      ) : null}
    </>
  )
}
