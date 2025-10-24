import { useState, useCallback } from 'react';
import { WelcomeScreen } from './WelcomeScreen';
import { TutorialOverlay } from './TutorialOverlay';
import { QuickTip } from './QuickTip';
import { PremiumTeaser } from './PremiumTeaser';
import { SwipeCard } from '@/components/SwipeCard';
import { ONBOARDING_CARDS } from '@/config/onboardingConfig';

interface OnboardingFlowProps {
  onComplete: () => void;
}

// 模擬餐廳數據
const MOCK_RESTAURANTS = [
  {
    id: 'tutorial-1',
    name: '美味蟹堡',
    address: '比奇堡海灘大道123號',
    formatted_address: '比奇堡海灘大道123號',
    lat: 25.033,
    lng: 121.5654,
    rating: 5.0,
    google_rating: 5.0,
    user_ratings_total: 999,
    photos: [],
    cuisine_type: '美式快餐',
    emoji: '🍔',
    description: '海綿寶寶的獨家秘方！派大星也超愛',
    is_michelin: false,
    is_bib_gourmand: false,
    is_500_dishes: false,
    price_level: 2,
    city: '台北市',
    district: '中正區',
  },
  {
    id: 'tutorial-2',
    name: '軟飯',
    address: '躺平街1號',
    formatted_address: '躺平街1號',
    lat: 25.033,
    lng: 121.5654,
    rating: 2.5,
    google_rating: 2.5,
    user_ratings_total: 42,
    photos: [],
    cuisine_type: '慵懶料理',
    emoji: '🍚',
    description: '專為現代人設計的舒適餐點，讓你躺平享受',
    is_michelin: false,
    is_bib_gourmand: false,
    is_500_dishes: false,
    price_level: 1,
    city: '台北市',
    district: '中正區',
  },
  {
    id: 'tutorial-3',
    name: '星級義式餐廳',
    address: '美食街88號',
    formatted_address: '美食街88號',
    lat: 25.033,
    lng: 121.5654,
    rating: 4.8,
    google_rating: 4.8,
    user_ratings_total: 567,
    photos: [],
    cuisine_type: '義式料理',
    emoji: '🍝',
    description: '正宗義大利風味，約會首選',
    is_michelin: true,
    is_bib_gourmand: false,
    is_500_dishes: false,
    price_level: 3,
    city: '台北市',
    district: '中正區',
  }
];

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'tutorial'>('welcome');
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const currentTutorial = ONBOARDING_CARDS[tutorialIndex];
  const currentRestaurant = MOCK_RESTAURANTS[Math.min(tutorialIndex, MOCK_RESTAURANTS.length - 1)];
  
  const handleStart = useCallback(() => {
    setCurrentStep('tutorial');
  }, []);
  
  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);
  
  const handleNextStep = useCallback(() => {
    if (tutorialIndex < ONBOARDING_CARDS.length - 1) {
      setTutorialIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [tutorialIndex, onComplete]);

  // 簡化的滑動邏輯（不寫入資料庫）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (currentTutorial.type !== 'swipe') return;
    setIsDragging(true);
    setDragOffset({ x: 0, y: 0 });
  }, [currentTutorial.type]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || currentTutorial.type !== 'swipe') return;
    setDragOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
  }, [isDragging, currentTutorial.type]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || currentTutorial.type !== 'swipe') return;
    
    const threshold = 100;
    const direction = currentTutorial.direction;
    
    // 檢查是否滑動正確方向
    if (direction === 'right' && dragOffset.x > threshold) {
      handleNextStep();
    } else if (direction === 'left' && dragOffset.x < -threshold) {
      handleNextStep();
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, [isDragging, dragOffset, currentTutorial, handleNextStep]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (currentTutorial.type !== 'swipe') return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragOffset({ x: touch.clientX, y: touch.clientY });
  }, [currentTutorial.type]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || currentTutorial.type !== 'swipe') return;
    const touch = e.touches[0];
    setDragOffset({ x: touch.clientX, y: touch.clientY });
  }, [isDragging, currentTutorial.type]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging || currentTutorial.type !== 'swipe') return;
    
    const threshold = 100;
    const direction = currentTutorial.direction;
    
    if (direction === 'right' && dragOffset.x > threshold) {
      handleNextStep();
    } else if (direction === 'left' && dragOffset.x < -threshold) {
      handleNextStep();
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, [isDragging, dragOffset, currentTutorial, handleNextStep]);
  
  if (currentStep === 'welcome') {
    return <WelcomeScreen onStart={handleStart} onSkip={handleSkip} />;
  }
  
  // Swipe 類型 - 使用真實 SwipeCard
  if (currentTutorial.type === 'swipe') {
    return (
      <div className="min-h-screen bg-background relative">
        <TutorialOverlay 
          message={currentTutorial.instruction}
          direction={currentTutorial.direction}
          highlightCard={true}
        />
        
        <div className="relative z-50 flex items-center justify-center min-h-screen p-4">
          <div 
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out'
            }}
          >
            <SwipeCard
              restaurant={currentRestaurant as any}
              onSwipe={() => {}} // 不執行實際邏輯
              onCardClick={() => {}} // 教學模式下不導航
              distance={Math.abs(dragOffset.x)}
              isDragging={isDragging}
              dragOffset={dragOffset}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart as any}
              onTouchMove={handleTouchMove as any}
              onTouchEnd={handleTouchEnd as any}
              swipeDirection={dragOffset.x > 50 ? 'right' : dragOffset.x < -50 ? 'left' : undefined}
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Tip 類型
  if (currentTutorial.type === 'tip') {
    return <QuickTip tutorialCard={currentTutorial} onComplete={handleNextStep} />;
  }
  
  // Premium 類型
  if (currentTutorial.type === 'premium') {
    return <PremiumTeaser onClose={onComplete} onSkip={handleNextStep} />;
  }
  
  return null;
};
