import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Clock, CheckCircle2, XCircle } from 'lucide-react';
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
  display_order: number;
  ai_review_result?: {
    approved: boolean;
    category: string;
    reason: string;
    confidence?: number;
  };
}

interface SortablePhotoItemProps {
  photo: RestaurantPhoto;
  onDelete: (photoId: string) => Promise<void>;
}

function SortablePhotoItem({ photo, onDelete }: SortablePhotoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusBadge = () => {
    if (photo.status === 'pending') {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          審核中
        </Badge>
      );
    }
    if (photo.status === 'rejected') {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          未通過
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        已發布
      </Badge>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square"
    >
      <img
        src={photo.photo_url}
        alt="餐廳照片"
        className={`w-full h-full object-cover rounded-lg ${
          photo.status === 'pending' ? 'opacity-60' : ''
        }`}
      />
      
      {/* 狀態標籤 */}
      <div className="absolute top-2 left-2">
        {getStatusBadge()}
      </div>

      {/* 拖拽手柄 */}
      {photo.status === 'active' && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 cursor-move bg-background/80 rounded-full p-1.5 hover:bg-background transition-colors"
        >
          <GripVertical className="h-4 w-4 text-foreground" />
        </div>
      )}

      {/* 刪除按鈕 - 始終可見 */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 shadow-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除照片？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原，照片將永久刪除
              {photo.status === 'active' && '且從用戶端消失'}。
              {photo.ai_review_result && (
                <div className="mt-2 text-sm">
                  <div className="font-medium">AI 審核結果：</div>
                  <div>分類：{photo.ai_review_result.category}</div>
                  <div>原因：{photo.ai_review_result.reason}</div>
                </div>
              )}
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

      {/* AI 審核原因（被拒絕時） */}
      {photo.status === 'rejected' && photo.ai_review_result && (
        <div className="absolute bottom-2 left-2 right-12 bg-red-900/90 text-white text-xs p-2 rounded">
          <div className="font-medium">拒絕原因：</div>
          <div>{photo.ai_review_result.reason}</div>
        </div>
      )}
    </div>
  );
}

interface SortablePhotoGridProps {
  photos: RestaurantPhoto[];
  onDelete: (photoId: string) => Promise<void>;
  onReorder: (photoIds: string[]) => Promise<void>;
}

export function SortablePhotoGrid({ photos, onDelete, onReorder }: SortablePhotoGridProps) {
  const [items, setItems] = useState(photos);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 當 photos 改變時同步更新 items
  useEffect(() => {
    setItems(photos);
  }, [photos]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // 更新後端排序
      await onReorder(newItems.map(item => item.id));
    }
  };

  const activePhotos = items.filter(p => p.status === 'active');
  const pendingPhotos = items.filter(p => p.status === 'pending');
  const rejectedPhotos = items.filter(p => p.status === 'rejected');

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>尚未上傳任何照片</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 已發布照片 - 可排序 */}
      {activePhotos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-lg">已發布照片</h3>
            <Badge variant="outline" className="ml-2">
              {activePhotos.length} 張
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            可拖拽調整照片順序（用戶會按此順序看到照片）
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activePhotos.map(p => p.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {activePhotos.map((photo) => (
                  <SortablePhotoItem
                    key={photo.id}
                    photo={photo}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* 審核中照片 */}
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
            AI 正在審核照片，通常在數秒內完成
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pendingPhotos.map((photo) => (
              <SortablePhotoItem
                key={photo.id}
                photo={photo}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* 被拒絕照片 */}
      {rejectedPhotos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-lg">審核未通過</h3>
            <Badge variant="outline" className="ml-2">
              {rejectedPhotos.length} 張
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            這些照片未通過 AI 審核，請查看原因後重新上傳
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rejectedPhotos.map((photo) => (
              <SortablePhotoItem
                key={photo.id}
                photo={photo}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
