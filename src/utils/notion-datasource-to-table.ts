import type {
  DataSourceObjectResponse,
  PageObjectResponse,
  PartialPageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import type { ColumnDef } from "@tanstack/react-table"
import {
  parseCheckbox,
  parseDate,
  parseMultiSelect,
  parseNumber,
  parseRichText,
  parseSelect,
  parseStatus,
  parseTimestamp,
} from "./parse-notion-property"

type QueryDataSourcesResponse = {
  results: Array<PageObjectResponse | PartialPageObjectResponse>
  next_cursor: string | null
  has_more: boolean
}

/**
 * Parses a single property from a Notion page property
 * Routes to the appropriate parser based on property type
 */
function parseDataSourceProperty(
  property: unknown
): string | number | boolean | null {
  if (!property || typeof property !== "object") {
    return null
  }

  const prop = property as { type: string; [key: string]: unknown }

  switch (prop.type) {
    case "checkbox":
      return parseCheckbox(prop as { type: "checkbox"; checkbox: boolean })
    case "date":
      return parseDate(
        prop as {
          type: "date"
          date: { start: string; end?: string | null } | null
        }
      )
    case "multi_select":
      return parseMultiSelect(
        prop as {
          type: "multi_select"
          multi_select: Array<{ name: string }>
        }
      )
    case "number":
      return parseNumber(prop as { type: "number"; number: number | null })
    case "rich_text":
      return parseRichText(
        prop as {
          type: "rich_text"
          rich_text: Array<{ plain_text: string }>
        }
      )
    case "select":
      return parseSelect(
        prop as { type: "select"; select: { name: string } | null }
      )
    case "created_time":
    case "last_edited_time":
      return parseTimestamp(
        prop as
          | { type: "created_time"; created_time: string }
          | { type: "last_edited_time"; last_edited_time: string }
      )
    case "status":
      return parseStatus(
        prop as { type: "status"; status: { name: string } | null }
      )
    default:
      return null
  }
}

/**
 * Converts Notion data source response to TanStack Table format
 * @param schema - Data source schema from dataSources.retrieve()
 * @param queryResponse - Query results from dataSources.query()
 * @returns Object with columnDefs and data for TanStack Table
 */
export function datasourceToTable(
  schema: DataSourceObjectResponse,
  queryResponse: QueryDataSourcesResponse
): {
  columnDefs: ColumnDef<Record<string, unknown>>[]
  data: Record<string, unknown>[]
} {
  // Extract column definitions from schema properties
  const columnDefs: ColumnDef<Record<string, unknown>>[] = Object.entries(
    schema.properties
  ).map(([key, property]) => ({
    accessorKey: key,
    header: property.name,
  }))

  // Transform query results into flat objects
  const data: Record<string, unknown>[] = queryResponse.results.map((page) => {
    const rowData: Record<string, unknown> = {}

    // Only process PageObjectResponse (full pages), skip partial responses
    if (page.object === "page" && "properties" in page) {
      Object.entries(page.properties).forEach(([key, property]) => {
        const value = parseDataSourceProperty(property)
        rowData[key] = value
      })
    }

    return rowData
  })

  return { columnDefs, data }
}
