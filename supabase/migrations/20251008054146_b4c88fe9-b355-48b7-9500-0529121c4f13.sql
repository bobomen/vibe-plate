-- Step 5: Update existing test data with city and district information
-- Based on actual restaurant addresses in the database

UPDATE public.restaurants
SET 
  city = '台北市',
  district = '大安區'
WHERE id = '1a3a19cb-13db-4467-8eaf-02e0517a430c';

UPDATE public.restaurants
SET 
  city = '台北市',
  district = '中正區'
WHERE id = '5cfed0df-2c75-41bf-8e97-1325338238c7';

UPDATE public.restaurants
SET 
  city = '台北市',
  district = '大同區'
WHERE id = '7ec8455b-56ca-4bee-85c9-3766ab8c6631';

UPDATE public.restaurants
SET 
  city = '台北市',
  district = '中山區'
WHERE id = '28281b1e-fc42-4642-b1db-809be63f01d7';

-- Add column documentation
COMMENT ON COLUMN public.restaurants.city IS 'Restaurant city location (extracted from address)';
COMMENT ON COLUMN public.restaurants.district IS 'Restaurant district location (extracted from address)';