-- Add cuisine_type and price_range columns to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN cuisine_type TEXT,
ADD COLUMN price_range INTEGER DEFAULT 2;

-- Add constraint for price_range to ensure it's between 1-4
ALTER TABLE public.restaurants 
ADD CONSTRAINT price_range_check CHECK (price_range >= 1 AND price_range <= 4);

-- Update some sample data (you can modify these values as needed)
UPDATE public.restaurants 
SET cuisine_type = CASE 
  WHEN name ILIKE '%sushi%' OR name ILIKE '%ramen%' OR name ILIKE '%japanese%' THEN '日式'
  WHEN name ILIKE '%chinese%' OR name ILIKE '%dim sum%' OR name ILIKE '%canton%' THEN '中式'
  WHEN name ILIKE '%italian%' OR name ILIKE '%pizza%' OR name ILIKE '%pasta%' THEN '西式'
  WHEN name ILIKE '%korean%' OR name ILIKE '%bbq%' OR name ILIKE '%kimchi%' THEN '韓式'
  WHEN name ILIKE '%thai%' OR name ILIKE '%pad%' OR name ILIKE '%tom%' THEN '泰式'
  ELSE '其他'
END,
price_range = CASE
  WHEN michelin_stars > 0 THEN 4
  WHEN google_rating > 4.5 THEN 3
  WHEN google_rating > 4.0 THEN 2
  ELSE 1
END;