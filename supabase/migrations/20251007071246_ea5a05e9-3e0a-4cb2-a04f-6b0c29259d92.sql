-- Step 1: Add region fields to restaurants and groups tables

-- Add city and district columns to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS district TEXT;

-- Create indexes for region filtering performance
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON public.restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_district ON public.restaurants(district);
CREATE INDEX IF NOT EXISTS idx_restaurants_city_district ON public.restaurants(city, district);

-- Add target_regions and current_region to groups table
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS target_regions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS current_region TEXT;

-- Create GIN index for target_regions JSONB queries
CREATE INDEX IF NOT EXISTS idx_groups_target_regions ON public.groups USING GIN(target_regions);

-- Comment on new columns for documentation
COMMENT ON COLUMN public.restaurants.city IS 'City where the restaurant is located (e.g., 台北市, 新北市)';
COMMENT ON COLUMN public.restaurants.district IS 'District within the city (e.g., 大安區, 信義區)';
COMMENT ON COLUMN public.groups.target_regions IS 'Array of target regions for group swipes, format: [{"city": "台北市", "districts": ["大安區", "信義區"]}]';
COMMENT ON COLUMN public.groups.current_region IS 'Currently active region filter for the group';