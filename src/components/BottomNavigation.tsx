import React, { memo, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Heart, Users, UtensilsCrossed, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/app', icon: UtensilsCrossed, label: '滑卡' },
  { path: '/app/favorites', icon: Heart, label: '收藏' },
  { path: '/app/groups', icon: Users, label: '群組' },
  { path: '/app/profile', icon: User, label: '個人' },
];

export const BottomNavigation = memo(() => {
  const location = useLocation();

  const renderNavItem = useCallback(({ path, icon: Icon, label }: typeof navItems[0]) => {
    const isActive = location.pathname === path;
    
    return (
      <NavLink
        key={path}
        to={path}
        className={cn(
          "flex flex-col items-center justify-center p-3 rounded-lg transition-colors min-w-0 flex-1",
          isActive 
            ? "text-primary bg-primary/10" 
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <Icon className="h-5 w-5 mb-1" />
        <span className="text-xs font-medium">{label}</span>
      </NavLink>
    );
  }, [location.pathname]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(renderNavItem)}
      </div>
    </div>
  );
});

BottomNavigation.displayName = 'BottomNavigation';