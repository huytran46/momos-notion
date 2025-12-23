"use client"

import { useInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { NotionFilterConfigPopover } from "@/features/notion-filters"
import { NotionSortConfigPopover } from "@/features/notion-sort"
import { NotionTable } from "@/features/notion-table"
import {
  notionDatasourceColumnDefOpts,
  notionDatasourceDataInfiniteOpts,
} from "../_hooks/use-notion-datasource"
import { useNotionDatasourceStates } from "../_hooks/use-notion-datasource-states"
import { NotionDatasourceForm } from "./notion-datasource-form"

export function NotionDatasourceViewer({
  defaultDatasourceId = "",
  defaultNotionKey = "",
}: {
  defaultDatasourceId?: string
  defaultNotionKey?: string
}) {
  const [datasourceId, setDatasourceId] = useState(defaultDatasourceId)
  const [notionKey, setNotionKey] = useState(defaultNotionKey)
  const [showKeyCallout, setShowKeyCallout] = useState(true)

  // Fetch schema
  const {
    data: schemaData,
    error: schemaError,
    isLoading: isSchemaLoading,
  } = useSuspenseQuery(notionDatasourceColumnDefOpts(datasourceId, notionKey))

  const columnDefs = schemaData.columnDefs
  const columnIds = useMemo(() => {
    if (!columnDefs) return []
    return columnDefs.map((colDef, index) => {
      if (!colDef.id) return `${index}`
      return colDef.id
    })
  }, [columnDefs])

  // Feature states - using composition hook
  const { sorts, filters, columnOrder, columnSizing } =
    useNotionDatasourceStates({
      columnIds,
      defaultMaxNestingDepth: 2,
    })

  // Fetch data based on filter + sort changes
  const {
    data: dataResponse,
    error: dataError,
    isLoading: isDataLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    notionDatasourceDataInfiniteOpts(datasourceId, notionKey, {
      sorts: sorts.state,
      filter: filters.appliedState,
    })
  )

  const flatData = useMemo(
    () => dataResponse?.pages.flatMap((page) => page.data) ?? [],
    [dataResponse?.pages]
  )

  const error = schemaError || dataError
  const isLoading = isSchemaLoading || (isDataLoading && !dataResponse)

  // Handle datasource change
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement)
    const newId = formData.get("datasourceId") as string
    const newKey = (formData.get("notionKey") as string) ?? ""
    setDatasourceId(newId)
    setNotionKey(newKey)
    // Reset feature states when datasource changes
    sorts.handleSortReset()
    filters.handleResetFilters()
  }

  const handleLoadMore = () => {
    if (hasNextPage) {
      fetchNextPage()
    }
  }

  return (
    <>
      {showKeyCallout && (
        <div className="mb-3 flex items-start gap-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <div className="flex-1">
            For demo purposes, the Notion key is entered manually here. In a
            real app it should be kept secret and never exposed in the client.
          </div>
          <button
            type="button"
            onClick={() => setShowKeyCallout(false)}
            className="text-xs text-amber-900 underline whitespace-nowrap"
            aria-label="Dismiss demo callout"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Datasource Selection */}
      <NotionDatasourceForm
        defaultDatasourceId={datasourceId}
        defaultNotionKey={notionKey}
        onSubmit={handleSubmit}
      />

      <hr className="my-4 border-hn-border" />

      {!isSchemaLoading && columnDefs.length > 0 && (
        <div className="mb-4 flex gap-2">
          {/* Feature 1: Sort */}
          <NotionSortConfigPopover
            columnDefs={columnDefs}
            sorts={sorts.state}
            onAddSort={sorts.handleSortAdd}
            onRemoveSort={sorts.handleSortRemove}
            onDirectionToggleSort={sorts.handleSortDirectionToggle}
            onReorderSort={sorts.handleSortReorder}
            onResetSorts={sorts.handleSortReset}
          />

          {/* Feature 2: Filters */}
          <NotionFilterConfigPopover
            filters={filters.draftState}
            columnDefs={columnDefs}
            maxNestingDepth={filters.maxNestingDepth}
            hasUnsavedChanges={filters.hasUnsavedChanges}
            onMaxNestingDepthChange={filters.handleMaxNestingDepthChange}
            onAddFilter={filters.handleAddFilter}
            onRemoveFilter={filters.handleRemoveFilter}
            onToggleGroupOperator={filters.handleToggleGroupOperator}
            onAddGroup={filters.handleAddGroup}
            onAddFilterToGroup={filters.handleAddFilterToGroup}
            onAddGroupToPath={filters.handleAddGroupToPath}
            onUpdateFilter={filters.handleUpdateFilter}
            onDuplicateFilter={filters.handleDuplicateFilter}
            onApplyFilters={filters.handleApplyFilters}
            onResetFilters={filters.handleResetFilters}
          />
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="mb-4 text-red-600 text-sm">
          {error instanceof Error ? error.message : "Something went wrong"}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-4 text-hn-text-secondary text-sm">Loading...</div>
      )}

      {/* Feature 3: Table */}
      {!isLoading && columnDefs.length > 0 && flatData.length > 0 && (
        <>
          <NotionTable
            data={flatData}
            columnDefs={columnDefs}
            columnOrder={columnOrder.state}
            onColumnDragEnd={columnOrder.handleColumnDragEnd}
            columnSizing={columnSizing.state}
            onColumnSizingChange={columnSizing.setState}
            getPropertySortState={sorts.getPropertySortState}
            handleSortToggle={sorts.handleSortToggle}
          />

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
        notionKey &&
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
