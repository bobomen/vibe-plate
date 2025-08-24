import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNavigation } from '@/components/BottomNavigation';
import { SwipeCards } from '@/components/SwipeCards';
import Favorites from './Favorites';
import Groups from './Groups';
import Profile from './Profile';

const App = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

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
          <Route path="/app" element={<SwipeCards />} />
          <Route path="/app/favorites" element={<Favorites />} />
          <Route path="/app/groups" element={<Groups />} />
          <Route path="/app/profile" element={<Profile />} />
        </Routes>
      </main>
      {location.pathname.startsWith('/app') && <BottomNavigation />}
    </div>
  );
};

export default App;