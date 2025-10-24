import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Utensils, Heart, Users } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
}

export const WelcomeModal = ({ open, onStart, onSkip }: WelcomeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onSkip()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            歡迎來到 Foodie Match！
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            發現你最愛的餐廳，只需要簡單的左右滑動
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">探索美食</p>
              <p className="text-xs text-muted-foreground">
                瀏覽精選餐廳，找到你的最愛
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">收藏喜愛</p>
              <p className="text-xs text-muted-foreground">
                向右滑動喜歡，向左滑動跳過
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">群組投票</p>
              <p className="text-xs text-muted-foreground">
                和朋友一起決定今天吃什麼
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={onStart} className="w-full" size="lg">
            開始教學
          </Button>
          <Button onClick={onSkip} variant="ghost" className="w-full">
            我已經會用了
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
