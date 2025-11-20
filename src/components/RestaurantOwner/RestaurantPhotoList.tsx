import { X, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RestaurantPhoto {
  id: string;
  photo_url: string;
  status: 'pending' | 'active' | 'rejected';
  uploaded_at: string;
  approved_at: string | null;
}

interface RestaurantPhotoListProps {
  photos: RestaurantPhoto[];
  onDelete: (photoId: string) => Promise<void>;
}

export function RestaurantPhotoList({ photos, onDelete }: RestaurantPhotoListProps) {
  const activePhotos = photos.filter(p => p.status === 'active');
  const pendingPhotos = photos.filter(p => p.status === 'pending');

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>尚未上傳任何照片</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending 照片 */}
      {pendingPhotos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-lg">審核中</h3>
            <Badge variant="outline" className="ml-2">
              {pendingPhotos.length} 張
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            照片將在上傳後 24 小時自動發布
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pendingPhotos.map(photo => (
              <div key={photo.id} className="relative group aspect-square">
                <img
                  src={photo.photo_url}
                  alt="審核中"
                  className="w-full h-full object-cover rounded-lg opacity-60"
                />
                <Badge
                  variant="secondary"
                  className="absolute top-2 left-2 bg-yellow-100 text-yellow-800"
                >
                  審核中
                </Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>確認刪除照片？</AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作無法復原，照片將永久刪除。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(photo.id)}>
                        確認刪除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active 照片 */}
      {activePhotos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-lg">已發布照片</h3>
            <Badge variant="outline" className="ml-2">
              {activePhotos.length} 張
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activePhotos.map(photo => (
              <div key={photo.id} className="relative group aspect-square">
                <img
                  src={photo.photo_url}
                  alt="餐廳照片"
                  className="w-full h-full object-cover rounded-lg"
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>確認刪除照片？</AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作無法復原，照片將永久刪除且從用戶端消失。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(photo.id)}>
                        確認刪除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
