import React from 'react';
import { Button } from '@/components/ui/button';

interface SwipeActionButtonsProps {
  onDislike: () => void;
  onLike: () => void;
  disabled?: boolean;
}

export const SwipeActionButtons = React.memo(({ onDislike, onLike, disabled = false }: SwipeActionButtonsProps) => {
  return (
    <div className="flex justify-center gap-4 mt-4">
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