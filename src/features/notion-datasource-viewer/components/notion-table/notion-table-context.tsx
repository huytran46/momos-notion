"use client"

import type { ColumnOrderState } from "@tanstack/react-table"
import { createContext, useContext } from "react"
import type { NotionSort } from "@/features/notion-datasource-viewer/hooks/use-notion-datasource"

type NotionTableContextValue = {
  sorts: {
    getPropertySortState: (property: string) => NotionSort | undefined
    handleSortToggle: (property: string) => void
  }
  columnOrder: {
    state: ColumnOrderState
  }
}

const NotionTableContext = createContext<NotionTableContextValue | null>(null)

export function NotionTableProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: NotionTableContextValue
}) {
  return (
    <NotionTableContext.Provider value={value}>
      {children}
    </NotionTableContext.Provider>
  )
}

export function useNotionTable(): NotionTableContextValue {
  const context = useContext(NotionTableContext)
  if (!context) {
    throw new Error("useNotionTable must be used within a NotionTableProvider")
  }
  return context
}
