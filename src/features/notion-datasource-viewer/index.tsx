"use client"

import { useInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import { NotionDatasourceForm } from "./components/notion-datasource-form"
import { NotionFilterConfigPopover } from "./components/notion-filter-config-popover"
import { NotionSortConfigPopover } from "./components/notion-sort-config-popover"
import { NotionTable } from "./components/notion-table"
import {
  notionDatasourceColumnDefOpts,
  notionDatasourceDataInfiniteOpts,
} from "./hooks/use-notion-datasource"
import { useNotionTableStates } from "./hooks/use-notion-table-states"

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
  } = useSuspenseQuery(notionDatasourceColumnDefOpts(datasourceId))

  const columnIds = useMemo(
    () =>
      schemaData.columnDefs.map((colDef) => {
        if (!colDef.id)
          throw new Error(`Column ID is required for column definition.`)
        return colDef.id
      }),
    [schemaData.columnDefs]
  )

  // Notion table states
  const { sorts, filters, columnOrder, columnSizing } = useNotionTableStates({
    columnIds,
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
      filter: filters.appliedState,
    })
  )

  const columnDefs = schemaData.columnDefs

  const flatData = useMemo(
    () => dataResponse?.pages.flatMap((page) => page.data) ?? [],
    [dataResponse?.pages]
  )

  const error = schemaError || dataError
  const isLoading = isSchemaLoading || (isDataLoading && !dataResponse)

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
    // Reset sorts and filters when datasource changes
    sorts.handleSortReset()
    filters.handleResetFilters()
  }

  return (
    <>
      {/* Form to select datasource */}
      <NotionDatasourceForm
        defaultDatasourceId={datasourceId}
        onSubmit={handleSubmit}
      />

      {/* Sort and Filter */}
      {!isSchemaLoading && columnDefs.length > 0 && (
        <div className="mb-4 flex gap-2">
          <NotionSortConfigPopover
            columnDefs={columnDefs}
            sorts={sorts.state}
            onAddSort={sorts.handleSortAdd}
            onRemoveSort={sorts.handleSortRemove}
            onDirectionToggleSort={sorts.handleSortDirectionToggle}
            onReorderSort={sorts.handleSortReorder}
            onResetSorts={sorts.handleSortReset}
          />
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
        <div className="mb-4 text-red-600 text-sm">Something went wrong</div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-4 text-hn-text-secondary text-sm">Loading...</div>
      )}

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
