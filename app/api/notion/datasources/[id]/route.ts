import { Client } from "@notionhq/client"
import type { DataSourceObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { datasourceToTable } from "@/utils/notion-datasource-to-table"

export async function GET(request: NextRequest) {
  try {
    // Check for NOTION_KEY environment variable
    const notionKey = process.env.NOTION_KEY
    if (!notionKey) {
      return NextResponse.json(
        { error: "NOTION_KEY environment variable is not set" },
        { status: 500 }
      )
    }

    // Initialize Notion client
    const notion = new Client({
      auth: notionKey,
    })

    // Get datasourceId from query parameters
    const datasourceId = request.nextUrl.pathname.split("/").pop()
    // const { searchParams } = new URL(request.url)
    // const datasourceId = searchParams.get("datasourceId")
    if (!datasourceId) {
      return NextResponse.json(
        { error: "datasourceId is required" },
        { status: 400 }
      )
    }

    try {
      // Get database schema
      const [schemaResponse, queryResponse] = await Promise.all([
        notion.dataSources.retrieve({
          data_source_id: datasourceId,
        }),
        notion.dataSources.query({
          data_source_id: datasourceId,
        }),
      ])

      // Support the property types checkbox, date, multi_select, number, rich_text, select, timestamp, status
      const supportedTypes = [
        "checkbox",
        "date",
        "multi_select",
        "number",
        "rich_text",
        "select",
        "timestamp",
        "status",
      ]

      // Filter schema to only include supported property types
      const filteredSchema: DataSourceObjectResponse = {
        ...schemaResponse,
        properties: Object.fromEntries(
          Object.entries(schemaResponse.properties).filter(([, property]) =>
            supportedTypes.includes(property.type)
          )
        ),
      } as DataSourceObjectResponse

      // Filter query results to only include pages (exclude data sources)
      const pageResults = queryResponse.results.filter(
        (result) => result.object === "page"
      ) as Array<
        | import("@notionhq/client/build/src/api-endpoints").PageObjectResponse
        | import("@notionhq/client/build/src/api-endpoints").PartialPageObjectResponse
      >

      // Transform data source response to table format
      const { columnDefs, data } = datasourceToTable(filteredSchema, {
        ...queryResponse,
        results: pageResults,
      })

      return NextResponse.json({ columnDefs, data }, { status: 200 })
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: `Failed to retrieve database: ${error.message}` },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: "Failed to retrieve database" },
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
