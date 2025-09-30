import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidReset, setIsValidReset] = useState(false);
  
  // 防止 React Strict Mode 雙重渲染導致重複處理
  const hasProcessedRef = useRef(false);


  useEffect(() => {
    // 防止重複處理（React Strict Mode 會導致雙重渲染）
    if (hasProcessedRef.current) {
      console.log('ResetPassword: Already processed, skipping');
      return;
    }

    const handleDirectReset = async () => {
      console.log('ResetPassword: Page loaded, URL:', window.location.href);
      console.log('ResetPassword: Search params:', Object.fromEntries(searchParams.entries()));
      
      const code = searchParams.get('code');
      const type = searchParams.get('type');
      const resetParam = searchParams.get('reset');
      
      console.log('ResetPassword: Parameters -', { code: !!code, type, reset: resetParam });
      
      // 如果已經處理過（URL 有 reset=true），直接顯示表單
      if (resetParam === 'true') {
        console.log('ResetPassword: Already processed, showing form');
        setIsValidReset(true);
        return;
      }
      
      // 如果有 code 和 type=recovery，處理 token 交換
      if (code && type === 'recovery') {
        // 標記為已處理
        hasProcessedRef.current = true;
        
        console.log('ResetPassword: Processing recovery callback');
        setIsLoading(true);
        
        try {
          console.log('ResetPassword: Exchanging code for session');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('ResetPassword: Session exchange error:', error);
            toast({
              title: "重置連結無效",
              description: error.message.includes('expired') 
                ? "連結已過期，請重新申請密碼重置" 
                : "連結無效或已使用，請重新申請",
              variant: "destructive",
            });
            setTimeout(() => navigate('/auth', { replace: true }), 2000);
            return;
          }
          
          if (data.session) {
            console.log('ResetPassword: Session established successfully');
            setIsValidReset(true);
            
            // 清理 URL 參數並標記為已處理
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('code');
            newUrl.searchParams.delete('type');
            newUrl.searchParams.set('reset', 'true');
            window.history.replaceState({}, document.title, newUrl.toString());
            
            console.log('ResetPassword: Ready for password update');
          }
        } catch (error) {
          console.error('ResetPassword: Processing error:', error);
          toast({
            title: "處理錯誤",
            description: "無法處理重置請求，請重新申請",
            variant: "destructive",
          });
          setTimeout(() => navigate('/auth', { replace: true }), 2000);
        } finally {
          setIsLoading(false);
        }
      } else {
        // 沒有有效參數，重定向到登錄頁
        console.log('ResetPassword: No valid parameters, redirecting to auth');
        navigate('/auth', { replace: true });
      }
    };
    
    handleDirectReset();
  }, [searchParams, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // 驗證密碼
    if (newPassword !== confirmPassword) {
      toast({
        title: "密碼不符",
        description: "請確認兩次輸入的密碼相同",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "密碼太短",
        description: "密碼至少需要6個字元",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('ResetPassword: Updating password');
      const { error } = await updatePassword(newPassword);
      
      if (error) {
        console.error('ResetPassword: Password update error:', error);
        toast({
          title: "密碼更新失敗",
          description: error.message || "請稍後再試",
          variant: "destructive",
        });
        setIsLoading(false);
      } else {
        console.log('ResetPassword: Password updated successfully');
        
        toast({
          title: "✅ 密碼更新成功！",
          description: "即將跳轉到登入頁面",
        });
        
        // 1秒後跳轉，給用戶時間看到成功訊息
        setTimeout(() => {
          navigate('/auth?message=password_updated', { replace: true });
        }, 1000);
      }
    } catch (error) {
      console.error('ResetPassword: Update processing error:', error);
      toast({
        title: "密碼更新失敗",
        description: "處理過程中發生錯誤，請稍後再試",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // 顯示加載狀態或等待處理
  if (!isValidReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">驗證重置連結...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">設定新密碼</CardTitle>
          <CardDescription>
            請輸入您的新密碼來完成重置
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密碼</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="請輸入新密碼"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">確認新密碼</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次輸入新密碼"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新密碼'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="text-sm text-muted-foreground"
            >
              <ArrowLeft className="mr-1 h-3 w-3" />
              返回登入頁面
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;