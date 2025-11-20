import { AlertCircle, CheckCircle2, Loader2, RotateCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { UploadTask } from '@/hooks/useBatchPhotoUpload';
import { cn } from '@/lib/utils';

interface PhotoUploadProgressProps {
  tasks: UploadTask[];
  onRetry: (taskId: string) => void;
  onCancel: (taskId: string) => void;
  onClearCompleted: () => void;
}

export function PhotoUploadProgress({
  tasks,
  onRetry,
  onCancel,
  onClearCompleted,
}: PhotoUploadProgressProps) {
  if (tasks.length === 0) return null;

  const completedTasks = tasks.filter(t => t.status === 'success' || t.status === 'error');
  const canClearCompleted = completedTasks.length > 0;

  return (
    <Card className="mt-4">
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">
            上傳進度 ({tasks.filter(t => t.status === 'success').length}/{tasks.length})
          </h3>
          {canClearCompleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCompleted}
              className="h-8 text-xs"
            >
              清除已完成
            </Button>
          )}
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onRetry={onRetry}
              onCancel={onCancel}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface TaskItemProps {
  task: UploadTask;
  onRetry: (taskId: string) => void;
  onCancel: (taskId: string) => void;
}

function TaskItem({ task, onRetry, onCancel }: TaskItemProps) {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case 'success':
        return '上傳成功';
      case 'error':
        return task.error || '上傳失敗';
      case 'uploading':
        return `上傳中 ${task.progress}%`;
      case 'pending':
        return '等待上傳';
    }
  };

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border',
      task.status === 'error' && 'bg-destructive/5 border-destructive/20',
      task.status === 'success' && 'bg-success/5 border-success/20'
    )}>
      {/* 狀態圖標 */}
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {task.file.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <p className={cn(
            'text-xs',
            task.status === 'error' && 'text-destructive',
            task.status === 'success' && 'text-success',
            (task.status === 'pending' || task.status === 'uploading') && 'text-muted-foreground'
          )}>
            {getStatusText()}
          </p>
          <span className="text-xs text-muted-foreground">
            ({(task.file.size / 1024 / 1024).toFixed(2)} MB)
          </span>
        </div>

        {/* 進度條（僅上傳中顯示） */}
        {task.status === 'uploading' && (
          <Progress value={task.progress} className="h-1 mt-2" />
        )}
      </div>

      {/* 操作按鈕 */}
      <div className="flex-shrink-0 flex items-center gap-1">
        {task.status === 'error' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRetry(task.id)}
            className="h-8 w-8 p-0"
            title="重試"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        )}
        {(task.status === 'pending' || task.status === 'error') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel(task.id)}
            className="h-8 w-8 p-0"
            title="取消"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
