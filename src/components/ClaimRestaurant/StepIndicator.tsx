import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClaimStep, ClaimType } from '@/types/claimRestaurant';

interface StepIndicatorProps {
  currentStep: ClaimStep;
  claimType: ClaimType | null;
}

interface Step {
  id: ClaimStep;
  label: string;
  order: number;
}

export function StepIndicator({ currentStep, claimType }: StepIndicatorProps) {
  const getSteps = (): Step[] => {
    const baseSteps: Step[] = [
      { id: 'search', label: '搜尋餐廳', order: 1 },
    ];

    if (claimType === 'existing') {
      return [
        ...baseSteps,
        { id: 'contact-info', label: '聯繫資訊', order: 2 },
        { id: 'verification', label: '驗證', order: 3 },
        { id: 'success', label: '完成', order: 4 },
      ];
    } else if (claimType === 'new') {
      return [
        ...baseSteps,
        { id: 'create-info', label: '餐廳資訊', order: 2 },
        { id: 'verification', label: '驗證', order: 3 },
        { id: 'success', label: '完成', order: 4 },
      ];
    }

    return baseSteps;
  };

  const steps = getSteps();
  const currentStepOrder = steps.find(s => s.id === currentStep)?.order || 1;

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
        {steps.map((step, index) => {
          const isCompleted = step.order < currentStepOrder;
          const isCurrent = step.id === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                    isCompleted && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'border-primary text-primary',
                    !isCompleted && !isCurrent && 'border-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.order}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
