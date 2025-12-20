"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"
import { DataTable } from "@/components/data-table"
import {
  notionDatasourceColumnDefOpts,
  notionDatasourceDataInfiniteOpts,
} from "@/hooks/use-notion-datasource"
import { NotionDatasourceForm } from "./notion-datasource-form"

export function NotionDatasourceViewer({
  defaultDatasourceId = "",
}: {
  defaultDatasourceId?: string
}) {
  const [datasourceId, setDatasourceId] = useState(defaultDatasourceId)

  // Fetch schema
  const {
    data: schemaData,
    error: schemaError,
    isLoading: isSchemaLoading,
  } = useQuery(notionDatasourceColumnDefOpts(datasourceId))

  // Fetch data with infinite pagination
  const {
    data: dataResponse,
    error: dataError,
    isLoading: isDataLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(notionDatasourceDataInfiniteOpts(datasourceId))

  // Get columnDefs from schema response
  const columnDefs: ColumnDef<Record<string, unknown>>[] =
    schemaData?.columnDefs || []

  // Flatten all pages into a single array
  const accumulatedData = dataResponse?.pages.flatMap((page) => page.data) ?? []

  const error = schemaError || dataError
  const isLoading = isSchemaLoading || (isDataLoading && !dataResponse)

  const handleLoadMore = () => {
    if (hasNextPage) {
      fetchNextPage()
    }
  }

  const handleSubmit = (formData: FormData) => {
    const newId = formData.get("datasourceId") as string
    setDatasourceId(newId)
  }

  return (
    <>
      <NotionDatasourceForm
        defaultDatasourceId={datasourceId}
        onSubmit={handleSubmit}
      />

      {/* Error Messages */}
      {error && (
        <div className="mb-4 text-red-600 text-sm">Something went wrong</div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-4 text-hn-text-secondary text-sm">Loading...</div>
      )}

      {!isLoading && columnDefs.length > 0 && accumulatedData.length > 0 && (
        <>
          <DataTable columnDefs={columnDefs} data={accumulatedData} />
          {/* Load More Button */}
          <div className="mt-4">
            {hasNextPage ? (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                className="text-hn-orange py-2 text-sm cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingNextPage ? "Loading..." : "↓ Load more"}
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
        accumulatedData.length === 0 && (
          <div className="text-hn-text-secondary text-sm">
            No data found in this datasource.
          </div>
        )}
    </>
  )
}
