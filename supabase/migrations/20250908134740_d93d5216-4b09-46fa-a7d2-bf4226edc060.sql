-- Add is_premium column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;