import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PhotoUploadZoneProps {
  onUpload?: (file: File) => Promise<void>;
  onBatchUpload?: (files: File[]) => void;
  currentPhotoCount: number;
  maxPhotos?: number;
  isUploading?: boolean;
  batchMode?: boolean;
}

export function PhotoUploadZone({
  onUpload,
  onBatchUpload,
  currentPhotoCount,
  maxPhotos = 15,
  isUploading = false,
  batchMode = false,
}: PhotoUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (currentPhotoCount + files.length > maxPhotos) {
      toast.error(`最多只能上傳 ${maxPhotos} 張照片`);
      return;
    }

    if (batchMode && onBatchUpload) {
      // 批量上傳模式
      onBatchUpload(files);
    } else if (onUpload) {
      // 單個上傳模式（向後兼容）
      for (const file of files) {
        await onUpload(file);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => 
      file.type.startsWith('image/')
    );

    if (currentPhotoCount + files.length > maxPhotos) {
      toast.error(`最多只能上傳 ${maxPhotos} 張照片`);
      return;
    }

    if (batchMode && onBatchUpload) {
      // 批量上傳模式
      onBatchUpload(files);
    } else if (onUpload) {
      // 單個上傳模式（向後兼容）
      for (const file of files) {
        await onUpload(file);
      }
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isDisabled = currentPhotoCount >= maxPhotos || isUploading;

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        if (!isDisabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        isDragging && !isDisabled
          ? 'border-primary bg-primary/10'
          : 'border-muted hover:border-muted-foreground/50',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <div className="space-y-2">
        <p className="text-sm font-medium">
          {isUploading ? '上傳中...' : batchMode ? '拖拽多張照片至此，或點擊批量上傳' : '拖拽照片至此，或點擊上傳'}
        </p>
        <p className="text-xs text-muted-foreground">
          已上傳 {currentPhotoCount} / {maxPhotos} 張
        </p>
        <p className="text-xs text-muted-foreground">
          支援 JPG、PNG、WEBP 格式，單張最大 5MB{batchMode ? '，尺寸至少 800x600 像素' : ''}
        </p>
        {batchMode && (
          <p className="text-xs text-primary font-medium">
            ✨ 批量上傳模式：可同時上傳多張照片，最多 3 個並發
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        disabled={isDisabled}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        disabled={isDisabled}
        onClick={() => fileInputRef.current?.click()}
      >
        選擇檔案
      </Button>
    </div>
  );
}
