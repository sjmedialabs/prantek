"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Column<T> = {
  key: string
  header: string
  cell?: (row: T) => React.ReactNode
  className?: string
}

type ResponsiveTableProps<T> = {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string
  /** On mobile, card title is the first column or this render */
  mobileCardTitle?: (row: T) => React.ReactNode
  className?: string
  /** Optional: render row as link (e.g. to detail page) */
  getRowHref?: (row: T) => string | undefined
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  mobileCardTitle,
  className,
  getRowHref,
}: ResponsiveTableProps<T>) {
  const router = useRouter()
  return (
    <>
      {/* Desktop: table */}
      <div className={cn("hidden md:block w-full overflow-x-auto rounded-lg border bg-card", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const key = keyExtractor(row)
              const href = getRowHref?.(row)
              const content = (
                <>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.cell
                        ? col.cell(row)
                        : String((row[col.key] as React.ReactNode) ?? "")}
                    </TableCell>
                  ))}
                </>
              )
              return (
                <TableRow
                  key={key}
                  className={href ? "cursor-pointer hover:bg-muted/50" : undefined}
                  onClick={href ? () => router.push(href) : undefined}
                >
                  {content}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {data.map((row) => {
          const key = keyExtractor(row)
          const href = getRowHref?.(row)
          const title = mobileCardTitle
            ? mobileCardTitle(row)
            : columns[0]
            ? (columns[0].cell
                ? columns[0].cell(row)
                : String((row[columns[0].key] as React.ReactNode) ?? ""))
            : key
          const cardContent = (
            <div className="rounded-lg border bg-card p-4 shadow-sm space-y-2">
              <div className="font-medium text-foreground">{title}</div>
              <dl className="grid grid-cols-1 gap-x-2 gap-y-1 text-sm">
                {columns.slice(mobileCardTitle ? 0 : 1).map((col) => (
                  <div key={col.key} className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{col.header}</dt>
                    <dd className="text-right font-medium">
                      {col.cell
                        ? col.cell(row)
                        : String((row[col.key] as React.ReactNode) ?? "")}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )
          if (href) {
            return (
              <a key={key} href={href} className="block min-h-[48px] active:opacity-90">
                {cardContent}
              </a>
            )
          }
          return <div key={key}>{cardContent}</div>
        })}
      </div>
    </>
  )
}
