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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-orange-500/20 p-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <UtensilsCrossed className="h-12 w-12 text-primary" />
          <Heart className="h-8 w-8 text-red-500" />
        </div>
        
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
          美食滑卡
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8">
          發現你喜愛的餐廳，與朋友分享美食體驗
        </p>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Tinder式滑卡</h3>
              <p className="text-sm text-muted-foreground">左滑跳過，右滑收藏喜愛的餐廳</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold">個人收藏</h3>
              <p className="text-sm text-muted-foreground">建立專屬的美食清單</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">群組共識</h3>
              <p className="text-sm text-muted-foreground">與朋友一起選擇聚餐地點</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-semibold">優質評分</h3>
              <p className="text-sm text-muted-foreground">Google評分與米其林推薦</p>
            </div>
          </div>
        </div>
        
        <Link to="/auth">
          <Button size="lg" className="w-full">
            開始探索美食
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
