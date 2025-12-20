import { queryOptions } from "@tanstack/react-query"

export function notionDatabaseQueryOpts(databaseId: string) {
  return queryOptions({
    queryKey: ["notion-database", databaseId],
    queryFn: async () => {
      const response = await fetch(
        `/api/notion/datasources?databaseId=${encodeURIComponent(databaseId)}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch database")
      }

      return response.json()
    },
    enabled: !!databaseId,
  })
}

