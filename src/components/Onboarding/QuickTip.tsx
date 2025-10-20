import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TutorialCard } from '@/config/onboardingConfig';

interface QuickTipProps {
  tutorialCard: TutorialCard;
  onComplete: () => void;
}

export const QuickTip = ({ tutorialCard, onComplete }: QuickTipProps) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, tutorialCard.duration);
    return () => clearTimeout(timer);
  }, [tutorialCard.duration, onComplete]);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300">
      <Card className="max-w-sm mx-4 p-6 text-center animate-in zoom-in-95 duration-300">
        {tutorialCard.animation === 'tap-pulse' && (
          <div className="mb-4 animate-pulse">
            <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 bg-primary rounded-full" />
            </div>
          </div>
        )}
        
        {tutorialCard.animation === 'arrow-up' && (
          <div className="mb-4 animate-bounce">
            <div className="text-4xl">☝️</div>
          </div>
        )}
        
        <p className="text-lg font-medium">{tutorialCard.instruction}</p>
        
        {/* 進度點 */}
        <div className="flex gap-2 justify-center mt-4">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i <= (tutorialCard.id === 'filters' ? 3 : tutorialCard.id === 'tap-details' ? 2 : 0)
                  ? 'bg-primary' 
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
};
