-- Fix claim_type check constraint to match the actual values used in code
ALTER TABLE restaurant_claims 
DROP CONSTRAINT IF EXISTS restaurant_claims_claim_type_check;

ALTER TABLE restaurant_claims 
ADD CONSTRAINT restaurant_claims_claim_type_check 
CHECK (claim_type = ANY (ARRAY['existing'::text, 'new'::text]));