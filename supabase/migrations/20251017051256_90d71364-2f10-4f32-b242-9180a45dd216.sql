-- Create Storage Bucket for monthly review photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('monthly-review-photos', 'monthly-review-photos', true);

-- Allow authenticated users to upload their own review photos
CREATE POLICY "Users can upload their own review photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'monthly-review-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow everyone to view review photos
CREATE POLICY "Anyone can view review photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'monthly-review-photos');

-- Create monthly_reviews table
CREATE TABLE public.monthly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_month DATE NOT NULL,
  
  -- User uploaded and ranked restaurant data
  user_ranked_restaurants JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Auto-calculated statistics
  total_swipes INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  like_percentage NUMERIC(5,2) DEFAULT 0,
  total_favorites INTEGER DEFAULT 0,
  most_visited_district TEXT,
  top_cuisine_type TEXT,
  
  -- Generated graphic and sharing info
  graphic_url TEXT,
  generated_at TIMESTAMP WITH TIME ZONE,
  shared_to_platform TEXT,
  shared_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, review_month)
);

-- Enable RLS
ALTER TABLE public.monthly_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reviews"
ON public.monthly_reviews
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews"
ON public.monthly_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.monthly_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger: Auto update updated_at
CREATE TRIGGER update_monthly_reviews_updated_at
  BEFORE UPDATE ON public.monthly_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();