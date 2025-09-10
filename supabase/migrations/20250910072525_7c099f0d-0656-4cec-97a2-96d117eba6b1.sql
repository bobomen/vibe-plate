-- Update RLS policy on groups table to allow users to find groups by code
DROP POLICY IF EXISTS "Users can view groups they're members of" ON public.groups;

CREATE POLICY "Users can view groups they're members of or search by code" 
ON public.groups 
FOR SELECT 
USING (
  -- Allow users to see groups they're members of OR created
  ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = groups.id) AND (group_members.user_id = auth.uid())))) OR (created_by = auth.uid()))
  OR 
  -- Allow authenticated users to search groups by code (for joining)
  (auth.uid() IS NOT NULL)
);