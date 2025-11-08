-- Step 1: Create restaurant_verification_codes table
CREATE TABLE IF NOT EXISTS public.restaurant_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON public.restaurant_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON public.restaurant_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON public.restaurant_verification_codes(expires_at);

-- Step 2: Enable RLS and create policies for restaurant_verification_codes
ALTER TABLE public.restaurant_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification codes"
  ON public.restaurant_verification_codes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification codes"
  ON public.restaurant_verification_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verification codes"
  ON public.restaurant_verification_codes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Step 3: Add missing fields to restaurant_claims table
ALTER TABLE public.restaurant_claims 
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text;