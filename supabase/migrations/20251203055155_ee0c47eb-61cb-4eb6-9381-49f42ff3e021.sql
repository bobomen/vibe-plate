-- 步驟 1：允許 uploaded_by 為 NULL（用於遷移舊照片）
ALTER TABLE restaurant_photos 
ALTER COLUMN uploaded_by DROP NOT NULL;

-- 步驟 2：遷移照片到 restaurant_photos 表
INSERT INTO restaurant_photos (
  restaurant_id,
  photo_url,
  status,
  display_order,
  uploaded_by,
  uploaded_at,
  approved_at
)
SELECT 
  r.id as restaurant_id,
  photo_url,
  'active' as status,
  (ordinality - 1)::integer as display_order,
  (SELECT ro.user_id FROM restaurant_owners ro WHERE ro.restaurant_id = r.id LIMIT 1) as uploaded_by,
  NOW() as uploaded_at,
  NOW() as approved_at
FROM restaurants r,
LATERAL unnest(r.photos) WITH ORDINALITY AS t(photo_url, ordinality)
WHERE r.photos IS NOT NULL 
  AND array_length(r.photos, 1) > 0
  AND NOT EXISTS (
    SELECT 1 FROM restaurant_photos rp 
    WHERE rp.restaurant_id = r.id 
    AND rp.photo_url = t.photo_url
  );

-- 步驟 3：驗證遷移結果
DO $$
DECLARE
  original_count INTEGER;
  migrated_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(array_length(photos, 1)), 0) INTO original_count
  FROM restaurants
  WHERE photos IS NOT NULL AND array_length(photos, 1) > 0;
  
  SELECT COUNT(*) INTO migrated_count
  FROM restaurant_photos
  WHERE status = 'active';
  
  IF migrated_count < original_count THEN
    RAISE EXCEPTION '遷移驗證失敗：原始 % 張，遷移後 % 張', original_count, migrated_count;
  END IF;
  
  RAISE NOTICE '遷移成功：共 % 張照片', migrated_count;
END $$;