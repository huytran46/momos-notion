import { Client } from "@notionhq/client"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

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

    // Get databaseId from query parameters
    const { searchParams } = new URL(request.url)
    const databaseId = searchParams.get("databaseId")

    if (!databaseId) {
      return NextResponse.json(
        { error: "databaseId is required" },
        { status: 400 }
      )
    }

    // Fetch specific database
    try {
      const result = await notion.databases.retrieve({
        database_id: databaseId,
      })
      return NextResponse.json(result, { status: 200 })
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

