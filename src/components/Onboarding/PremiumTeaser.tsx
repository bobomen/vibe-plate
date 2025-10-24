import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Filter, TrendingUp, Users } from 'lucide-react';

interface PremiumTeaserProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const PremiumTeaser = ({ open, onClose, onUpgrade }: PremiumTeaserProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">
            🎉 太棒了！
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            你已經掌握了基本操作！想要解鎖更多功能嗎？
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
              <Filter className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">進階篩選</p>
              <p className="text-xs text-muted-foreground">
                依照價位、距離、評分精準找到理想餐廳
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">群組分析</p>
              <p className="text-xs text-muted-foreground">
                查看群組投票趨勢和偏好統計
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">無限次數</p>
              <p className="text-xs text-muted-foreground">
                無限制探索所有餐廳，不受每日限制
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={onUpgrade} className="w-full" size="lg">
            升級 Premium
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full">
            繼續探索
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
