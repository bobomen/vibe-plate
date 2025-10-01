import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidReset, setIsValidReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 防止 React Strict Mode 雙重渲染導致重複處理
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // 防止重複處理（React Strict Mode 會導致雙重渲染）
    if (hasProcessedRef.current) {
      console.log('ResetPassword: Already processed, skipping');
      return;
    }

    const processResetToken = async () => {
      console.log('=== ResetPassword: START ===');
      console.log('ResetPassword: Full URL:', window.location.href);
      console.log('ResetPassword: Pathname:', window.location.pathname);
      console.log('ResetPassword: Search:', window.location.search);
      
      const code = searchParams.get('code');
      const type = searchParams.get('type');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      console.log('ResetPassword: All parameters:', {
        code: code ? `${code.substring(0, 10)}...` : null,
        type,
        error,
        errorDescription
      });
      
      // 必須有 code 和 type=recovery
      if (!code || type !== 'recovery') {
        console.log('ResetPassword: Missing required parameters, redirecting to auth');
        setErrorMessage('缺少必要參數');
        setTimeout(() => navigate('/auth', { replace: true }), 2000);
        return;
      }
      
      // 標記為已處理，防止重複
      hasProcessedRef.current = true;
      
      try {
        console.log('ResetPassword: Exchanging code for session');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('ResetPassword: Token exchange error:', error);
          
          let errorMsg = '重置連結無效';
          if (error.message.includes('expired')) {
            errorMsg = '連結已過期，請重新申請密碼重置';
          } else if (error.message.includes('already been used')) {
            errorMsg = '連結已使用過，請重新申請密碼重置';
          }
          
          setErrorMessage(errorMsg);
          toast({
            title: "重置連結無效",
            description: errorMsg,
            variant: "destructive",
          });
          
          setTimeout(() => navigate('/auth', { replace: true }), 3000);
          return;
        }
        
        if (data.session) {
          console.log('ResetPassword: Session established successfully');
          setIsValidReset(true);
          setIsLoading(false);
          
          toast({
            title: "驗證成功",
            description: "請設定您的新密碼",
          });
        }
      } catch (error) {
        console.error('ResetPassword: Processing error:', error);
        setErrorMessage('處理重置請求時發生錯誤');
        toast({
          title: "處理錯誤",
          description: "無法處理重置請求，請重新申請",
          variant: "destructive",
        });
        
        setTimeout(() => navigate('/auth', { replace: true }), 3000);
      }
    };
    
    processResetToken();
  }, [searchParams, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 驗證密碼
    if (newPassword !== confirmPassword) {
      toast({
        title: "密碼不符",
        description: "請確認兩次輸入的密碼相同",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "密碼太短",
        description: "密碼至少需要6個字元",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

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
          title: "密碼更新成功！",
          description: "即將跳轉到登入頁面，請使用新密碼登入",
        });
        
        // 1.5秒後跳轉
        setTimeout(() => {
          navigate('/auth?message=password_updated', { replace: true });
        }, 1500);
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

  // 錯誤狀態
  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">重置失敗</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              返回登入頁面
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">驗證重置連結...</p>
        </div>
      </div>
    );
  }

  // 顯示密碼重置表單
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
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
                placeholder="請輸入新密碼（至少6個字元）"
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
