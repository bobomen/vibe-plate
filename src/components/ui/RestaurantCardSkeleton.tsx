import { Card } from './card';
import { Skeleton } from './skeleton';

export const RestaurantCardSkeleton = () => {
  return (
    <Card className="relative w-full bg-card border-0 shadow-2xl overflow-hidden">
      {/* Image skeleton */}
      <div className="relative h-96">
        <Skeleton className="w-full h-full" />
        
        {/* Photo navigation skeleton */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2">
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        
        {/* Photo indicators skeleton */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="w-2 h-2 rounded-full" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4 bg-white/20" />
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Skeleton className="w-4 h-4 bg-white/20" />
              <Skeleton className="h-4 w-8 bg-white/20" />
              <Skeleton className="h-4 w-16 bg-white/20" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="w-4 h-4 bg-white/20" />
              <Skeleton className="h-4 w-12 bg-white/20" />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full bg-white/20" />
            <Skeleton className="h-6 w-12 rounded-full bg-white/20" />
          </div>
          
          <Skeleton className="h-4 w-full bg-white/20" />
        </div>
      </div>
    </Card>
  );
};