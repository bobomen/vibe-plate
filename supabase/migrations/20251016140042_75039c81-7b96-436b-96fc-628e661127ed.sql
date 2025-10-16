-- Add UPDATE and DELETE policies for groups table
-- Only creators can update their own groups
CREATE POLICY "Creators can update their groups"
ON public.groups
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Only creators can delete their own groups
CREATE POLICY "Creators can delete their groups"
ON public.groups
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Improve subscriptions UPDATE policy to restrict modifiable columns
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can update own subscription status"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  AND subscription_type = subscription_type
  AND started_at = started_at
);