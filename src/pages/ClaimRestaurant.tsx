import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClaimRestaurant } from '@/hooks/useClaimRestaurant';
import { StepIndicator } from '@/components/ClaimRestaurant/StepIndicator';
import { SearchStep } from '@/components/ClaimRestaurant/SearchStep';
import { ContactInfoStep } from '@/components/ClaimRestaurant/ContactInfoStep';
import { CreateRestaurantStep } from '@/components/ClaimRestaurant/CreateRestaurantStep';
import { VerificationStep } from '@/components/ClaimRestaurant/VerificationStep';
import { SuccessStep } from '@/components/ClaimRestaurant/SuccessStep';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ClaimRestaurant() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const {
    state,
    setStep,
    selectExistingRestaurant,
    chooseCreateNew,
    submitContactInfo,
    submitCreateInfo,
    submitVerificationCode,
    goToDashboard,
  } = useClaimRestaurant();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getEmailForVerification = () => {
    return state.contactInfo?.email || state.createInfo?.email || '';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">餐厅认领</h1>
          <p className="text-muted-foreground">
            认领您的餐厅，开始管理和优化您的线上形象
          </p>
        </div>

        <StepIndicator currentStep={state.currentStep} claimType={state.claimType} />

        {state.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-8">
          {state.currentStep === 'search' && (
            <SearchStep
              onSelectRestaurant={selectExistingRestaurant}
              onCreateNew={chooseCreateNew}
            />
          )}

          {state.currentStep === 'contact-info' && state.selectedRestaurant && (
            <ContactInfoStep
              restaurant={state.selectedRestaurant}
              onSubmit={submitContactInfo}
              onBack={() => setStep('search')}
              isSubmitting={state.isSubmitting}
            />
          )}

          {state.currentStep === 'create-info' && (
            <CreateRestaurantStep
              onSubmit={submitCreateInfo}
              onBack={() => setStep('search')}
              isSubmitting={state.isSubmitting}
            />
          )}

          {state.currentStep === 'verification' && (
            <VerificationStep
              onSubmit={submitVerificationCode}
              isSubmitting={state.isSubmitting}
              email={getEmailForVerification()}
            />
          )}

          {state.currentStep === 'success' && state.selectedRestaurant && (
            <SuccessStep
              restaurantName={state.selectedRestaurant.name}
              onGoToDashboard={goToDashboard}
            />
          )}
        </div>
      </div>
    </div>
  );
}
