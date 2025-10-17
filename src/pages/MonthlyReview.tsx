import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, Sparkles, Upload, X, Image as ImageIcon, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TopRestaurantSelector } from '@/components/TopRestaurantSelector';
import { useMonthlyReviewStats } from '@/hooks/useMonthlyReviewStats';
import { generateMonthlyReviewGraphic } from '@/utils/generateMonthlyReviewGraphic';
import type { TopRestaurantSelection } from '@/types/monthlyReview';

const MonthlyReview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentMonth = new Date();
  const monthName = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;

  // Top 3 restaurants state
  const [topRestaurants, setTopRestaurants] = useState<{
    top1: TopRestaurantSelection | null;
    top2: TopRestaurantSelection | null;
    top3: TopRestaurantSelection | null;
  }>({
    top1: null,
    top2: null,
    top3: null,
  });

  // Favorite restaurants for autocomplete
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Generated graphic URL
  const [generatedGraphicUrl, setGeneratedGraphicUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch monthly stats (background data)
  const { data: monthlyStats } = useMonthlyReviewStats(currentMonth);

  // Constants
  const MAX_PHOTOS = 10;
  const MIN_PHOTOS = 3;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // Fetch favorite restaurants for autocomplete
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('favorites')
        .select(
          `
          id,
          restaurant_id,
          restaurants (
            id,
            name
          )
        `
        )
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to fetch favorites:', error);
        return;
      }

      if (data) {
        const restaurants = data
          .map((fav: any) => ({
            id: fav.restaurants.id,
            name: fav.restaurants.name,
          }))
          .filter((r) => r.name); // Filter out any null names

        setFavoriteRestaurants(restaurants);
      }
    };

    fetchFavorites();
  }, [user]);

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

  // Handle next step from photo upload
  const handleNextStep = () => {
    if (uploadedPhotos.length < MIN_PHOTOS) {
      toast.error(`至少需要上傳 ${MIN_PHOTOS} 張照片`, {
        description: `目前已上傳 ${uploadedPhotos.length} 張照片。`,
      });
      return;
    }
    setCurrentStep(3);
  };

  // Upload photos to Supabase Storage
  const uploadPhotosToStorage = async (photos: File[]): Promise<string[]> => {
    const uploadPromises = photos.map(async (photo, index) => {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}_${index}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('monthly-review-photos')
        .upload(fileName, photo, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('monthly-review-photos')
        .getPublicUrl(fileName);
      
      return publicUrl;
    });
    
    return Promise.all(uploadPromises);
  };

  // Handle generate graphic
  const handleGenerateGraphic = async () => {
    if (!topRestaurants.top1 || !topRestaurants.top2 || !topRestaurants.top3) {
      toast.error('請完成 Top 3 餐廳選擇');
      return;
    }

    setCurrentStep(4); // Move to generating step
    setIsGenerating(true);

    try {
      // 1. Upload photos to Storage
      toast.info('上傳照片中...');
      const photoUrls = await uploadPhotosToStorage(uploadedPhotos);
      
      // 2. Prepare graphic data
      const graphicData = {
        rankedPhotos: [
          {
            rank: 1 as const,
            restaurantName: topRestaurants.top1.restaurantName,
            photoUrl: photoUrls[topRestaurants.top1.photoIndex]
          },
          {
            rank: 2 as const,
            restaurantName: topRestaurants.top2.restaurantName,
            photoUrl: photoUrls[topRestaurants.top2.photoIndex]
          },
          {
            rank: 3 as const,
            restaurantName: topRestaurants.top3.restaurantName,
            photoUrl: photoUrls[topRestaurants.top3.photoIndex]
          },
          ...photoUrls
            .filter((_, i) => 
              i !== topRestaurants.top1.photoIndex &&
              i !== topRestaurants.top2.photoIndex &&
              i !== topRestaurants.top3.photoIndex
            )
            .map(url => ({
              rank: null,
              restaurantName: '',
              photoUrl: url
            }))
        ],
        stats: {
          totalSwipes: monthlyStats?.totalSwipes || 0,
          likePercentage: monthlyStats?.likePercentage || 0,
          totalFavorites: monthlyStats?.totalFavorites || 0,
          topDistrict: monthlyStats?.mostVisitedDistrict || '未知'
        },
        month: monthName
      };
      
      // 3. Generate graphic with Canvas
      toast.info('生成美術圖中...');
      const graphicBlobUrl = await generateMonthlyReviewGraphic(graphicData);
      
      // 4. Upload graphic to Storage
      const graphicBlob = await fetch(graphicBlobUrl).then(r => r.blob());
      const graphicFileName = `${user!.id}/review_${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('monthly-review-photos')
        .upload(graphicFileName, graphicBlob, {
          contentType: 'image/png',
          cacheControl: '3600'
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl: graphicPublicUrl } } = supabase.storage
        .from('monthly-review-photos')
        .getPublicUrl(graphicFileName);
      
      // 5. Save to database
      const { error: dbError } = await supabase
        .from('monthly_reviews')
        .insert({
          user_id: user!.id,
          review_month: `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01`,
          user_ranked_restaurants: [
            {
              rank: 1,
              restaurant_id: topRestaurants.top1.restaurantId || null,
              restaurant_name: topRestaurants.top1.restaurantName,
              photo_url: photoUrls[topRestaurants.top1.photoIndex]
            },
            {
              rank: 2,
              restaurant_id: topRestaurants.top2.restaurantId || null,
              restaurant_name: topRestaurants.top2.restaurantName,
              photo_url: photoUrls[topRestaurants.top2.photoIndex]
            },
            {
              rank: 3,
              restaurant_id: topRestaurants.top3.restaurantId || null,
              restaurant_name: topRestaurants.top3.restaurantName,
              photo_url: photoUrls[topRestaurants.top3.photoIndex]
            }
          ],
          graphic_url: graphicPublicUrl,
          total_swipes: monthlyStats?.totalSwipes || 0,
          total_likes: monthlyStats?.totalLikes || 0,
          like_percentage: monthlyStats?.likePercentage || 0,
          total_favorites: monthlyStats?.totalFavorites || 0,
          top_cuisine_type: monthlyStats?.topCuisineType || null,
          most_visited_district: monthlyStats?.mostVisitedDistrict || null
        });
      
      if (dbError) throw dbError;
      
      // 6. Complete
      setGeneratedGraphicUrl(graphicPublicUrl);
      setCurrentStep(5);
      toast.success('美食回顧生成完成！');
      
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('生成失敗', {
        description: error instanceof Error ? error.message : '請稍後再試'
      });
      setCurrentStep(3); // Return to Top 3 selection
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle top restaurant change
  const handleTopRestaurantChange = (
    rank: 1 | 2 | 3,
    data: TopRestaurantSelection | null
  ) => {
    setTopRestaurants((prev) => ({
      ...prev,
      [`top${rank}`]: data,
    }));
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

  // Step 3: Top 3 Selection
  const renderTop3SelectionStep = () => {
    const allSelected =
      topRestaurants.top1 && topRestaurants.top2 && topRestaurants.top3;

    return (
      <div className="space-y-4">
        {/* Instructions Card */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              🏆 選擇你本月最愛的 Top 3 餐廳，並為每個餐廳挑選一張最具代表性的照片。這將成為你的美食回顧主角！
            </p>
          </CardContent>
        </Card>

        {/* Top 1 Selector */}
        <TopRestaurantSelector
          rank={1}
          uploadedPhotos={uploadedPhotos}
          restaurants={favoriteRestaurants}
          value={topRestaurants.top1}
          onChange={(data) => handleTopRestaurantChange(1, data)}
        />

        {/* Top 2 Selector */}
        <TopRestaurantSelector
          rank={2}
          uploadedPhotos={uploadedPhotos}
          restaurants={favoriteRestaurants}
          value={topRestaurants.top2}
          onChange={(data) => handleTopRestaurantChange(2, data)}
        />

        {/* Top 3 Selector */}
        <TopRestaurantSelector
          rank={3}
          uploadedPhotos={uploadedPhotos}
          restaurants={favoriteRestaurants}
          value={topRestaurants.top3}
          onChange={(data) => handleTopRestaurantChange(3, data)}
        />

        {/* Validation Alert */}
        {!allSelected && (
          <Alert>
            <AlertDescription>
              請完成所有 Top 3 餐廳的選擇（餐廳名稱 + 代表照片）才能繼續下一步
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(2)}
            className="flex-1"
          >
            ← 返回
          </Button>
          <Button
            onClick={handleGenerateGraphic}
            className="flex-1"
            disabled={!allSelected}
          >
            生成美術圖 →
          </Button>
        </div>
      </div>
    );
  };

  // Step 4: Generating
  const renderGeneratingStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          正在生成你的美食回顧...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium mb-2">正在處理中</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>📸 上傳照片到雲端儲存...</p>
            <p>🎨 Canvas 繪製美術圖...</p>
            <p>💾 儲存你的回顧記錄...</p>
          </div>
        </div>
        <Alert>
          <AlertDescription>
            這可能需要幾秒鐘時間，請稍候
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  // Step 5: Completed
  const renderCompletedStep = () => {
    const handleDownload = () => {
      if (!generatedGraphicUrl) return;
      
      const link = document.createElement('a');
      link.href = generatedGraphicUrl;
      link.download = `${monthName}_美食回顧.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('開始下載美術圖');
    };

    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              完成！你的美食回顧已生成
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview */}
            {generatedGraphicUrl && (
              <div className="rounded-lg overflow-hidden border-2 border-border">
                <img 
                  src={generatedGraphicUrl} 
                  alt={`${monthName} 美食回顧`}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Download Button */}
            <Button 
              onClick={handleDownload}
              className="w-full"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              下載美術圖
            </Button>

            <Alert>
              <AlertDescription>
                💡 圖片已儲存到雲端，你可以隨時從個人檔案頁面查看歷史記錄
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentStep(1);
                  setUploadedPhotos([]);
                  setTopRestaurants({ top1: null, top2: null, top3: null });
                  setGeneratedGraphicUrl(null);
                }} 
                className="flex-1"
              >
                重新創作
              </Button>
              <Button 
                onClick={() => navigate('/app/profile')} 
                className="flex-1"
              >
                返回個人檔案
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Phase 2.5 Preview */}
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">📱 Phase 2.5 即將推出：</p>
            <p>• 一鍵分享到 Instagram Stories</p>
            <p>• 分享到其他社群平台</p>
            <p>• 查看歷史回顧記錄</p>
          </CardContent>
        </Card>
      </div>
    );
  };

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
