-- Add bib_gourmand column to restaurants table for 必比登 (Bib Gourmand) recognition
ALTER TABLE public.restaurants 
ADD COLUMN bib_gourmand BOOLEAN DEFAULT false;

-- Update some sample data for bib_gourmand based on existing ratings
UPDATE public.restaurants 
SET bib_gourmand = CASE
  WHEN google_rating >= 4.3 AND google_rating < 4.6 AND michelin_stars = 0 THEN true
  ELSE false
END;