import { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContextualTipProps {
  message: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  onClose?: () => void;
}

export const ContextualTip = ({ 
  message, 
  direction = 'down', 
  duration = 3000,
  onClose 
}: ContextualTipProps) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getArrowClass = () => {
    switch (direction) {
      case 'up':
        return 'bottom-full mb-2 animate-bounce';
      case 'down':
        return 'top-full mt-2 animate-bounce';
      case 'left':
        return 'right-full mr-2';
      case 'right':
        return 'left-full ml-2';
      default:
        return 'top-full mt-2 animate-bounce';
    }
  };

  const getArrowEmoji = () => {
    switch (direction) {
      case 'up':
        return '☝️';
      case 'down':
        return '👇';
      case 'left':
        return '👈';
      case 'right':
        return '👉';
      default:
        return '👇';
    }
  };

  const tipContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-300"
      onClick={(e) => {
        // 只在點擊背景時關閉，不干擾其他 UI 元素
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Card className="max-w-sm mx-4 p-6 text-center animate-in zoom-in-95 duration-300 shadow-xl">
          <div className="space-y-4">
            {/* 動畫箭頭 */}
            <div className={`text-4xl ${direction === 'down' || direction === 'up' ? 'animate-bounce' : ''}`}>
              {getArrowEmoji()}
            </div>
            
            {/* 提示訊息 */}
            <p className="text-base font-medium">{message}</p>

            {/* 關閉按鈕 */}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡到父層
                  onClose();
                }}
                className="w-full"
              >
                知道了
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  // 使用 Portal 渲染到 body，完全脫離父組件的 stacking context
  return ReactDOM.createPortal(tipContent, document.body);
};
