import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function SuperAdminSettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 bg-slate-700" />
          <Skeleton className="h-4 w-64 mt-2 bg-slate-700" />
        </div>
        <Skeleton className="h-10 w-32 bg-slate-700" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-full bg-slate-700" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-slate-700" />
              <Skeleton className="h-4 w-64 bg-slate-700" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-full bg-slate-700" />
              <Skeleton className="h-12 w-full bg-slate-700" />
              <Skeleton className="h-12 w-full bg-slate-700" />
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-slate-700" />
              <Skeleton className="h-4 w-64 bg-slate-700" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-full bg-slate-700" />
              <Skeleton className="h-8 w-full bg-slate-700" />
              <Skeleton className="h-8 w-full bg-slate-700" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
