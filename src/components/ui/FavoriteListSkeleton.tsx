import { Card, CardContent } from './card';
import { Skeleton } from './skeleton';

export const FavoriteListSkeleton = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="w-32 h-10" />
        </div>

        {/* List skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="w-24 h-24 flex-shrink-0">
                    <Skeleton className="w-full h-full" />
                  </div>
                  
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-6 w-3/4 mb-1" />
                        
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-1">
                            <Skeleton className="w-4 h-4" />
                            <Skeleton className="w-8 h-4" />
                            <Skeleton className="w-12 h-4" />
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Skeleton className="w-4 h-4" />
                            <Skeleton className="w-12 h-4" />
                          </div>
                        </div>

                        <div className="flex gap-2 mb-2">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-5 w-12 rounded-full" />
                        </div>
                      </div>

                      <Skeleton className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};