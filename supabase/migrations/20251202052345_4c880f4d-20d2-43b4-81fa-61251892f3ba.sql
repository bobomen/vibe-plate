-- 新增照片排序和 AI 審核欄位
ALTER TABLE restaurant_photos
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_review_result JSONB,
ADD COLUMN IF NOT EXISTS ai_reviewed_at TIMESTAMPTZ;

-- 為現有照片設定 display_order（按上傳時間排序）
UPDATE restaurant_photos
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY restaurant_id ORDER BY uploaded_at ASC) as row_num
  FROM restaurant_photos
) AS subquery
WHERE restaurant_photos.id = subquery.id;

-- 更新同步觸發器，按 display_order 排序
CREATE OR REPLACE FUNCTION sync_photo_to_restaurant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 重建整個 photos 陣列，按 display_order 排序
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
    UPDATE restaurants
    SET photos = COALESCE(
      (
        SELECT array_agg(photo_url ORDER BY display_order ASC)
        FROM restaurant_photos
        WHERE restaurant_id = COALESCE(NEW.restaurant_id, OLD.restaurant_id)
          AND status = 'active'
      ),
      ARRAY[]::text[]
    )
    WHERE id = COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 重新建立觸發器
DROP TRIGGER IF EXISTS sync_photo_trigger ON restaurant_photos;
CREATE TRIGGER sync_photo_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON restaurant_photos
  FOR EACH ROW
  EXECUTE FUNCTION sync_photo_to_restaurant();