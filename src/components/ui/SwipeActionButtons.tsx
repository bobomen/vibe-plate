import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Crown } from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';
import { useToast } from '@/hooks/use-toast';

interface SwipeActionButtonsProps {
  onDislike: () => void;
  onLike: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
  disabled?: boolean;
}

export const SwipeActionButtons = React.memo(({ 
  onDislike, 
  onLike, 
  onGoBack, 
  canGoBack = false, 
  disabled = false 
}: SwipeActionButtonsProps) => {
  const { isPremium, showFirstTimeModal, markModalAsSeen } = usePremium();
  const { toast } = useToast();

  const handleGoBack = () => {
    if (!isPremium) {
      if (showFirstTimeModal) {
        markModalAsSeen();
      }
      toast({
        title: "Premium 功能",
        description: "回上一間餐廳是 Premium 專屬功能，升級後即可使用",
        variant: "default"
      });
      return;
    }

    if (onGoBack) {
      onGoBack();
    }
  };
  return (
    <div className="flex justify-center gap-4 mt-4">
      {/* Go Back Button - Premium Feature */}
      {onGoBack && (
        <Button
          variant="outline"
          size="lg"
          onClick={handleGoBack}
          className={`
            rounded-full w-14 h-14 border-2 relative
            ${canGoBack && isPremium 
              ? 'border-amber-500/20 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-600' 
              : 'border-muted/20 hover:border-muted/30 hover:bg-muted/10 text-muted-foreground'
            }
            ${!canGoBack ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          disabled={disabled || !canGoBack}
          aria-label="回到上一間餐廳"
        >
          <ArrowLeft className="h-5 w-5" />
          {!isPremium && (
            <Crown className="h-3 w-3 absolute -top-1 -right-1 text-amber-500" />
          )}
        </Button>
      )}
      
      <Button
        variant="outline"
        size="lg"
        onClick={onDislike}
        className="rounded-full w-14 h-14 border-2 border-destructive/20 hover:border-destructive/30 hover:bg-destructive/10 text-destructive"
        disabled={disabled}
        aria-label="不喜歡此餐廳"
      >
        <span className="text-xl">👎</span>
      </Button>
      <Button
        variant="outline" 
        size="lg"
        onClick={onLike}
        className="rounded-full w-14 h-14 border-2 border-primary/20 hover:border-primary/30 hover:bg-primary/10 text-primary"
        disabled={disabled}
        aria-label="喜歡此餐廳"
      >
        <span className="text-xl">👍</span>
      </Button>
    </div>
  );
});

SwipeActionButtons.displayName = 'SwipeActionButtons';