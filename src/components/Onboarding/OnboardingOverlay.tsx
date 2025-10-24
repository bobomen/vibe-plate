import { ArrowRight, ArrowLeft } from 'lucide-react';
import { memo } from 'react';

interface OnboardingOverlayProps {
  step: 1 | 2;
}

export const OnboardingOverlay = memo(({ step }: OnboardingOverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* 半透明背景 */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      {/* 提示內容 */}
      <div className="relative z-10 max-w-md mx-auto px-4">
        <div className="bg-card border border-border rounded-lg p-6 shadow-lg animate-fade-in">
          {step === 1 ? (
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <ArrowRight className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">
                向右滑動
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                如果你喜歡這間餐廳，向右滑動或點擊右側按鈕
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
                  <ArrowLeft className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">
                向左滑動
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                不喜歡的話，向左滑動或點擊左側按鈕跳過
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

OnboardingOverlay.displayName = 'OnboardingOverlay';
