-- Change current_region from text to jsonb for consistency with target_regions
ALTER TABLE public.groups 
  ALTER COLUMN current_region TYPE jsonb USING 
    CASE 
      WHEN current_region IS NULL THEN NULL
      WHEN current_region = '' THEN NULL
      ELSE current_region::jsonb
    END;