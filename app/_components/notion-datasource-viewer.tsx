"use client"

import { useInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query"
import { Suspense, useMemo, useState } from "react"
import {
  type CompoundFilter,
  FilterRule,
  NotionFilterConfigPopover,
  useFilterState,
} from "@/features/notion-filters"
import {
  type NotionSort,
  NotionSortConfigPopover,
  useSortState,
} from "@/features/notion-sort"
import {
  NotionTable,
  useColumnOrderState,
  useColumnSizingState,
} from "@/features/notion-table"
import {
  notionDatasourceColumnDefOpts,
  notionDatasourceDataInfiniteOpts,
} from "../_hooks/use-notion-datasource"
import { NotionDatasourceForm } from "./notion-datasource-form"

function NotionDatasourceLoader({
  datasourceId,
  notionKey,
  sorts,
  onAddSort,
  onRemoveSort,
  onDirectionToggleSort,
  onReorderSort,
  onResetSorts,
  getPropertySortState,
  handleSortToggle,
  filtersApplied,
  filtersDraft,
  maxNestingDepth,
  hasUnsavedChanges,
  onMaxNestingDepthChange,
  onAddFilter,
  onRemoveFilter,
  onToggleGroupOperator,
  onAddGroup,
  onAddFilterToGroup,
  onAddGroupToPath,
  onUpdateFilter,
  onDuplicateFilter,
  onApplyFilters,
  onResetFilters,
}: {
  datasourceId: string
  notionKey: string
  // sorts
  sorts: NotionSort[]
  onAddSort: (property: string) => void
  onRemoveSort: (index: number) => void
  onDirectionToggleSort: (index: number) => void
  onReorderSort: (startIndex: number, endIndex: number) => void
  onResetSorts: () => void
  getPropertySortState: (property: string) => NotionSort | undefined
  handleSortToggle: (property: string) => void
  // filters
  filtersApplied: CompoundFilter
  filtersDraft: CompoundFilter
  maxNestingDepth: number
  hasUnsavedChanges: boolean
  onMaxNestingDepthChange: (depth: number) => void
  onAddFilter: (rule: FilterRule) => void
  onRemoveFilter: (path: number[]) => void
  onToggleGroupOperator: (path: number[]) => void
  onAddGroup: (operator: "and" | "or") => void
  onAddFilterToGroup: (path: number[], rule: FilterRule) => void
  onAddGroupToPath: (path: number[], operator: "and" | "or") => void
  onUpdateFilter: (path: number[], updates: Partial<FilterRule>) => void
  onDuplicateFilter: (path: number[]) => void
  onApplyFilters: () => void
  onResetFilters: () => void
}) {
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

  const { columnOrder, handleColumnDragEnd } = useColumnOrderState({
    defaultColumnOrder: columnIds,
  })

  const { columnSizing, setColumnSizing } = useColumnSizingState()

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
      sorts,
      filter: filtersApplied,
    })
  )

  const flatData = useMemo(
    () => dataResponse?.pages.flatMap((page) => page.data) ?? [],
    [dataResponse?.pages]
  )

  const handleLoadMore = () => {
    if (hasNextPage) {
      fetchNextPage()
    }
  }

  const error = schemaError || dataError
  const isLoading = isSchemaLoading || (isDataLoading && !dataResponse)

  return (
    <>
      {!isSchemaLoading && columnDefs.length > 0 && (
        <div className="mb-4 flex gap-2">
          {/* Feature 1: Sort */}
          <NotionSortConfigPopover
            columnDefs={columnDefs}
            sorts={sorts}
            onAddSort={onAddSort}
            onRemoveSort={onRemoveSort}
            onDirectionToggleSort={onDirectionToggleSort}
            onReorderSort={onReorderSort}
            onResetSorts={onResetSorts}
          />

          {/* Feature 2: Filters */}
          <NotionFilterConfigPopover
            columnDefs={columnDefs}
            filters={filtersDraft}
            maxNestingDepth={maxNestingDepth}
            hasUnsavedChanges={hasUnsavedChanges}
            onMaxNestingDepthChange={onMaxNestingDepthChange}
            onAddFilter={onAddFilter}
            onRemoveFilter={onRemoveFilter}
            onToggleGroupOperator={onToggleGroupOperator}
            onAddGroup={onAddGroup}
            onAddFilterToGroup={onAddFilterToGroup}
            onAddGroupToPath={onAddGroupToPath}
            onUpdateFilter={onUpdateFilter}
            onDuplicateFilter={onDuplicateFilter}
            onApplyFilters={onApplyFilters}
            onResetFilters={onResetFilters}
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
            columnOrder={columnOrder}
            onColumnDragEnd={handleColumnDragEnd}
            columnSizing={columnSizing}
            onColumnSizingChange={setColumnSizing}
            getPropertySortState={getPropertySortState}
            handleSortToggle={handleSortToggle}
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

const DEFAULT_COMPOUND_FILTER_MAX_NESTING_DEPTH = 2

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

  const sorts = useSortState()

  const filters = useFilterState({
    defaultMaxNestingDepth: DEFAULT_COMPOUND_FILTER_MAX_NESTING_DEPTH,
  })

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

      <div className="mt-2 text-xs text-hn-text-secondary">
        Currently, we only support these property types:{" "}
        <span className="ml-1 inline-flex flex-wrap gap-1">
          <span className="rounded border border-red-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-red-500">
            checkbox
          </span>
          <span className="rounded border border-red-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-red-500">
            date
          </span>
          <span className="rounded border border-red-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-red-500">
            multi_select
          </span>
          <span className="rounded border border-red-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-red-500">
            number
          </span>
          <span className="rounded border border-red-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-red-500">
            rich_text
          </span>
          <span className="rounded border border-red-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-red-500">
            select
          </span>
          <span className="rounded border border-red-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-red-500">
            timestamp
          </span>
          <span className="rounded border border-red-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-red-500">
            status
          </span>
        </span>
        .
      </div>

      <hr className="my-4 border-hn-border" />

      <Suspense
        fallback={
          <div className="text-hn-text-secondary text-sm">
            Loading Notion&apos;s datasource...
          </div>
        }
      >
        {datasourceId && notionKey ? (
          <NotionDatasourceLoader
            datasourceId={datasourceId}
            notionKey={notionKey}
            // sorts
            sorts={sorts.sorts}
            onAddSort={sorts.handleSortAdd}
            onRemoveSort={sorts.handleSortRemove}
            onDirectionToggleSort={sorts.handleSortDirectionToggle}
            onReorderSort={sorts.handleSortReorder}
            onResetSorts={sorts.handleSortReset}
            getPropertySortState={sorts.getPropertySortState}
            handleSortToggle={sorts.handleSortToggle}
            // filters
            filtersApplied={filters.appliedFilters}
            filtersDraft={filters.draftFilters}
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
        ) : (
          <div className="text-hn-text-secondary text-sm">
            Please enter a valid Notion integration key and datasource ID.
          </div>
        )}
      </Suspense>
    </>
  )
}
