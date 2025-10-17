import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, Sparkles, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const MonthlyReview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentMonth = new Date();
  const monthName = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;

  // Constants
  const MAX_PHOTOS = 10;
  const MIN_PHOTOS = 3;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // File validation
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `檔案 "${file.name}" 格式不支援。請上傳 JPG、PNG 或 WEBP 格式的圖片。`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `檔案 "${file.name}" 太大。請上傳小於 5MB 的圖片。`;
    }
    return null;
  };

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const totalPhotos = uploadedPhotos.length + newFiles.length;

    if (totalPhotos > MAX_PHOTOS) {
      toast.error(`最多只能上傳 ${MAX_PHOTOS} 張照片`, {
        description: `已選擇 ${uploadedPhotos.length} 張，再選擇 ${newFiles.length} 張將超過限制。`,
      });
      return;
    }

    // Validate all files
    const validFiles: File[] = [];
    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        toast.error('檔案驗證失敗', { description: error });
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      setUploadedPhotos(prev => [...prev, ...validFiles]);
      toast.success(`成功上傳 ${validFiles.length} 張照片`);
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Handle file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle photo deletion
  const handleDeletePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
    toast.success('照片已刪除');
  };

  // Handle next step
  const handleNextStep = () => {
    if (uploadedPhotos.length < MIN_PHOTOS) {
      toast.error(`至少需要上傳 ${MIN_PHOTOS} 張照片`, {
        description: `目前已上傳 ${uploadedPhotos.length} 張照片。`,
      });
      return;
    }
    setCurrentStep(3);
  };

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

  // Step 2: Photo Upload
  const renderPhotoUploadStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            上傳美食照片
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {uploadedPhotos.length} / {MAX_PHOTOS}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/5'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            拖放照片到這裡或點擊上傳
          </p>
          <p className="text-sm text-muted-foreground">
            支援 JPG、PNG、WEBP 格式，單張照片最大 5MB
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            最多 {MAX_PHOTOS} 張，至少需要 {MIN_PHOTOS} 張照片
          </p>
        </div>

        {/* Photo Grid */}
        {uploadedPhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {uploadedPhotos.map((file, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`照片 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleDeletePhoto(index)}
                  className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                  aria-label="刪除照片"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-background/80 rounded text-xs font-medium">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Alert */}
        {uploadedPhotos.length > 0 && uploadedPhotos.length < MIN_PHOTOS && (
          <Alert>
            <AlertDescription>
              還需要上傳 {MIN_PHOTOS - uploadedPhotos.length} 張照片才能繼續下一步
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(1)} 
            className="flex-1"
          >
            ← 返回
          </Button>
          <Button 
            onClick={handleNextStep}
            className="flex-1"
            disabled={uploadedPhotos.length < MIN_PHOTOS}
          >
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
