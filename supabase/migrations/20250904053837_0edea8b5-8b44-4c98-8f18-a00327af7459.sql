-- Fix RLS recursion issue in group_members table
-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view group members of groups they're in" ON public.group_members;

-- Create a security definer function to check if user is in a group
CREATE OR REPLACE FUNCTION public.user_is_in_group(target_group_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.group_members 
    WHERE group_id = target_group_id 
    AND user_id = target_user_id
  );
$$;

-- Create a new non-recursive policy using the security definer function
CREATE POLICY "Users can view group members of groups they're in"
ON public.group_members
FOR SELECT
TO authenticated
USING (public.user_is_in_group(group_id, auth.uid()));