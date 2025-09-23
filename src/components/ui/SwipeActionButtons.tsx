import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Crown } from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';
import { useToast } from '@/hooks/use-toast';

interface SwipeActionButtonsProps {
  onGoBack?: () => void;
  canGoBack?: boolean;
  disabled?: boolean;
}

export const SwipeActionButtons = React.memo(({ 
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
    <div className="flex justify-center mt-4">
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
    </div>
  );
});

SwipeActionButtons.displayName = 'SwipeActionButtons';