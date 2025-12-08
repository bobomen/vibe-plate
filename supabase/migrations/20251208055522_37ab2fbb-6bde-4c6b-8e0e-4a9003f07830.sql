-- Add temporary_notice column for temporary announcements (e.g., "today closed")
-- Structure: { message: string, type: 'closed' | 'notice', expires_at: timestamp }
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS temporary_notice jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.restaurants.temporary_notice IS 'Temporary notice for the restaurant, e.g., {"message": "今日臨時休息", "type": "closed", "expires_at": "2024-01-15T23:59:59Z"}';