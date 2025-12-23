import { Client } from "@notionhq/client"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { notionPropsToColumnDefs } from "@/utils/notion-data-parser"

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
    const datasourceId = request.nextUrl.pathname.split("/").pop()
    if (!datasourceId) {
      return NextResponse.json(
        { error: "datasourceId is required" },
        { status: 400 }
      )
    }

    try {
      // Get database schema
      const schemaResponse = await notion.dataSources.retrieve({
        data_source_id: datasourceId,
      })

      // Generate columnDefs from schema - handle all property types
      const columnDefs = notionPropsToColumnDefs(schemaResponse.properties)

      return NextResponse.json({ columnDefs }, { status: 200 })
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: `Failed to retrieve schema: ${error.message}` },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: "Failed to retrieve schema" },
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
