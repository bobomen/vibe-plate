import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Home, Megaphone, Building2, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
  comingSoon?: boolean;
}

export default function RestaurantOwnerLayout() {
  const navigate = useNavigate();

  const navigationItems: NavItem[] = [
    { path: 'overview', label: '成效總覽', icon: Home, enabled: true },
    { path: 'promotions', label: '廣告投放', icon: Megaphone, enabled: false, comingSoon: true },
    { path: 'data', label: '商家資料', icon: Building2, enabled: false, comingSoon: true },
    { path: 'settings', label: '個人設定', icon: SettingsIcon, enabled: false, comingSoon: true },
  ];

  const handleSwitchToUserMode = () => {
    navigate('/app');
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* 側邊欄 */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg mb-4">業者後台</h2>
          
          {/* 快速切換按鈕 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwitchToUserMode}
            className="w-full"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            切換到用戶模式
          </Button>
        </div>
        
        {/* 導航選單 */}
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
              onClick={(e) => !item.enabled && e.preventDefault()}
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

        {/* 預留未來功能區域 */}
        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            更多功能開發中...
          </p>
        </div>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
