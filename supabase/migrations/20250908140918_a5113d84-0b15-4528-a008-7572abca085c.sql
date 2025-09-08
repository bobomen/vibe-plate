-- Add nag-related columns to profiles table for premium upgrade reminders
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS should_nag BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_nag_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS nag_variant TEXT DEFAULT 'default';

-- Create index for better performance on nag queries
CREATE INDEX IF NOT EXISTS idx_profiles_should_nag ON public.profiles(should_nag, last_nag_at);

-- Create function to update nag timestamp
CREATE OR REPLACE FUNCTION public.update_nag_seen(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_nag_at = now(), updated_at = now()
  WHERE user_id = user_uuid;
END;
$$;