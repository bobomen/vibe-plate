import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, UtensilsCrossed, Users, Star } from 'lucide-react';

const Index = () => {
  // 簡單的路由器 - 只檢測並重定向，不處理任何 token
  useEffect(() => {
    console.log('=== Index: START ===');
    console.log('Index: Full URL:', window.location.href);
    console.log('Index: Search params:', window.location.search);
    
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const error = urlParams.get('error');
    
    console.log('Index: Parsed params:', { 
      type, 
      error,
      allParams: Object.fromEntries(urlParams.entries())
    });
    
    // 如果是註冊確認，重定向到登錄頁
    if (type === 'signup') {
      console.log('Index: Redirecting to auth page for signup confirmation');
      window.location.href = `/auth${window.location.search}`;
      return;
    }
    
    console.log('Index: No special params, staying on landing page');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/20 via-background to-orange-500/20">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          {/* Logo & Title */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <UtensilsCrossed className="h-16 w-16 text-primary" />
            <Heart className="h-12 w-12 text-red-500 animate-pulse" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-orange-500 to-red-500 bg-clip-text text-transparent">
            美食滑卡
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            滑出你的美食品味，找到完美餐廳<br/>
            與朋友一起選擇，不再為「吃什麼」煩惱
          </p>

          {/* Key Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
            <div className="flex items-start gap-3 p-4 bg-background/60 backdrop-blur rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <UtensilsCrossed className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Tinder 式滑卡</h3>
                <p className="text-sm text-muted-foreground">左滑跳過、右滑收藏，快速找到你喜愛的餐廳</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-background/60 backdrop-blur rounded-lg border border-border/50 hover:border-red-500/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">智慧個人收藏</h3>
                <p className="text-sm text-muted-foreground">建立分類清單，輕鬆管理你的美食地圖</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-background/60 backdrop-blur rounded-lg border border-border/50 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">群組共識功能</h3>
                <p className="text-sm text-muted-foreground">和朋友一起滑卡，系統自動找出大家都喜歡的餐廳</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-background/60 backdrop-blur rounded-lg border border-border/50 hover:border-yellow-500/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">精選優質餐廳</h3>
                <p className="text-sm text-muted-foreground">Google 高評分、米其林推薦，嚴選品質保證</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Link to="/auth">
              <Button size="lg" className="px-12 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                開始使用
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>© 2025 美食滑卡</p>
        <Link to="/app/restaurant-owner" className="text-xs hover:text-primary transition-colors mt-2 inline-block">
          餐廳業者專區
        </Link>
      </div>
    </div>
  );
};

export default Index;
