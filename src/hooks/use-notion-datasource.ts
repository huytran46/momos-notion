import { queryOptions } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"

type NotionSort =
  | {
      property: string
      direction: "ascending" | "descending"
    }
  | {
      timestamp: "created_time" | "last_edited_time"
      direction: "ascending" | "descending"
    }

// Filter type matches Notion's QueryDataSourceBodyParameters.filter
// This is a union of PropertyFilter, TimestampFilter, or group filters (or/and)
type NotionFilter =
  | {
      or: unknown[]
    }
  | {
      and: unknown[]
    }
  | Record<string, unknown>

export type NotionDatasourceQueryParams = {
  cursor?: string | null
  pageSize?: number
  filter?: NotionFilter
  sorts?: NotionSort[]
}

export function notionDatasourceColumnDefQueryOpts(datasourceId: string) {
  return queryOptions({
    queryKey: ["notion-datasource-column-defs", datasourceId],
    queryFn: async () => {
      const response = await fetch(`/api/notion/datasources/${datasourceId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch schema")
      }

      const { columnDefs } = await response.json()
      return {
        columnDefs,
      } as {
        columnDefs: ColumnDef<Record<string, unknown>>[]
      }
    },
    enabled: !!datasourceId,
  })
}

export function notionDatasourceDataQueryOpts(
  datasourceId: string,
  params?: NotionDatasourceQueryParams
) {
  return queryOptions({
    queryKey: ["notion-datasource-data", datasourceId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.cursor) {
        searchParams.set("cursor", params.cursor)
      }
      if (params?.pageSize) {
        searchParams.set("pageSize", params.pageSize.toString())
      }
      if (params?.filter) {
        searchParams.set("filter", JSON.stringify(params.filter))
      }
      if (params?.sorts) {
        searchParams.set("sorts", JSON.stringify(params.sorts))
      }

      const queryString = searchParams.toString()
      const url = `/api/notion/datasources/${datasourceId}/data${queryString ? `?${queryString}` : ""}`
      const response = await fetch(url)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch data")
      }

      return response.json() as Promise<{
        data: Record<string, unknown>[]
        next_cursor: string | null
        has_more: boolean
      }>
    },
    enabled: !!datasourceId,
  })
}
