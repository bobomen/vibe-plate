import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Handle direct access from Supabase reset email
    const handleDirectReset = async () => {
      console.log('ResetPassword: Page loaded, URL:', window.location.href);
      console.log('ResetPassword: Search params:', Object.fromEntries(searchParams.entries()));
      
      // Check if we have auth callback parameters
      const code = searchParams.get('code');
      const type = searchParams.get('type');
      
      console.log('ResetPassword: Parameters -', { code: !!code, type });
      
      if (code && type === 'recovery') {
        console.log('ResetPassword: Processing recovery callback');
        try {
          setIsLoading(true);
          
          // Exchange the code for a session
          console.log('ResetPassword: Exchanging code for session');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('ResetPassword: Session exchange error:', error);
            toast({
              title: "重置連結無效",
              description: "請重新申請密碼重置或檢查連結是否已過期",
              variant: "destructive",
            });
            navigate('/auth', { replace: true });
            return;
          }
          
          if (data.session) {
            console.log('ResetPassword: Session established successfully');
            setIsValidReset(true);
            
            // Clean URL
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('code');
            newUrl.searchParams.delete('type');
            newUrl.searchParams.set('reset', 'true');
            window.history.replaceState({}, document.title, newUrl.toString());
            
            console.log('ResetPassword: URL cleaned, ready for password update');
          }
        } catch (error) {
          console.error('ResetPassword: Processing error:', error);
          toast({
            title: "處理錯誤",
            description: "無法處理重置請求，請重新申請",
            variant: "destructive",
          });
          navigate('/auth', { replace: true });
        } finally {
          setIsLoading(false);
        }
      } else if (searchParams.get('reset') === 'true') {
        // Already processed, show the form
        console.log('ResetPassword: Already processed, showing form');
        setIsValidReset(true);
      } else {
        // No valid reset parameters
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
      const { error } = await updatePassword(newPassword);
      
      if (error) {
        console.error('Password update error:', error);
        toast({
          title: "密碼更新失敗",
          description: error.message || "請稍後再試",
          variant: "destructive",
        });
      } else {
        console.log('Password reset successful, redirecting to auth page');
        
        toast({
          title: "密碼更新成功！",
          description: "即將跳轉到登入頁面，請使用新密碼登入",
          duration: 2000,
        });
        
        // 立即跳轉到登入頁面，避免用戶等待
        setTimeout(() => {
          navigate('/auth?message=password_updated', { replace: true });
        }, 1500);
      }
    } catch (error) {
      console.error('Password update processing error:', error);
      toast({
        title: "密碼更新失敗",
        description: "處理過程中發生錯誤，請稍後再試",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  if (!isValidReset) {
    return null; // 等待重導向
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