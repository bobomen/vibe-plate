import React, { memo, useState } from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNavigation } from '@/components/BottomNavigation';
import PremiumModal from '@/components/PremiumModal';
import { usePremium } from '@/hooks/usePremium';
import { useOnboarding } from '@/hooks/useOnboarding';
import { SwipeCards } from '@/components/SwipeCards';
import { GroupSwipeCards } from '@/components/GroupSwipeCards';
import { GroupConsensus } from '@/components/GroupConsensus';
import { GroupConsensusSummary } from '@/components/GroupConsensusSummary';
import { WelcomeScreen } from '@/components/Onboarding/WelcomeScreen';
import Favorites from './Favorites';
import Groups from './Groups';
import Profile from './Profile';
import RestaurantDetail from './RestaurantDetail';
import CategoryDetail from './CategoryDetail';
import Admin from './Admin';
import MonthlyReview from './MonthlyReview';

const App = memo(() => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { showFirstTimeModal, markModalAsSeen, upgradeToPremium } = usePremium();
  const { showCoreOnboarding, completeCoreOnboarding } = useOnboarding();
  const [welcomeCompleted, setWelcomeCompleted] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't redirect to auth if on reset password page
  if (!user && location.pathname !== '/reset-password') {
    return <Navigate to="/auth" replace />;
  }

  // Show welcome screen for first-time users
  if (user && showCoreOnboarding && !welcomeCompleted) {
    return (
      <WelcomeScreen
        onStart={() => setWelcomeCompleted(true)}
        onSkip={() => {
          completeCoreOnboarding();
          setWelcomeCompleted(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        <Routes>
          <Route path="/" element={<SwipeCards showTutorial={showCoreOnboarding && welcomeCompleted} />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/categories/:categoryId" element={<CategoryDetail />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:groupId/swipe" element={<GroupSwipeCards />} />
          <Route path="/groups/:groupId/consensus" element={<GroupConsensus />} />
          <Route path="/groups/:groupId/consensus-summary" element={<GroupConsensusSummary />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/monthly-review" element={<MonthlyReview />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      {!location.pathname.includes('/restaurant/') && <BottomNavigation />}
      
      <PremiumModal
        open={showFirstTimeModal}
        onClose={markModalAsSeen}
        onUpgrade={upgradeToPremium}
      />
    </div>
  );
});

App.displayName = 'App';

export default App;