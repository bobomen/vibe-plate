-- Add dietary options and AI classification tracking to restaurants
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS dietary_options jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_classified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ai_confidence numeric(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1);

-- Add minimum rating preference to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS min_rating integer CHECK (min_rating >= 0 AND min_rating <= 5);

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Comment on columns for documentation
COMMENT ON COLUMN public.restaurants.dietary_options IS 'JSON object storing dietary options: {"vegetarian": true, "vegan": false, "halal": false, "gluten_free": false}';
COMMENT ON COLUMN public.restaurants.ai_classified_at IS 'Timestamp when AI classification was performed';
COMMENT ON COLUMN public.restaurants.ai_confidence IS 'AI classification confidence score (0.0 to 1.0)';
COMMENT ON COLUMN public.profiles.min_rating IS 'Minimum Google rating filter (0-5 stars)';