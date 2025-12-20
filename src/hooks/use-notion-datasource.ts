import { queryOptions } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"

export function notionDatasourceQueryOpts(datasourceId: string) {
  return queryOptions({
    queryKey: ["notion-datasource", datasourceId],
    queryFn: async () => {
      const response = await fetch(`/api/notion/datasources/${datasourceId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch datasource")
      }

      return response.json() as Promise<{
        columnDefs: ColumnDef<Record<string, unknown>>[]
        data: Record<string, unknown>[]
      }>
    },
    enabled: !!datasourceId,
  })
}
