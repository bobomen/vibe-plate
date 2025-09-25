import React, { memo } from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNavigation } from '@/components/BottomNavigation';
import PremiumModal from '@/components/PremiumModal';
import { usePremium } from '@/hooks/usePremium';
import { SwipeCards } from '@/components/SwipeCards';
import { GroupSwipeCards } from '@/components/GroupSwipeCards';
import { GroupConsensus } from '@/components/GroupConsensus';
import { GroupConsensusSummary } from '@/components/GroupConsensusSummary';
import Favorites from './Favorites';
import Groups from './Groups';
import Profile from './Profile';
import RestaurantDetail from './RestaurantDetail';
import CategoryDetail from './CategoryDetail';

const App = memo(() => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { showFirstTimeModal, markModalAsSeen, upgradeToPremium } = usePremium();

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

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        <Routes>
          <Route path="/" element={<SwipeCards />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/categories/:categoryId" element={<CategoryDetail />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:groupId/swipe" element={<GroupSwipeCards />} />
          <Route path="/groups/:groupId/consensus" element={<GroupConsensus />} />
          <Route path="/groups/:groupId/consensus-summary" element={<GroupConsensusSummary />} />
          <Route path="/profile" element={<Profile />} />
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