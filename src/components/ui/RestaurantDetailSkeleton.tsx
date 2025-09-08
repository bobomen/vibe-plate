import { Card } from './card';
import { Skeleton } from './skeleton';

export const RestaurantDetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>

      {/* Photo skeleton */}
      <div className="relative">
        <div className="aspect-[4/3]">
          <Skeleton className="w-full h-full" />
        </div>
        
        {/* Photo indicators skeleton */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="w-3 h-3 rounded-full" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-6 space-y-6">
        {/* Title & Rating skeleton */}
        <div>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>

        {/* Address skeleton */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="w-5 h-5 mt-0.5" />
            <div className="flex-1">
              <Skeleton className="h-5 w-16 mb-1" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </Card>

        {/* Business Hours skeleton */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="w-5 h-5 mt-0.5" />
            <div className="flex-1">
              <Skeleton className="h-5 w-20 mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </Card>

        {/* Photos Grid skeleton */}
        <div>
          <Skeleton className="h-5 w-16 mb-3" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Actions skeleton */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        <Skeleton className="w-full h-10 rounded-md" />
      </div>
    </div>
  );
};