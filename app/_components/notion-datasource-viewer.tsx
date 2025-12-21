"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { DataTable, useNotionTableProps } from "@/components/data-table"
import {
  type NotionSort,
  notionDatasourceColumnDefOpts,
  notionDatasourceDataInfiniteOpts,
} from "@/hooks/use-notion-datasource"
import { NotionDatasourceForm } from "./notion-datasource-form"
import { SortConfigPanel } from "./sort-config-panel"

const EMPTY_COLUMN_DEFS: ColumnDef<Record<string, unknown>>[] = []

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

  // Notion table props
  const { columnDefs: notionTableColumnDefs, sorts } = useNotionTableProps({
    originalColumnDefs: schemaData?.columnDefs ?? EMPTY_COLUMN_DEFS,
  })

  // Fetch data with infinite pagination
  const {
    data: dataResponse,
    error: dataError,
    isLoading: isDataLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    notionDatasourceDataInfiniteOpts(datasourceId, {
      sorts: sorts.state,
    })
  )

  const flatData = useMemo(
    () => dataResponse?.pages.flatMap((page) => page.data) ?? [],
    [dataResponse?.pages]
  )

  const error = schemaError || dataError
  const isLoading = isSchemaLoading || (isDataLoading && !dataResponse)
  const columnDefs = schemaData?.columnDefs ?? EMPTY_COLUMN_DEFS

  const handleLoadMore = () => {
    if (hasNextPage) {
      fetchNextPage()
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement)
    const newId = formData.get("datasourceId") as string
    setDatasourceId(newId)
    // Reset sorts when datasource changes
    sorts.handleSortReset()
  }

  return (
    <>
      <NotionDatasourceForm
        defaultDatasourceId={datasourceId}
        onSubmit={handleSubmit}
      />

      {/* View config panel */}
      {!isLoading && columnDefs.length > 0 && (
        <div className="mb-4">
          <SortConfigPanel
            sorts={sorts.state}
            columnDefs={columnDefs}
            onAddSort={sorts.handleSortAdd}
            onRemoveSort={sorts.handleSortRemove}
            onDirectionToggleSort={sorts.handleSortDirectionToggle}
            onReorderSort={sorts.handleSortReorder}
          />
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="mb-4 text-red-600 text-sm">Something went wrong</div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-4 text-hn-text-secondary text-sm">Loading...</div>
      )}

      {!isLoading && columnDefs.length > 0 && flatData.length > 0 && (
        <>
          <DataTable data={flatData} columnDefs={notionTableColumnDefs} />

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
        flatData.length === 0 && (
          <div className="text-hn-text-secondary text-sm">
            No data found in this datasource.
          </div>
        )}
    </>
  )
}
