import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-6">
        <Skeleton className="h-12 w-1/2 mx-auto" />
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
