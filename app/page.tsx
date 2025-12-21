import { Suspense } from "react"
import { NotionDatasourceViewer } from "@/features/notion-datasource-viewer"

type PageProps = {
  searchParams: Promise<{ datasourceId?: string; error?: string }>
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams

  const { datasourceId } = params

  return (
    <div className="flex flex-col min-h-screen w-full bg-hn-bg font-sans">
      <header className="bg-hn-orange py-1 px-2">
        <h1 className="text-hn-text font-medium">Notion datasource viewer</h1>
      </header>
      <main className="flex flex-col bg-hn-bg font-sans">
        <div className="w-full max-w-7xl mx-auto py-4 px-2">
          <Suspense
            fallback={
              <div className="text-hn-text-secondary text-sm">
                Loading datasource schema...
              </div>
            }
          >
            <NotionDatasourceViewer defaultDatasourceId={datasourceId} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
