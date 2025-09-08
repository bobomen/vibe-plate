import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNavigation } from '@/components/BottomNavigation';
import PremiumModal from '@/components/PremiumModal';
import { usePremium } from '@/hooks/usePremium';
import { SwipeCards } from '@/components/SwipeCards';
import Favorites from './Favorites';
import Groups from './Groups';
import Profile from './Profile';
import RestaurantDetail from './RestaurantDetail';

const App = () => {
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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        <Routes>
          <Route path="/" element={<SwipeCards />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/groups" element={<Groups />} />
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
};

export default App;