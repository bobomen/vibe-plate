import ReactDOM from 'react-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ContextualTipProps {
  message: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  onClose: () => void;
}

/**
 * ✅ 統一的教學提示組件
 * 
 * 特點：
 * - 全屏遮罩，聚焦用戶注意力
 * - 只能透過「知道了」按鈕關閉
 * - 統一的動畫和樣式
 * - z-index 最高，確保在所有內容之上
 */
export const ContextualTip = ({ 
  message, 
  direction = 'down', 
  onClose 
}: ContextualTipProps) => {
  const getArrowEmoji = () => {
    switch (direction) {
      case 'up': return '☝️';
      case 'down': return '👇';
      case 'left': return '👈';
      case 'right': return '👉';
      default: return '👇';
    }
  };

  const tipContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] animate-in fade-in duration-300"
      onClick={(e) => {
        // 點擊背景也可關閉
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative z-[100000]"
      >
        <Card className="max-w-sm mx-4 p-6 text-center animate-in zoom-in-95 duration-300 shadow-xl">
          <div className="space-y-4">
            {/* 動畫箭頭 */}
            <div className={`text-4xl ${direction === 'down' || direction === 'up' ? 'animate-bounce' : ''}`}>
              {getArrowEmoji()}
            </div>
            
            {/* 提示訊息 */}
            <p className="text-base font-medium">{message}</p>

            {/* 知道了按鈕 */}
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClose();
              }}
              className="w-full pointer-events-auto"
            >
              知道了
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  return ReactDOM.createPortal(tipContent, document.body);
};
