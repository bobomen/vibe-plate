import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Home, Megaphone, Building2, Menu, Eye, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OwnerGuard } from '@/components/RestaurantOwner/OwnerGuard';
import { useRestaurantOwner } from '@/hooks/useRestaurantOwner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
  comingSoon?: boolean;
}

export default function RestaurantOwnerLayout() {
  const navigate = useNavigate();
  const { ownerData } = useRestaurantOwner();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const navigationItems: NavItem[] = [
    { path: 'overview', label: '成效總覽', icon: Home, enabled: true },
    { path: 'promotions', label: '廣告投放', icon: Megaphone, enabled: true },
    { path: 'data', label: '商家資料', icon: Building2, enabled: true },
  ];

  const handleSwitchToUserMode = () => {
    navigate('/app');
    setOpen(false);
  };

  const handleNavClick = (enabled: boolean) => (e: React.MouseEvent) => {
    if (!enabled) {
      e.preventDefault();
    } else if (isMobile) {
      setOpen(false);
    }
  };

  const handlePreviewRestaurant = () => {
    if (ownerData?.restaurantId) {
      navigate(`/app/restaurant/${ownerData.restaurantId}`);
      setOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setOpen(false);
  };

  // 侧边栏内容组件
  const SidebarContent = () => (
    <>
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg mb-1">業者後台</h2>
        {ownerData && (
          <p className="text-sm font-medium truncate" title={ownerData.restaurantName}>
            {ownerData.restaurantName}
          </p>
        )}
        {user?.email && (
          <p className="text-xs text-muted-foreground truncate" title={user.email}>
            {user.email}
          </p>
        )}
      
        <Button
          variant="outline"
          size="sm"
          onClick={handleSwitchToUserMode}
          className="w-full mt-3"
        >
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          切換到用戶模式
        </Button>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.enabled ? item.path : '#'}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              isActive && item.enabled ? "bg-primary text-primary-foreground" : "hover:bg-accent",
              !item.enabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={handleNavClick(item.enabled)}
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1">{item.label}</span>
            {item.comingSoon && (
              <span className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded">
                即將推出
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePreviewRestaurant}
          className="w-full justify-start"
          disabled={!ownerData?.restaurantId}
        >
          <Eye className="mr-2 h-4 w-4" />
          預覽我的餐廳
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          登出
        </Button>
      </div>
    </>
  );

  return (
    <OwnerGuard>
      <div className="min-h-screen flex flex-col w-full bg-background">
        {isMobile ? (
          <>
            {/* 移動端頂部欄 */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-14 items-center px-4">
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="mr-2">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    <aside className="h-full bg-card flex flex-col">
                      <SidebarContent />
                    </aside>
                  </SheetContent>
                </Sheet>
                <h1 className="font-bold text-lg">業者後台</h1>
              </div>
            </header>

            {/* 移動端主內容區 */}
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </>
        ) : (
          <div className="flex flex-1">
            {/* 桌面端側邊欄 */}
            <aside className="w-64 bg-card border-r flex flex-col">
              <SidebarContent />
            </aside>

            {/* 桌面端主內容區 */}
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        )}
      </div>
    </OwnerGuard>
  );
}
