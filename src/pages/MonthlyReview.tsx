import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, X, Download, Share2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMonthlyReviewStats } from '@/hooks/useMonthlyReviewStats';
import { generateMonthlyReviewGraphic } from '@/utils/generateMonthlyReviewGraphic';

interface PhotoData {
  file: File;
  preview: string;
  restaurantName: string;
  rank: number | null;
}

const MonthlyReview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentMonth = new Date();
  currentMonth.setDate(1); // Set to first day of month
  
  const { data: stats, isLoading: statsLoading } = useMonthlyReviewStats(currentMonth);
  
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [rankings, setRankings] = useState<{ [key: number]: number }>({});
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [userFavorites, setUserFavorites] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchUserFavorites();
  }, []);

  const fetchUserFavorites = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('favorites')
      .select('restaurant_id, restaurants(id, name)')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching favorites:', error);
      return;
    }

    const favorites = data
      .map(f => f.restaurants)
      .filter(r => r !== null)
      .map(r => ({ id: r!.id, name: r!.name }));
    
    setUserFavorites(favorites);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (photos.length + files.length > 10) {
      toast.error('最多只能上傳10張照片');
      return;
    }

    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      restaurantName: '',
      rank: null,
    }));

    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    URL.revokeObjectURL(newPhotos[index].preview);
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleNameChange = (index: number, name: string) => {
    const newPhotos = [...photos];
    newPhotos[index].restaurantName = name;
    setPhotos(newPhotos);
  };

  const uploadPhotosToStorage = async () => {
    const uploadedPhotos: Array<{ photoUrl: string; restaurantName: string; rank: number | null }> = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const fileName = `${user!.id}/${Date.now()}_${i}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('monthly-review-photos')
        .upload(fileName, photo.file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('monthly-review-photos')
        .getPublicUrl(fileName);

      uploadedPhotos.push({
        photoUrl: publicUrl,
        restaurantName: photo.restaurantName,
        rank: Object.entries(rankings).find(([_, photoIdx]) => photoIdx === i)?.[0] 
          ? parseInt(Object.entries(rankings).find(([_, photoIdx]) => photoIdx === i)![0]) 
          : null,
      });
    }

    return uploadedPhotos;
  };

  const generateGraphic = async () => {
    if (photos.length < 3) {
      toast.error('至少需要上傳3張照片才能生成美術圖');
      return;
    }

    if (!rankings[1] || !rankings[2] || !rankings[3]) {
      toast.error('請選擇你的 Top 3 餐廳');
      return;
    }

    setGenerating(true);

    try {
      // Upload photos to storage
      const uploadedPhotos = await uploadPhotosToStorage();

      // Generate graphic using Canvas API
      const imageUrl = await generateMonthlyReviewGraphic({
        rankedPhotos: uploadedPhotos,
        stats: {
          totalSwipes: stats?.totalSwipes || 0,
          likePercentage: stats?.likePercentage || 0,
          totalFavorites: stats?.totalFavorites || 0,
          topDistrict: stats?.mostVisitedDistrict || '未知',
        },
        month: `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`,
      });

      setGeneratedImageUrl(imageUrl);

      // Save to database
      await supabase.from('monthly_reviews').upsert({
        user_id: user!.id,
        review_month: currentMonth.toISOString().split('T')[0],
        user_ranked_restaurants: uploadedPhotos,
        total_swipes: stats?.totalSwipes || 0,
        total_likes: stats?.totalLikes || 0,
        like_percentage: stats?.likePercentage || 0,
        total_favorites: stats?.totalFavorites || 0,
        most_visited_district: stats?.mostVisitedDistrict,
        generated_at: new Date().toISOString(),
      });

      toast.success('美術圖生成成功！');
    } catch (error) {
      console.error('Error generating graphic:', error);
      toast.error('生成失敗，請重試');
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImageUrl) return;

    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `monthly-review-${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}.png`;
    link.click();
    toast.success('圖片已下載');
  };

  const shareToInstagram = () => {
    if (!generatedImageUrl) return;
    
    // Instagram doesn't have direct web share API, so we guide users
    toast.info('請將下載的圖片手動分享到 Instagram Story');
    downloadImage();
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
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月美食回顧
            </h1>
            <p className="text-sm text-muted-foreground">分享你這個月的餐廳探險</p>
          </div>
        </div>

        {/* Stats Summary */}
        {statsLoading ? (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{stats?.totalSwipes || 0}</p>
                  <p className="text-xs text-muted-foreground">探索餐廳</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalFavorites || 0}</p>
                  <p className="text-xs text-muted-foreground">收藏最愛</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.mostVisitedDistrict || '-'}</p>
                  <p className="text-xs text-muted-foreground">最常去</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Upload Photos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>步驟 1：上傳照片（最多10張）</CardTitle>
            <CardDescription>選擇你這個月去過的餐廳照片</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square">
                  <img 
                    src={photo.preview} 
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg" 
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {photos.length < 10 && (
                <label className="border-2 border-dashed border-muted-foreground/25 rounded-lg aspect-square flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUpload}
                    className="hidden"
                  />
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Input Restaurant Names */}
        {photos.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>步驟 2：輸入餐廳名稱</CardTitle>
              <CardDescription>為每張照片標註餐廳名字</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {photos.map((photo, index) => (
                <div key={index}>
                  <Label>照片 {index + 1}</Label>
                  <Input
                    placeholder="輸入餐廳名稱..."
                    value={photo.restaurantName}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    list={`restaurants-${index}`}
                  />
                  <datalist id={`restaurants-${index}`}>
                    {userFavorites.map(restaurant => (
                      <option key={restaurant.id} value={restaurant.name} />
                    ))}
                  </datalist>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select Top 3 */}
        {photos.length >= 3 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>步驟 3：選擇你的 Top 3 餐廳</CardTitle>
              <CardDescription>哪些是你最喜歡的？</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map(rank => (
                  <div key={rank}>
                    <Label>第 {rank} 名</Label>
                    <Select
                      value={rankings[rank]?.toString()}
                      onValueChange={(value) => setRankings({...rankings, [rank]: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`選擇第 ${rank} 名餐廳`} />
                      </SelectTrigger>
                      <SelectContent>
                        {photos.map((photo, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            {photo.restaurantName || `照片 ${idx + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Generate */}
        {photos.length >= 3 && (
          <Button
            onClick={generateGraphic}
            disabled={generating || !rankings[1] || !rankings[2] || !rankings[3]}
            className="w-full"
            size="lg"
          >
            {generating ? '生成中...' : '生成美術圖 🎨'}
          </Button>
        )}

        {/* Preview & Share */}
        {generatedImageUrl && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>你的美食回顧</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <img
                src={generatedImageUrl}
                alt="Monthly Review"
                className="w-full rounded-lg shadow-lg"
              />
              <div className="flex gap-4">
                <Button onClick={downloadImage} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  下載圖片
                </Button>
                <Button onClick={shareToInstagram} className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  分享到 Instagram
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MonthlyReview;
