import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Undo2 } from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';

interface PremiumTeaserProps {
  onClose: () => void;
  onSkip: () => void;
}

export const PremiumTeaser = ({ onClose, onSkip }: PremiumTeaserProps) => {
  const { upgradeToPremium } = usePremium();

  const handleUpgrade = async () => {
    await upgradeToPremium();
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onSkip()}>
      <DialogContent className="max-w-sm">
        <div className="text-center space-y-6 py-4">
          {/* 動畫圖標 */}
          <div className="flex items-center justify-center gap-2">
            <div className="relative">
              <Undo2 className="h-16 w-16 text-primary animate-pulse" />
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              想反悔？ 🤔
            </h2>
            
            <p className="text-lg text-primary font-medium">
              Premium 用戶可以無限回頭！
            </p>
            
            <p className="text-sm text-muted-foreground">
              就像時光機一樣 🚀<br />
              不小心滑過超讚餐廳？輕鬆返回！
            </p>
          </div>

          {/* 功能卡片 */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <span className="text-2xl">♾️</span>
                <div>
                  <p className="font-semibold text-sm">無限回到上一張</p>
                  <p className="text-xs text-muted-foreground">後悔藥隨時吃</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-semibold text-sm">進階篩選功能</p>
                  <p className="text-xs text-muted-foreground">找到完美餐廳</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="font-semibold text-sm">揪團投票</p>
                  <p className="text-xs text-muted-foreground">朋友聚餐不再吵架</p>
                </div>
              </div>
            </div>
          </Card>

          {/* 按鈕 */}
          <div className="space-y-2 pt-2">
            <Button 
              onClick={handleUpgrade} 
              size="lg" 
              className="w-full bg-gradient-to-r from-primary to-primary/80"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              解鎖 Premium
            </Button>
            <Button 
              onClick={onSkip} 
              variant="ghost" 
              size="sm" 
              className="w-full"
            >
              稍後再說
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
