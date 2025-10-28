-- Add interaction_metadata JSONB column to user_swipes table for extensible data collection
-- This supports Phase 1 (card interaction), Phase 2 (detail page), and Phase 3+ (future features)

-- Add the JSONB column to store interaction metadata
ALTER TABLE public.user_swipes 
ADD COLUMN IF NOT EXISTS interaction_metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the data structure
COMMENT ON COLUMN public.user_swipes.interaction_metadata IS 'Extensible metadata for user interactions. Current fields: 
- card_view_duration_ms: Time spent viewing the card
- photos_viewed: Array of photo indices viewed
- photos_view_count: Total number of photo views
- hesitation_count: Number of times user started but cancelled swipe (Phase 2)
- detail_interactions: Object with detail page interactions (Phase 2)
- time_context: Object with time/weather context (Phase 3)';

-- Create GIN index for JSONB queries to improve performance
CREATE INDEX IF NOT EXISTS idx_user_swipes_interaction_metadata 
ON public.user_swipes USING GIN (interaction_metadata);

-- Create index on created_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_user_swipes_created_at 
ON public.user_swipes (created_at);

-- Create function to cleanup old interaction data (cost control)
-- Keeps only last 6 months of detailed interaction data
CREATE OR REPLACE FUNCTION public.cleanup_old_interaction_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear interaction_metadata for records older than 6 months
  -- Keep the swipe records but remove detailed interaction data
  UPDATE public.user_swipes 
  SET interaction_metadata = '{}'::jsonb
  WHERE created_at < NOW() - INTERVAL '6 months'
    AND interaction_metadata != '{}'::jsonb;
END;
$$;

-- Add comment to the cleanup function
COMMENT ON FUNCTION public.cleanup_old_interaction_data IS 'Cleans up detailed interaction metadata older than 6 months to control storage costs. Retains swipe records but clears the interaction_metadata JSONB field.';