import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, UtensilsCrossed } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
  onSkip: () => void;
}

export const WelcomeScreen = ({ onStart, onSkip }: WelcomeScreenProps) => {
  return (
    <Dialog open={true}>
      <DialogContent className="max-w-sm">
        <div className="text-center space-y-4 py-4">
          <div className="flex items-center justify-center gap-3 animate-bounce">
            <UtensilsCrossed className="h-12 w-12 text-primary" />
            <Heart className="h-10 w-10 text-destructive" />
          </div>
          
          <h2 className="text-2xl font-bold">
            歡迎來到美食滑卡！🎉
          </h2>
          
          <p className="text-muted-foreground">
            花 25 秒學會如何使用<br />
            <span className="text-primary font-medium">保證有趣不無聊！</span>
          </p>
          
          <div className="space-y-2 pt-4">
            <Button onClick={onStart} size="lg" className="w-full">
              開始教學 (25秒)
            </Button>
            <Button onClick={onSkip} variant="ghost" size="sm" className="w-full">
              我已經會用了
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
