import { useState, useCallback } from 'react';
import { WelcomeScreen } from './WelcomeScreen';
import { TutorialSwipeCard } from './TutorialSwipeCard';
import { QuickTip } from './QuickTip';
import { PremiumTeaser } from './PremiumTeaser';
import { ONBOARDING_CARDS, TUTORIAL_STORAGE_KEY, TUTORIAL_SKIPPED_KEY } from '@/config/onboardingConfig';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'tutorial'>('welcome');
  const [tutorialIndex, setTutorialIndex] = useState(0);
  
  const currentTutorial = ONBOARDING_CARDS[tutorialIndex];
  
  const handleStart = useCallback(() => {
    setCurrentStep('tutorial');
  }, []);
  
  const handleSkip = useCallback(() => {
    localStorage.setItem(TUTORIAL_SKIPPED_KEY, 'true');
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    onComplete();
  }, [onComplete]);
  
  const handleNextStep = useCallback(() => {
    if (tutorialIndex < ONBOARDING_CARDS.length - 1) {
      setTutorialIndex(prev => prev + 1);
    } else {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      onComplete();
    }
  }, [tutorialIndex, onComplete]);
  
  const handlePremiumTeaserClose = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    onComplete();
  }, [onComplete]);
  
  if (currentStep === 'welcome') {
    return <WelcomeScreen onStart={handleStart} onSkip={handleSkip} />;
  }
  
  if (currentTutorial.type === 'swipe') {
    return (
      <TutorialSwipeCard 
        tutorialCard={currentTutorial}
        onSwipeComplete={handleNextStep}
      />
    );
  }
  
  if (currentTutorial.type === 'tip') {
    return <QuickTip tutorialCard={currentTutorial} onComplete={handleNextStep} />;
  }
  
  if (currentTutorial.type === 'premium') {
    return <PremiumTeaser onClose={handlePremiumTeaserClose} onSkip={handleNextStep} />;
  }
  
  return null;
};
