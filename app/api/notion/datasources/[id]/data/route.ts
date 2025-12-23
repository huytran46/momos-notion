import { Client } from "@notionhq/client"
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import type { CompoundFilter } from "@/features/notion-filters/types/notion-filters"
import {
  convertToNotionApiFormat,
  validateNotionFilter,
} from "@/features/notion-filters/utils/notion-filter-api"
import { notionPageResultsToRowData } from "@/utils/notion-data-parser"

type NotionSort =
  | {
      property: string
      direction: "ascending" | "descending"
    }
  | {
      timestamp: "created_time" | "last_edited_time"
      direction: "ascending" | "descending"
    }

export async function GET(request: NextRequest) {
  try {
    const requestNotionKey = request.headers.get("x-notion-key") || undefined
    const notionKey = requestNotionKey || process.env.NOTION_KEY
    if (!notionKey) {
      return NextResponse.json(
        { error: "Notion key is required" },
        { status: 400 }
      )
    }

    // Initialize Notion client
    const notion = new Client({
      auth: notionKey,
    })

    // Get datasourceId from path parameter
    const datasourceId = request.nextUrl.pathname.split("/").slice(0, -1).pop()
    if (!datasourceId) {
      return NextResponse.json(
        { error: "datasourceId is required" },
        { status: 400 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get("cursor") || undefined
    const pageSizeParam = searchParams.get("pageSize")
    const pageSize = pageSizeParam ? Number.parseInt(pageSizeParam, 10) : 50

    let clientFilter: CompoundFilter | undefined

    const filterParam = searchParams.get("filter")
    if (filterParam) {
      try {
        clientFilter = JSON.parse(filterParam) as CompoundFilter
      } catch {
        return NextResponse.json(
          { error: "Invalid filter parameter" },
          { status: 400 }
        )
      }
    }

    // Convert client filter to Notion API format
    let notionFilter: Record<string, unknown> | undefined
    if (clientFilter) {
      try {
        notionFilter = convertToNotionApiFormat(clientFilter)

        // Validate the converted filter
        if (notionFilter) {
          const validation = validateNotionFilter(notionFilter)
          if (!validation.valid) {
            return NextResponse.json(
              { error: `Invalid filter: ${validation.error}` },
              { status: 400 }
            )
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          return NextResponse.json(
            { error: `Filter conversion failed: ${error.message}` },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: "Filter conversion failed" },
          { status: 400 }
        )
      }
    }

    let sorts: NotionSort[] | undefined
    const sortsParam = searchParams.get("sorts")
    if (sortsParam) {
      try {
        sorts = JSON.parse(sortsParam) as NotionSort[]
      } catch {
        return NextResponse.json(
          { error: "Invalid sorts parameter" },
          { status: 400 }
        )
      }
    }

    try {
      type NotionDatasourceQueryParams = Parameters<
        typeof notion.dataSources.query
      >[0]

      // Query datasource with optional parameters
      const queryResponse = await notion.dataSources.query({
        data_source_id: datasourceId,
        page_size: pageSize,
        // start_cursor: cursor,
        // filter: notionFilter as NotionDatasourceQueryParams["filter"],
        // sorts: sorts as NotionDatasourceQueryParams["sorts"],
        ...(cursor && { start_cursor: cursor }),
        ...(notionFilter && {
          filter: notionFilter as Parameters<
            typeof notion.dataSources.query
          >[0]["filter"],
        }),
        ...(sorts && {
          sorts: sorts as Parameters<
            typeof notion.dataSources.query
          >[0]["sorts"],
        }),
      })

      // Filter query results to only include pages (exclude data sources)
      const pageResults = queryResponse.results.filter(
        (result) => result.object === "page"
      ) as Array<PageObjectResponse | PartialPageObjectResponse>

      // Parse and transform page properties to flat data objects
      const data = notionPageResultsToRowData(pageResults)

      return NextResponse.json(
        {
          data,
          next_cursor: queryResponse.next_cursor,
          has_more: queryResponse.has_more,
        },
        { status: 200 }
      )
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: `Failed to retrieve data: ${error.message}` },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: "Failed to retrieve data" },
        { status: 400 }
      )
    }
  } catch (error) {
    // Handle unexpected errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Internal server error: ${error.message}` },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
