"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"

type MockUser = {
  id: number
  name: string
  email: string
  role: string
  status: string
}

const mockData: MockUser[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "Admin",
    status: "Active",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    role: "User",
    status: "Active",
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "User",
    status: "Inactive",
  },
  {
    id: 4,
    name: "Alice Williams",
    email: "alice@example.com",
    role: "Editor",
    status: "Active",
  },
  {
    id: 5,
    name: "Charlie Brown",
    email: "charlie@example.com",
    role: "User",
    status: "Active",
  },
  {
    id: 6,
    name: "Diana Prince",
    email: "diana@example.com",
    role: "Admin",
    status: "Active",
  },
  {
    id: 7,
    name: "Eve Davis",
    email: "eve@example.com",
    role: "User",
    status: "Inactive",
  },
  {
    id: 8,
    name: "Frank Miller",
    email: "frank@example.com",
    role: "Editor",
    status: "Active",
  },
  {
    id: 9,
    name: "Grace Lee",
    email: "grace@example.com",
    role: "User",
    status: "Active",
  },
  {
    id: 10,
    name: "Henry Wilson",
    email: "henry@example.com",
    role: "User",
    status: "Active",
  },
]

const columns: ColumnDef<MockUser>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
]

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-hn-bg font-sans">
      <nav className="bg-hn-orange p-1">
        <h1 className="text-hn-text">Notion database viewer</h1>
      </nav>
      <div className="w-full max-w-7xl mx-auto p-8">
        <DataTable columnDefs={columns} data={mockData} />
      </div>
    </main>
  )
}
