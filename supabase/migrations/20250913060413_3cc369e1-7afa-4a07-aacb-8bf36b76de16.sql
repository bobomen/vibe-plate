-- Add RLS policy to allow users to delete their own swipes for testing purposes
CREATE POLICY "Users can delete own swipes" 
ON public.user_swipes 
FOR DELETE 
USING (auth.uid() = user_id);