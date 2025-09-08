-- Add personalization columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN dietary_preferences JSONB DEFAULT '[]'::jsonb,
ADD COLUMN preferred_price_min INTEGER DEFAULT 1,
ADD COLUMN preferred_price_max INTEGER DEFAULT 4,
ADD COLUMN favorite_cuisines JSONB DEFAULT '[]'::jsonb,
ADD COLUMN preferences JSONB DEFAULT '{
  "michelin_stars": false,
  "bib_gourmand": false,
  "has_500_dishes": false
}'::jsonb;