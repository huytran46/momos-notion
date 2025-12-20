"use client"

import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { DataTable } from "@/components/data-table"
import {
  type NotionDatasourceQueryParams,
  notionDatasourceColumnDefQueryOpts,
  notionDatasourceDataQueryOpts,
} from "@/hooks/use-notion-datasource"
import { NotionDatasourceForm } from "./notion-datasource-form"

export function NotionDatasourceViewer({
  defaultDatasourceId = "",
}: {
  defaultDatasourceId?: string
}) {
  const [datasourceId, setDatasourceId] = useState(defaultDatasourceId)

  const [pagination, setPagination] = useState<{
    params: NotionDatasourceQueryParams
    accumulatedData: Record<string, unknown>[]
    nextCursor: string | null
    hasMore: boolean
  }>({
    params: {},
    accumulatedData: [],
    nextCursor: null,
    hasMore: false,
  })

  // Fetch schema
  const {
    data: schemaData,
    error: schemaError,
    isLoading: isSchemaLoading,
  } = useQuery(notionDatasourceColumnDefQueryOpts(datasourceId))

  // Fetch data with pagination
  const {
    data: dataResponse,
    error: dataError,
    isLoading: isDataLoading,
  } = useQuery(notionDatasourceDataQueryOpts(datasourceId, pagination.params))

  // Reset accumulated data when datasource changes
  useEffect(() => {
    if (datasourceId) {
      setPagination({
        params: {},
        accumulatedData: [],
        nextCursor: null,
        hasMore: false,
      })
    }
  }, [datasourceId])

  // Accumulate data when new page is loaded
  useEffect(() => {
    if (dataResponse) {
      setPagination((prev) => {
        const newData = !prev.params.cursor // First page - replace
          ? dataResponse.data
          : prev.accumulatedData.concat(dataResponse.data)
        return {
          ...prev,
          accumulatedData: newData,
          nextCursor: dataResponse.next_cursor,
          hasMore: dataResponse.has_more,
        }
      })
    }
  }, [dataResponse])

  // Get columnDefs from schema response
  const columnDefs: ColumnDef<Record<string, unknown>>[] =
    schemaData?.columnDefs || []

  const error = schemaError || dataError
  const isLoading =
    isSchemaLoading || (isDataLoading && !pagination.params.cursor)

  const handleLoadMore = () => {
    if (pagination.nextCursor) {
      setPagination((prev) => ({
        ...prev,
        params: { ...prev.params, cursor: prev.nextCursor },
      }))
    }
  }

  return (
    <>
      <NotionDatasourceForm
        defaultDatasourceId={datasourceId}
        onSubmit={(formData) => {
          const newId = formData.get("datasourceId") as string
          setDatasourceId(newId)
          setPagination((prev) => ({ ...prev, params: {} }))
        }}
      />

      {/* Error Messages */}
      {error && (
        <div className="mb-4 text-red-600 text-sm">Something went wrong</div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-4 text-hn-text-secondary text-sm">Loading...</div>
      )}

      {!isLoading &&
        columnDefs.length > 0 &&
        pagination.accumulatedData.length > 0 && (
          <>
            <DataTable
              columnDefs={columnDefs}
              data={pagination.accumulatedData}
            />
            {/* Load More Button */}
            <div className="mt-4">
              {pagination.hasMore ? (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isDataLoading || !pagination.nextCursor}
                  className="text-hn-orange py-2 text-sm cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDataLoading ? "Loading..." : "↓ Load more"}
                </button>
              ) : (
                <div className="text-hn-text-secondary text-sm">
                  No more data to load.
                </div>
              )}
            </div>
          </>
        )}

      {/* Empty State */}
      {!isLoading &&
        datasourceId &&
        !error &&
        columnDefs.length > 0 &&
        pagination.accumulatedData.length === 0 && (
          <div className="text-hn-text-secondary text-sm">
            No data found in this datasource.
          </div>
        )}
    </>
  )
}
