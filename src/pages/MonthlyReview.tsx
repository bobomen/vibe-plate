import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

const MonthlyReview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const currentMonth = new Date();
  const monthName = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;

  // If user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 p-4">
        <Card>
          <CardContent className="p-6">
            <Alert>
              <AlertTitle>需要登入</AlertTitle>
              <AlertDescription>
                請先登入才能創作月度美食回顧
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full mt-4"
            >
              前往登入
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Welcome Page
  const renderWelcomeStep = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            {monthName} 美食回顧
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-muted-foreground">
              創作專屬於你的美食回憶，分享到 Instagram 讓朋友羨慕！
            </p>
            <div className="bg-background/50 rounded-lg p-4 space-y-2 text-sm">
              <p className="flex items-center gap-2">
                ✨ 上傳最多 10 張美食照片
              </p>
              <p className="flex items-center gap-2">
                🏆 選出你的 Top 3 最愛餐廳
              </p>
              <p className="flex items-center gap-2">
                🎨 生成精美的美食回顧美術圖
              </p>
              <p className="flex items-center gap-2">
                📱 一鍵下載分享到 Instagram
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setCurrentStep(2)} 
            className="w-full"
            size="lg"
          >
            開始創作 →
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">📊 Phase 2.1 測試版本</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>✅ 5 步驟 UI 框架建立完成</p>
          <p>✅ 文案更新為「創作」導向</p>
          <p>✅ 統計數據已移至後台</p>
          <p className="text-xs pt-2 border-t">
            下個階段將加入照片上傳功能
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // Step 2: Photo Upload (Placeholder)
  const renderPhotoUploadStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>步驟 2：上傳美食照片</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground">📸 照片上傳功能</p>
          <p className="text-sm text-muted-foreground mt-2">即將在 Phase 2.2 推出</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
            ← 返回
          </Button>
          <Button onClick={() => setCurrentStep(3)} className="flex-1">
            繼續 →
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 3: Top 3 Selection (Placeholder)
  const renderTop3SelectionStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>步驟 3：選擇 Top 3 餐廳</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground">🏆 Top 3 選擇功能</p>
          <p className="text-sm text-muted-foreground mt-2">即將在 Phase 2.3 推出</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
            ← 返回
          </Button>
          <Button onClick={() => setCurrentStep(4)} className="flex-1">
            生成美術圖 →
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 4: Generating (Placeholder)
  const renderGeneratingStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>步驟 4：生成中...</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">🎨 Canvas 美術圖生成</p>
          <p className="text-sm text-muted-foreground mt-2">即將在 Phase 2.4 推出</p>
        </div>
        <Button onClick={() => setCurrentStep(5)} className="w-full">
          查看結果 →
        </Button>
      </CardContent>
    </Card>
  );

  // Step 5: Completed (Placeholder)
  const renderCompletedStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>步驟 5：完成！</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground">🎉 下載與分享功能</p>
          <p className="text-sm text-muted-foreground mt-2">即將在 Phase 2.5 推出</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
            重新創作
          </Button>
          <Button onClick={() => navigate('/app/profile')} className="flex-1">
            返回個人檔案
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/profile')}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              美食回顧創作
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentStep === 1 && '開始創作你的專屬美食回憶'}
              {currentStep === 2 && '上傳你的美食照片'}
              {currentStep === 3 && '選擇你的 Top 3 餐廳'}
              {currentStep === 4 && '正在生成美術圖...'}
              {currentStep === 5 && '分享你的美食回顧'}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full transition-all ${
                step === currentStep
                  ? 'bg-primary'
                  : step < currentStep
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Render Current Step */}
        {currentStep === 1 && renderWelcomeStep()}
        {currentStep === 2 && renderPhotoUploadStep()}
        {currentStep === 3 && renderTop3SelectionStep()}
        {currentStep === 4 && renderGeneratingStep()}
        {currentStep === 5 && renderCompletedStep()}
      </div>
    </div>
  );
};

export default MonthlyReview;
