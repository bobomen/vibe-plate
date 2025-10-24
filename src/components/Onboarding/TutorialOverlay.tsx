import { ReactNode } from 'react';
import { ArrowRight, ArrowLeft, MousePointer2 } from 'lucide-react';

interface TutorialOverlayProps {
  message: string;
  direction?: 'left' | 'right' | 'tap';
  highlightCard?: boolean;
}

export const TutorialOverlay = ({ message, direction, highlightCard }: TutorialOverlayProps) => {
  return (
    <>
      {/* 半透明遮罩 */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 pointer-events-none" />
      
      {/* 指示文字與圖標 */}
      <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <div className="flex flex-col items-center gap-4 animate-bounce">
          {direction === 'right' && (
            <>
              <div className="text-6xl">👉</div>
              <div className="px-6 py-3 bg-green-500 rounded-full text-white font-bold text-lg shadow-lg flex items-center gap-2">
                {message}
                <ArrowRight className="h-6 w-6" />
              </div>
            </>
          )}
          
          {direction === 'left' && (
            <>
              <div className="text-6xl">👈</div>
              <div className="px-6 py-3 bg-red-500 rounded-full text-white font-bold text-lg shadow-lg flex items-center gap-2">
                <ArrowLeft className="h-6 w-6" />
                {message}
              </div>
            </>
          )}
          
          {direction === 'tap' && (
            <>
              <div className="text-6xl">👆</div>
              <div className="px-6 py-3 bg-primary rounded-full text-white font-bold text-lg shadow-lg flex items-center gap-2">
                <MousePointer2 className="h-6 w-6" />
                {message}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* 高亮卡片區域 */}
      {highlightCard && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center p-4">
          <div className="w-full max-w-sm aspect-[3/4] rounded-2xl ring-4 ring-primary ring-offset-4 ring-offset-black/60 animate-pulse" />
        </div>
      )}
    </>
  );
};
