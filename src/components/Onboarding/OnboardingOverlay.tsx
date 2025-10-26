import { ArrowRight, ArrowLeft } from 'lucide-react';
import { memo } from 'react';

interface OnboardingOverlayProps {
  step: 1 | 2;
}

export const OnboardingOverlay = memo(({ step }: OnboardingOverlayProps) => {
  return (
    <div className="absolute bottom-[-80px] left-0 right-0 z-50 pointer-events-none">
      {/* 手勢動畫提示 */}
      {step === 1 && (
        <div className="absolute bottom-24 right-8 animate-[swipeRight_1.5s_ease-in-out_infinite]">
          <ArrowRight className="h-12 w-12 text-primary opacity-60" />
        </div>
      )}
      {step === 2 && (
        <div className="absolute bottom-24 left-8 animate-[swipeLeft_1.5s_ease-in-out_infinite]">
          <ArrowLeft className="h-12 w-12 text-destructive opacity-60" />
        </div>
      )}
      
      {/* 提示氣泡 */}
      <div className="mx-auto max-w-xs">
        <div className="bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg animate-bounce">
          <div className="flex items-center justify-center gap-2">
            {step === 1 ? (
              <>
                <ArrowRight className="h-5 w-5 animate-pulse" />
                <span className="text-sm font-medium">向右滑動表示喜歡 →</span>
              </>
            ) : (
              <>
                <ArrowLeft className="h-5 w-5 animate-pulse" />
                <span className="text-sm font-medium">← 向左滑動跳過</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

OnboardingOverlay.displayName = 'OnboardingOverlay';
