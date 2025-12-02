import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Save, Loader2 } from 'lucide-react';
import { CUISINE_OPTIONS } from '@/config/cuisineTypes';
import { useRestaurantOwner } from '@/hooks/useRestaurantOwner';
import { useRestaurantDataEdit } from '@/hooks/useRestaurantDataEdit';
import { useBatchPhotoUpload } from '@/hooks/useBatchPhotoUpload';
import { PhotoUploadZone } from '@/components/RestaurantOwner/PhotoUploadZone';
import { PhotoUploadProgress } from '@/components/RestaurantOwner/PhotoUploadProgress';
import { SortablePhotoGrid } from '@/components/RestaurantOwner/SortablePhotoGrid';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function RestaurantOwnerData() {
  const { user } = useAuth();
  const { ownerData, isOwner, loading: ownerLoading } = useRestaurantOwner();
  const {
    restaurant,
    photos,
    isLoading,
    updateTextData,
    deletePhoto,
    updatePhotoOrder,
  } = useRestaurantDataEdit(ownerData?.restaurantId || '');

  // 批量上傳 hook
  const {
    tasks,
    addFiles,
    retryTask,
    cancelTask,
    clearCompleted,
    isUploading: isBatchUploading,
  } = useBatchPhotoUpload({
    restaurantId: ownerData?.restaurantId || '',
    userId: user?.id || '',
    maxConcurrent: 3,
    onUploadComplete: () => {
      // 上傳完成後重新載入照片列表
      window.location.reload();
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    menu_url: '',
    cuisine_type: '',
  });

  // 當餐廳資料載入後，更新表單
  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        website: restaurant.website || '',
        menu_url: restaurant.menu_url || '',
        cuisine_type: restaurant.cuisine_type || '',
      });
    }
  }, [restaurant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 檢查是否有變更
    const changes: any = {};
    if (restaurant) {
      Object.keys(formData).forEach((key) => {
        const k = key as keyof typeof formData;
        if (formData[k] !== (restaurant[k] || '')) {
          changes[k] = formData[k];
        }
      });
    }

    if (Object.keys(changes).length === 0) {
      toast.info('沒有變更需要儲存');
      return;
    }

    await updateTextData.mutateAsync(changes);
  };

  if (ownerLoading || isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isOwner || !ownerData) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">請先認領餐廳</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* 基本資料編輯 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>基本資料編輯</CardTitle>
              <CardDescription>編輯餐廳基本資訊，修改後立即生效</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">餐廳名稱 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="請輸入餐廳名稱"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuisine_type">料理類型</Label>
                <Select
                  value={formData.cuisine_type}
                  onValueChange={(value) => setFormData({ ...formData, cuisine_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇料理類型" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    {CUISINE_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <span className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">聯絡電話</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+886-2-1234-5678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">官方網站</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="menu_url">線上菜單</Label>
                <Input
                  id="menu_url"
                  type="url"
                  value={formData.menu_url}
                  onChange={(e) => setFormData({ ...formData, menu_url: e.target.value })}
                  placeholder="https://menu.example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">餐廳地址 *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="請輸入完整地址"
                rows={2}
                required
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={updateTextData.isPending}
              >
                {updateTextData.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    儲存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    儲存變更
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* 照片管理 */}
      <Card>
        <CardHeader>
          <CardTitle>照片管理</CardTitle>
          <CardDescription>
            上傳餐廳照片，AI 將自動審核（數秒內完成）。支援批量上傳，最多 3 個並發。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PhotoUploadZone
            onBatchUpload={addFiles}
            currentPhotoCount={photos?.length || 0}
            maxPhotos={15}
            isUploading={isBatchUploading}
            batchMode={true}
          />

          <PhotoUploadProgress
            tasks={tasks}
            onRetry={retryTask}
            onCancel={cancelTask}
            onClearCompleted={clearCompleted}
          />

          <SortablePhotoGrid
            photos={photos || []}
            onDelete={deletePhoto.mutateAsync}
            onReorder={updatePhotoOrder.mutateAsync}
          />
        </CardContent>
      </Card>
    </div>
  );
}
