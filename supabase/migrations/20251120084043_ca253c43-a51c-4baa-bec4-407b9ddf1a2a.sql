-- ====================================
-- Phase 1: 商家資料編輯基礎架構
-- ====================================

-- 1. 創建照片管理表
CREATE TABLE IF NOT EXISTS public.restaurant_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  uploaded_by UUID NOT NULL,
  file_size_bytes INTEGER,
  file_format TEXT,
  UNIQUE(restaurant_id, photo_url)
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_restaurant_photos_restaurant ON public.restaurant_photos(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_photos_status ON public.restaurant_photos(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_photos_uploaded_at ON public.restaurant_photos(uploaded_at) WHERE status = 'pending';

-- 2. 創建資料變更審計表
CREATE TABLE IF NOT EXISTS public.restaurant_data_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL,
  changed_by UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_changes_restaurant ON public.restaurant_data_changes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_data_changes_time ON public.restaurant_data_changes(created_at DESC);

-- 3. RLS Policies for restaurant_photos
ALTER TABLE public.restaurant_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can upload photos for their restaurant" ON public.restaurant_photos;
CREATE POLICY "Owners can upload photos for their restaurant"
ON public.restaurant_photos FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurant_owners
    WHERE restaurant_id = restaurant_photos.restaurant_id
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can view their restaurant photos" ON public.restaurant_photos;
CREATE POLICY "Owners can view their restaurant photos"
ON public.restaurant_photos FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurant_owners
    WHERE restaurant_id = restaurant_photos.restaurant_id
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can delete their restaurant photos" ON public.restaurant_photos;
CREATE POLICY "Owners can delete their restaurant photos"
ON public.restaurant_photos FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurant_owners
    WHERE restaurant_id = restaurant_photos.restaurant_id
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Public can view active photos" ON public.restaurant_photos;
CREATE POLICY "Public can view active photos"
ON public.restaurant_photos FOR SELECT
USING (status = 'active');

-- 4. RLS Policies for restaurant_data_changes
ALTER TABLE public.restaurant_data_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their restaurant changes" ON public.restaurant_data_changes;
CREATE POLICY "Owners can view their restaurant changes"
ON public.restaurant_data_changes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurant_owners
    WHERE restaurant_id = restaurant_data_changes.restaurant_id
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can log changes" ON public.restaurant_data_changes;
CREATE POLICY "System can log changes"
ON public.restaurant_data_changes FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurant_owners
    WHERE restaurant_id = restaurant_data_changes.restaurant_id
    AND user_id = auth.uid()
  )
);

-- 5. 修改 restaurants 表 RLS - 允許 owner 更新
DROP POLICY IF EXISTS "Owners can update their restaurant data" ON public.restaurants;
CREATE POLICY "Owners can update their restaurant data"
ON public.restaurants FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurant_owners
    WHERE restaurant_id = restaurants.id
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurant_owners
    WHERE restaurant_id = restaurants.id
    AND user_id = auth.uid()
  )
);

-- 6. 創建 Storage Bucket for restaurant photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-photos', 
  'restaurant-photos', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 7. Storage RLS Policies
DROP POLICY IF EXISTS "Owners can upload photos" ON storage.objects;
CREATE POLICY "Owners can upload photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'restaurant-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT restaurant_id::text
    FROM public.restaurant_owners
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can delete their photos" ON storage.objects;
CREATE POLICY "Owners can delete their photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'restaurant-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT restaurant_id::text
    FROM public.restaurant_owners
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Anyone can view restaurant photos" ON storage.objects;
CREATE POLICY "Anyone can view restaurant photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-photos');

-- 8. 自動審核函數 - 每小時執行
DROP FUNCTION IF EXISTS public.auto_approve_pending_photos();
CREATE OR REPLACE FUNCTION public.auto_approve_pending_photos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.restaurant_photos
  SET status = 'active', approved_at = NOW()
  WHERE status = 'pending'
    AND uploaded_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- 9. 設定 pg_cron job（如果 pg_cron 可用）
-- 注意：這需要在 Supabase 中手動啟用 pg_cron extension
-- 如果環境支持，取消下面的註釋：
-- SELECT cron.schedule(
--   'auto-approve-pending-photos',
--   '0 * * * *', -- 每小時執行
--   $$SELECT public.auto_approve_pending_photos();$$
-- );