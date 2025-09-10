import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, UtensilsCrossed, KeyRound, CheckCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Auth = () => {
  const { user, signUp, signIn, resetPassword, loading, authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    // Check for auth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      let message = '驗證失敗';
      
      // Provide more specific error messages
      if (error === 'access_denied') {
        message = '訪問被拒絕，請重新嘗試驗證';
      } else if (error === 'server_error') {
        message = '服務器錯誤，請稍後重試';
      } else if (error === 'exchange_failed') {
        message = '驗證失敗，請重新點擊郵件中的驗證連結';
      } else if (error === 'processing_failed') {
        message = '驗證處理失敗，請重新嘗試或聯繫客服';
      } else if (errorDescription) {
        if (errorDescription.includes('expired') || errorDescription.includes('token')) {
          message = '驗證連結已過期，請重新申請重設密碼或重新註冊';
        } else if (errorDescription.includes('invalid') || errorDescription.includes('not found')) {
          message = '無效的驗證連結，請檢查郵件中的連結或重新申請';
        } else {
          message = errorDescription;
        }
      }
      
      setAuthMessage({ type: 'error', message });
      
      toast({
        title: "驗證失敗",
        description: message,
        variant: "destructive",
        duration: 10000,
      });
      
      // Clear error parameters after a delay
      setTimeout(() => {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('error');
        newUrl.searchParams.delete('error_description');
        window.history.replaceState({}, document.title, newUrl.toString());
        setAuthMessage(null);
      }, 12000);
      
    } else if (code && !authLoading) {
      // Code is being processed, show loading message
      setAuthMessage({ 
        type: 'success', 
        message: '正在處理驗證，請稍候...' 
      });
      
    } else if (!code && !error && user) {
      // Successfully authenticated
      setAuthMessage({ 
        type: 'success', 
        message: '驗證成功！歡迎使用美食滑卡' 
      });
      
      toast({
        title: "驗證成功！",
        description: "歡迎使用美食滑卡，立即開始探索美食",
        duration: 5000,
      });
      
      // Clear success message after redirect
      setTimeout(() => {
        setAuthMessage(null);
      }, 3000);
    }
  }, [toast, authLoading, user]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {authLoading ? '正在驗證您的帳號...' : '載入中...'}
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app/" replace />;
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      toast({
        title: "密碼不符",
        description: "請確認兩次輸入的密碼相同",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password);
    
    if (error) {
      let errorMessage = error.message;
      
      // 提供更明確的錯誤訊息
      if (error.message.includes('User already registered')) {
        errorMessage = "此電子郵件已經註冊過，請直接登入或重設密碼";
      } else if (error.message.includes('Invalid email')) {
        errorMessage = "請輸入有效的電子郵件地址";
      } else if (error.message.includes('Password')) {
        errorMessage = "密碼至少需要6個字元";
      }
      
      toast({
        title: "註冊失敗",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      toast({
        title: "註冊成功！",
        description: "請檢查您的郵箱並點擊驗證鏈接，驗證完成後即可登入",
        duration: 8000, // 延長顯示時間
      });
    }
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      let errorMessage = error.message;
      
      // 提供更明確的錯誤訊息和解決方案
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = "電子郵件或密碼錯誤。如果您忘記密碼，請點擊下方的「忘記密碼？」重設密碼";
        // 自動設定重設密碼的信箱
        const email = formData.get('email') as string;
        if (email) setResetEmail(email);
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = "請先到您的信箱點擊驗證連結完成帳號驗證，如仍無法登入請重設密碼";
      } else if (error.message.includes('Too many requests')) {
        errorMessage = "登入嘗試次數過多，請稍後再試或重設密碼";
      }
      
      toast({
        title: "登入失敗",
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });
    }
    setIsLoading(false);
  };

  const handleGoogleAuth = () => {
    // TODO: 實現 Google 登入邏輯
    toast({
      title: "功能開發中",
      description: "Google 登入功能即將推出",
    });
  };

  const handleAppleAuth = () => {
    // TODO: 實現 Apple 登入邏輯
    toast({
      title: "功能開發中", 
      description: "Apple 登入功能即將推出",
    });
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('resetEmail') as string;

    const { error } = await resetPassword(email);
    
    if (error) {
      toast({
        title: "重設密碼失敗",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "重設密碼郵件已發送！",
        description: "請檢查您的信箱，點擊郵件中的連結來重設密碼",
        duration: 10000,
      });
      setShowResetForm(false);
      setResetEmail('');
    }
    setIsLoading(false);
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  const AppleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );

  const SocialAuthButtons = () => (
    <div className="mt-6 space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">或使用以下方式</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full"
        >
          <GoogleIcon />
          Google
        </Button>
        <Button
          variant="outline"
          onClick={handleAppleAuth}
          disabled={isLoading}
          className="w-full"
        >
          <AppleIcon />
          Apple
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
            <Heart className="h-6 w-6 text-red-500" />
          </div>
          <CardTitle className="text-2xl">美食滑卡</CardTitle>
          <CardDescription>發現你喜愛的餐廳，與朋友分享美食體驗</CardDescription>
        </CardHeader>
        <CardContent>
          {authMessage && (
            <div className={`mb-4 p-3 rounded-lg border ${
              authMessage.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' 
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
            }`}>
              <div className="flex items-center gap-2">
                {authMessage.type === 'success' && <CheckCircle className="h-4 w-4" />}
                <span className="text-sm font-medium">{authMessage.message}</span>
              </div>
            </div>
          )}
          
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">登入</TabsTrigger>
              <TabsTrigger value="signup">註冊</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              {!showResetForm ? (
                <>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">電子郵件</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="請輸入電子郵件"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">密碼</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="請輸入密碼"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? "登入中..." : "登入"}
                    </Button>
                  </form>
                  
                  <div className="mt-4 text-center">
                    <Button
                      variant="link"
                      onClick={() => setShowResetForm(true)}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      <KeyRound className="w-4 h-4 mr-2" />
                      忘記密碼？
                    </Button>
                  </div>
                  
                  <SocialAuthButtons />
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">重設密碼</h3>
                    <p className="text-sm text-muted-foreground">
                      請輸入您的電子郵件地址，我們將發送重設密碼的連結給您
                    </p>
                  </div>
                  
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">電子郵件</Label>
                      <Input
                        id="reset-email"
                        name="resetEmail"
                        type="email"
                        placeholder="請輸入電子郵件"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowResetForm(false);
                          setResetEmail('');
                        }}
                        className="flex-1"
                        disabled={isLoading}
                      >
                        返回登入
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1" 
                        disabled={isLoading}
                      >
                        {isLoading ? "發送中..." : "發送重設郵件"}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">電子郵件</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="請輸入電子郵件"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">密碼</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="請輸入密碼（至少6位）"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">確認密碼</Label>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="請再次輸入密碼"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "註冊中..." : "註冊"}
                </Button>
              </form>
              <SocialAuthButtons />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;