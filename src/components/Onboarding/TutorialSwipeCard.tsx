import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ArrowRight, ArrowLeft } from 'lucide-react';
import { TutorialCard } from '@/config/onboardingConfig';

interface TutorialSwipeCardProps {
  tutorialCard: TutorialCard;
  onSwipeComplete: () => void;
}

export const TutorialSwipeCard = ({ tutorialCard, onSwipeComplete }: TutorialSwipeCardProps) => {
  const { restaurant, instruction, direction } = tutorialCard;
  const [autoSwipe, setAutoSwipe] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setAutoSwipe(true), 3000);
    return () => clearTimeout(timer);
  }, []);
  
  if (!restaurant) return null;
  
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-sm">
        {/* 滑動方向指示器 */}
        <div className={`absolute -top-20 left-1/2 transform -translate-x-1/2 z-10 
          ${autoSwipe ? 'animate-bounce' : ''}`}>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold
            ${direction === 'right' ? 'bg-green-500' : 'bg-red-500'}`}>
            {direction === 'right' ? (
              <>試試往右滑 <ArrowRight className="h-5 w-5" /></>
            ) : (
              <><ArrowLeft className="h-5 w-5" /> 試試往左滑</>
            )}
          </div>
        </div>
        
        <Card className={`relative shadow-xl transition-all duration-1000
          ${autoSwipe && direction === 'right' ? 'animate-[slideRight_1s_ease-in-out]' : ''}
          ${autoSwipe && direction === 'left' ? 'animate-[slideLeft_1s_ease-in-out]' : ''}`}>
          
          {/* 超大 Emoji 作為圖片 */}
          <div className="relative h-80 bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
            <div className="text-9xl">{restaurant.emoji}</div>
            
            {/* 趣味 Badge */}
            {restaurant.badge && (
              <Badge className={`absolute top-4 left-4 ${restaurant.badge.color} text-white animate-pulse`}>
                {restaurant.badge.text}
              </Badge>
            )}
          </div>
          
          {/* 餐廳資訊 */}
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">{restaurant.name}</h2>
            <p className="text-muted-foreground mb-3">{restaurant.description}</p>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 text-amber-600 font-medium">
                <Star className="h-4 w-4 fill-current" />
                {restaurant.rating.toFixed(1)}
              </div>
              <span className="text-sm text-muted-foreground">
                {restaurant.reviewCount}
              </span>
            </div>
            
            {/* 教學指示 */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-sm font-medium text-primary">{instruction}</p>
            </div>
          </div>
        </Card>
        
        {/* 滑動後的確認按鈕 */}
        <div className="mt-6 text-center">
          <Button onClick={onSwipeComplete} variant="outline">
            我已經滑過了 →
          </Button>
        </div>
      </div>
    </div>
  );
};
