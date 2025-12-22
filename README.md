# Momos - Notion datasource viewer

## Prerequisite
- node v22 (v22.21.1)
- pnpm v10.24.0
- Docker

## Tech stack
- Next.js
- TanStack Query and React Table

## Why Next.js?
We need server environment for using Notion's Javascript SDK. The server-side acts as an BFF layer between Notion and the client-side. Plus, Next.js also support dockerization via standalone output.

## What else?
- Apply verical virtualization in case the datasources is large (>= 1000 records)
- Persistent view's configs (filter, sort, column sizes, .etc) in local storage
- Optimistic updates

## Misc
- All deps' versions are exactly locked for reproduction.