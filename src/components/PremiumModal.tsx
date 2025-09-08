import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Infinity, Search, Users, Heart } from 'lucide-react';

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PremiumModal = ({ open, onClose, onUpgrade }: PremiumModalProps) => {
  const features = [
    {
      icon: <Infinity className="h-6 w-6 text-primary" />,
      title: "無限滑卡 & 收藏",
      description: "想滑多少就滑多少，自由收藏餐廳"
    },
    {
      icon: <Search className="h-6 w-6 text-primary" />,
      title: "高級篩選 & AI 建議",
      description: "米其林、500盤、距離價位智能篩選"
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "群組進階分析",
      description: "投票統計、共識推薦，不再煩惱選擇"
    },
    {
      icon: <Heart className="h-6 w-6 text-primary" />,
      title: "每月幫助孩子一餐",
      description: "吃飯同時，也讓別人能吃到飯"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4 rounded-2xl">
        <DialogHeader className="text-center space-y-4">
          <div className="pt-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💎</span>
            </div>
            <DialogTitle className="text-xl font-bold">
              升級 Premium
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              吃飯更快決定，也幫助孩子有飯吃
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                {feature.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-4">
          <Button 
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            升級 Premium
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full text-muted-foreground"
          >
            暫時跳過
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;